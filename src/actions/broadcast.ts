'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

/**
 * Envia email de anúncio para todos os usuários ativos
 */
export async function sendAnnouncementEmail({
  subject,
  title,
  message,
  ctaText,
  ctaUrl,
}: {
  subject: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}): Promise<{ success: boolean; sent: number; error?: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = createAdminClient();

  if (!process.env.RESEND_API_KEY) {
    return { success: false, sent: 0, error: 'RESEND_API_KEY não configurada' };
  }

  // Buscar todos os usuários com email
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('email, full_name')
    .not('email', 'is', null);

  if (usersError || !users) {
    return { success: false, sent: 0, error: 'Erro ao buscar usuários' };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@omocodoteamo.com.br';
  const siteName = 'Arena Te Amo';
  let sentCount = 0;

  // Enviar emails em lotes de 10
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
            `,
          });
          sentCount++;
        } catch (err) {
          console.error(`Erro ao enviar para ${user.email}:`, err);
        }
      })
    );

    // Pequena pausa entre lotes para não exceder rate limit
    if (i + 10 < users.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { success: true, sent: sentCount };
}
