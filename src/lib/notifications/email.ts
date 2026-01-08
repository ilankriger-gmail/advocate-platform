import { Resend } from 'resend';

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
}

/**
 * Envia email de aprovacao para o lead
 */
export async function sendApprovalEmail({
  to,
  name,
  loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nextlovers.com',
}: SendApprovalEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();

    if (!resend) {
      console.warn('Resend not configured - skipping email');
      return { success: false, error: 'Servico de email nao configurado' };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nextlovers.com';

    const { error } = await resend.emails.send({
      from: `NextLOVERS <${fromEmail}>`,
      to: [to],
      subject: 'Voce foi aprovado para o NextLOVERS!',
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
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">NextLOVERS</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #111827; margin: 0 0 20px; font-size: 24px;">Ola ${name}!</h2>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Temos uma otima noticia! Sua solicitacao para fazer parte da comunidade <strong>NextLOVERS</strong> foi <strong style="color: #10b981;">APROVADA</strong>!
                      </p>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                        Agora voce pode acessar a plataforma e participar de:
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
                            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: bold;">
                              Acessar a Comunidade
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                        Te esperamos la!<br>
                        <strong style="color: #ec4899;">Equipe NextLOVERS</strong>
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
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error sending email:', err);
    return { success: false, error: 'Erro ao enviar email' };
  }
}
