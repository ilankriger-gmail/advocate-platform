'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

// ============ TYPES ============

export type AudienceFilter = 
  | { type: 'all' }
  | { type: 'recent_days'; days: number }
  | { type: 'min_hearts'; minHearts: number }
  | { type: 'onboarding_completed' }
  | { type: 'onboarding_not_completed' };

export interface BroadcastRecord {
  id: string;
  subject: string;
  title: string;
  message: string;
  cta_text: string | null;
  cta_url: string | null;
  audience_filter: string;
  recipients_count: number;
  sent_count: number;
  sent_by: string;
  created_at: string;
}

// ============ HELPERS ============

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');
  
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (!profile || profile.role !== 'admin') throw new Error('Sem permissão');
  return user.id;
}

function buildEmailHtml({
  title,
  message,
  ctaText,
  ctaUrl,
}: {
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}) {
  const siteName = 'Arena Te Amo';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">❤️ ${siteName}</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #111827; margin: 0 0 20px; font-size: 24px;">${title}</h2>
                  <div style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                    ${message}
                  </div>
                  ${ctaText && ctaUrl ? `
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: bold;">
                          ${ctaText}
                        </a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                    Com carinho,<br>
                    <strong style="color: #ec4899;">Equipe ${siteName}</strong>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ============ ACTIONS ============

/**
 * Contar destinatários para um filtro de público
 */
export async function countRecipients(filter: AudienceFilter): Promise<{ count: number; error?: string }> {
  try {
    await verifyAdmin();
    const supabase = createAdminClient();

    let query = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .not('email', 'is', null);

    switch (filter.type) {
      case 'recent_days': {
        const since = new Date();
        since.setDate(since.getDate() - filter.days);
        query = query.gte('created_at', since.toISOString());
        break;
      }
      case 'min_hearts': {
        // Need to join with user_coins
        const { data: usersWithHearts, error } = await supabase
          .from('user_coins')
          .select('user_id', { count: 'exact' })
          .gte('balance', filter.minHearts);
        
        if (error) return { count: 0, error: error.message };
        return { count: usersWithHearts?.length || 0 };
      }
      case 'onboarding_completed':
        query = query.eq('onboarding_completed', true);
        break;
      case 'onboarding_not_completed':
        query = query.or('onboarding_completed.is.null,onboarding_completed.eq.false');
        break;
      // 'all' - no additional filters
    }

    const { count, error } = await query;
    if (error) return { count: 0, error: error.message };
    return { count: count || 0 };
  } catch (err) {
    return { count: 0, error: (err as Error).message };
  }
}

/**
 * Enviar broadcast de email
 */
export async function sendBroadcast({
  subject,
  title,
  message,
  ctaText,
  ctaUrl,
  filter,
}: {
  subject: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  filter: AudienceFilter;
}): Promise<{ success: boolean; sent: number; total: number; error?: string }> {
  try {
    const adminId = await verifyAdmin();
    const supabase = createAdminClient();
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      return { success: false, sent: 0, total: 0, error: 'RESEND_API_KEY não configurada' };
    }

    // Buscar destinatários
    let users: { email: string; full_name: string | null; id: string }[] = [];

    if (filter.type === 'min_hearts') {
      // Join user_coins
      const { data: coinsUsers } = await supabase
        .from('user_coins')
        .select('user_id')
        .gte('balance', filter.minHearts);
      
      if (coinsUsers && coinsUsers.length > 0) {
        const userIds = coinsUsers.map(u => u.user_id);
        const { data } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('id', userIds)
          .not('email', 'is', null);
        users = data || [];
      }
    } else {
      let query = supabase
        .from('users')
        .select('id, email, full_name')
        .not('email', 'is', null);

      switch (filter.type) {
        case 'recent_days': {
          const since = new Date();
          since.setDate(since.getDate() - filter.days);
          query = query.gte('created_at', since.toISOString());
          break;
        }
        case 'onboarding_completed':
          query = query.eq('onboarding_completed', true);
          break;
        case 'onboarding_not_completed':
          query = query.or('onboarding_completed.is.null,onboarding_completed.eq.false');
          break;
      }

      const { data } = await query;
      users = data || [];
    }

    if (users.length === 0) {
      return { success: false, sent: 0, total: 0, error: 'Nenhum destinatário encontrado' };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@omocodoteamo.com.br';
    const siteName = 'Arena Te Amo';
    const html = buildEmailHtml({ title, message, ctaText, ctaUrl });
    let sentCount = 0;

    // Enviar em lotes de 10
    for (let i = 0; i < users.length; i += 10) {
      const batch = users.slice(i, i + 10);
      
      await Promise.all(
        batch.map(async (user) => {
          if (!user.email) return;
          try {
            await resend.emails.send({
              from: `${siteName} <${fromEmail}>`,
              to: [user.email],
              subject,
              html,
            });
            sentCount++;
          } catch (err) {
            console.error(`Erro ao enviar para ${user.email}:`, err);
          }
        })
      );

      // Pausa entre lotes
      if (i + 10 < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Salvar no histórico
    const filterLabel = filter.type === 'all' ? 'Todos' :
      filter.type === 'recent_days' ? `Últimos ${filter.days} dias` :
      filter.type === 'min_hearts' ? `Mín. ${filter.minHearts} corações` :
      filter.type === 'onboarding_completed' ? 'Onboarding completo' :
      'Onboarding não completo';

    await supabase.from('email_broadcasts').insert({
      subject,
      title,
      message,
      cta_text: ctaText || null,
      cta_url: ctaUrl || null,
      audience_filter: filterLabel,
      recipients_count: users.length,
      sent_count: sentCount,
      sent_by: adminId,
    });

    return { success: true, sent: sentCount, total: users.length };
  } catch (err) {
    return { success: false, sent: 0, total: 0, error: (err as Error).message };
  }
}

/**
 * Buscar histórico de broadcasts
 */
export async function fetchBroadcastHistory(): Promise<{ data: BroadcastRecord[]; error?: string }> {
  try {
    await verifyAdmin();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('email_broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { data: [], error: error.message };
    return { data: data || [] };
  } catch (err) {
    return { data: [], error: (err as Error).message };
  }
}
