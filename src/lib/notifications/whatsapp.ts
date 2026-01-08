import twilio from 'twilio';
import type { Twilio } from 'twilio';
import { getSiteSettings } from '@/lib/config/site';

// Cliente Twilio inicializado lazily
let twilioClient: Twilio | null = null;

function getTwilioClient(): Twilio | null {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

interface SendApprovalWhatsAppParams {
  to: string;
  name: string;
  email?: string;
  loginUrl?: string;
}

/**
 * Formata numero de telefone para WhatsApp
 * Aceita formatos: (11) 99999-9999, 11999999999, +5511999999999
 */
function formatPhoneNumber(phone: string): string {
  // Remove tudo que nao e numero
  const digits = phone.replace(/\D/g, '');

  // Se ja tem codigo do pais (55), usa direto
  if (digits.startsWith('55') && digits.length >= 12) {
    return `whatsapp:+${digits}`;
  }

  // Se nao tem codigo do pais, adiciona +55
  if (digits.length >= 10) {
    return `whatsapp:+55${digits}`;
  }

  throw new Error('Numero de telefone invalido');
}

/**
 * Envia mensagem de aprovacao via WhatsApp
 */
export async function sendApprovalWhatsApp({
  to,
  name,
  email,
  loginUrl,
}: SendApprovalWhatsAppParams): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getTwilioClient();
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (!client) {
      console.warn('Twilio client not configured - skipping WhatsApp');
      return { success: false, error: 'Servico de WhatsApp nao configurado' };
    }

    // Buscar configuracoes do site
    const settings = await getSiteSettings(['site_name']);
    const siteName = settings.site_name;

    // Gerar link de cadastro com email pre-preenchido
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nextlovers.com';
    const registrationUrl = loginUrl || (email
      ? `${baseUrl}/registro?email=${encodeURIComponent(email)}`
      : `${baseUrl}/registro`);

    const formattedNumber = formatPhoneNumber(to);

    const message = await client.messages.create({
      body: `Oi ${name}! 🎉

Temos uma noticia incrivel: sua solicitacao para o ${siteName} foi *APROVADA*!

Agora voce pode criar sua conta e participar de:
✨ Desafios exclusivos
🎁 Premios incriveis
🎉 Eventos especiais

Clique aqui para criar sua conta: ${registrationUrl}

Bem-vindo a comunidade! 💜
Equipe ${siteName}`,
      from: twilioWhatsAppNumber.startsWith('whatsapp:')
        ? twilioWhatsAppNumber
        : `whatsapp:${twilioWhatsAppNumber}`,
      to: formattedNumber,
    });

    if (message.errorCode) {
      console.error('WhatsApp error:', message.errorMessage);
      return { success: false, error: message.errorMessage || 'Erro ao enviar WhatsApp' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error sending WhatsApp:', err);
    return { success: false, error: 'Erro ao enviar WhatsApp' };
  }
}
