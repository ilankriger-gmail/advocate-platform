import { Resend } from 'resend';
import { getSiteSettings } from '@/lib/config/site';
import { createAdminClient } from '@/lib/supabase/admin';
import type { EmailSendResult } from '@/types/notification';

// Cliente Resend inicializado lazily
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

interface SendApprovalEmailParams {
  to: string;
  name: string;
  loginUrl?: string;
  leadId?: string; // ID do lead para logging
}

interface LogEmailNotificationParams {
  leadId: string;
  messageId: string;
  status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'failed' | 'cancelled';
}

/**
 * Registra uma notificacao de email no banco de dados
 */
export async function logEmailNotification({
  leadId,
  messageId,
  status = 'sent',
}: LogEmailNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('notifications_log')
      .upsert(
        {
          lead_id: leadId,
          channel: 'email',
          status,
          external_id: messageId,
          sent_at: new Date().toISOString(),
          metadata: { opened: false },
        },
        { onConflict: 'lead_id,channel' }
      );

    if (error) {
      console.error('[Email] Erro ao registrar notificacao:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[Email] Erro ao registrar notificacao:', err);
    return { success: false, error: 'Erro ao registrar notificacao' };
  }
}

/**
 * Atualiza o status de uma notificacao de email
 */
export async function updateEmailNotificationStatus(
  messageId: string,
  status: 'delivered' | 'opened' | 'failed',
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = { status };
    if (metadata) {
      updateData.metadata = metadata;
    }

    const { error } = await supabase
      .from('notifications_log')
      .update(updateData)
      .eq('external_id', messageId);

    if (error) {
      console.error('[Email] Erro ao atualizar status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[Email] Erro ao atualizar status:', err);
    return { success: false, error: 'Erro ao atualizar status' };
  }
}

/**
 * Envia email de aprovacao para o lead com link de cadastro
 * Retorna message_id para rastreamento de abertura
 */
export async function sendApprovalEmail({
  to,
  name,
  loginUrl,
  leadId,
}: SendApprovalEmailParams): Promise<EmailSendResult> {
  // Gerar link de cadastro com email pre-preenchido
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nextlovers.com';
  const registrationUrl = loginUrl || `${baseUrl}/registro?email=${encodeURIComponent(to)}`;
  try {
    const resend = getResendClient();

    if (!resend) {
      console.warn('Resend not configured - skipping email');
      return { success: false, error: 'Servico de email nao configurado' };
    }

    // Buscar configuracoes do site
    const settings = await getSiteSettings(['site_name', 'email_from_name']);
    const siteName = settings.site_name;
    const fromName = settings.email_from_name;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nextlovers.com';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: `Voce foi aprovado para o ${siteName}!`,
      html: `
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
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${siteName}</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #111827; margin: 0 0 20px; font-size: 24px;">Ola ${name}!</h2>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Temos uma otima noticia! Sua solicitacao para fazer parte da comunidade <strong>${siteName}</strong> foi <strong style="color: #10b981;">APROVADA</strong>!
                      </p>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                        Agora voce pode criar sua conta na plataforma e participar de:
                      </p>

                      <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                        <li>Desafios exclusivos</li>
                        <li>Eventos especiais</li>
                        <li>Premios incriveis</li>
                        <li>Conteudos exclusivos</li>
                      </ul>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: bold;">
                              Criar Minha Conta
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                        Use o email <strong>${to}</strong> para criar sua conta.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                        Te esperamos la!<br>
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
      `,
    });

    if (error) {
      console.error('[Email] Erro ao enviar:', error);
      return { success: false, error: error.message };
    }

    const messageId = data?.id;

    // Se temos leadId, registrar a notificacao no banco
    if (leadId && messageId) {
      await logEmailNotification({
        leadId,
        messageId,
        status: 'sent',
      });
    }

    return { success: true, message_id: messageId };
  } catch (err) {
    console.error('[Email] Erro ao enviar:', err);
    return { success: false, error: 'Erro ao enviar email' };
  }
}

/**
 * Verifica se um email foi aberto pelo lead
 */
export async function checkEmailOpened(leadId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('notifications_log')
      .select('status, metadata')
      .eq('lead_id', leadId)
      .eq('channel', 'email')
      .single();

    if (error || !data) {
      return false;
    }

    // Verificar se status e 'opened' ou se metadata.opened e true
    const metadata = data.metadata as Record<string, unknown> | null;
    return data.status === 'opened' || metadata?.opened === true;
  } catch {
    return false;
  }
}
