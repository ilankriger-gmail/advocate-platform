import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@omocodoteamo.com.br';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: `Arena Te Amo <${fromEmail}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Erro ao enviar:', error);
      return { success: false, error };
    }

    console.log('[Email] Enviado com sucesso:', data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Email] Erro:', err);
    return { success: false, error: err };
  }
}

/**
 * Email de aprovação de desafio
 */
export async function sendChallengeApprovedEmail({
  to,
  userName,
  challengeTitle,
  coinsReward,
}: {
  to: string;
  userName: string;
  challengeTitle: string;
  coinsReward: number;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); padding: 40px 20px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Parabéns!</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
            Olá <strong>${userName}</strong>!
          </p>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Seu desafio <strong>"${challengeTitle}"</strong> foi <span style="color: #10b981; font-weight: bold;">APROVADO</span>! 🏆
          </p>
          
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">Você ganhou</p>
            <p style="margin: 10px 0 0; font-size: 32px; font-weight: bold; color: #d97706;">
              +${coinsReward} ❤️
            </p>
            <p style="margin: 5px 0 0; font-size: 14px; color: #92400e;">corações</p>
          </div>
          
          <p style="font-size: 14px; color: #777; line-height: 1.6;">
            Continue participando dos desafios e acumulando corações para trocar por prêmios incríveis!
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://comunidade.omocodoteamo.com.br/desafios" 
               style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); color: white; padding: 14px 28px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Ver mais desafios
            </a>
          </div>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          Arena Te Amo — A comunidade do Moço do Te Amo ❤️
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `🎉 Parabéns! Você ganhou ${coinsReward} corações no desafio "${challengeTitle}"`,
    html,
  });
}
