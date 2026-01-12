/**
 * Serviço de WhatsApp via Meta Cloud API
 * Envia mensagens usando templates aprovados no Meta Business
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { WhatsAppSendResult } from '@/types/notification';

// Configuracao da Meta API
const META_API_VERSION = 'v18.0';
const META_API_BASE_URL = 'https://graph.facebook.com';

interface MetaWhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
}

/**
 * Obter configuracao do WhatsApp Meta
 */
function getMetaConfig(): MetaWhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return null;
  }

  return { phoneNumberId, accessToken };
}

interface SendTemplateMessageParams {
  to: string; // Número no formato internacional sem + (ex: 5511999999999)
  templateName: string;
  templateLanguage?: string;
  components?: TemplateComponent[];
}

interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: TemplateParameter[];
}

interface TemplateParameter {
  type: 'text' | 'image' | 'document' | 'vídeo';
  text?: string;
  image?: { link: string };
}

interface MetaApiResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

/**
 * Formata número de telefone para o formato da API Meta
 * Remove caracteres especiais e adiciona código do país se necessario
 */
export function formatPhoneNumber(phone: string): string {
  // Remove tudo que não é dígito
  let cleaned = phone.replace(/\D/g, '');

  // Se comeca com 0, remove
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Se não tem código do país (Brasil = 55), adiciona
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }

  return cleaned;
}

/**
 * Envia uma mensagem usando template do WhatsApp
 */
export async function sendTemplateMessage({
  to,
  templateName,
  templateLanguage = 'pt_BR',
  components = [],
}: SendTemplateMessageParams): Promise<WhatsAppSendResult> {
  const config = getMetaConfig();

  if (!config) {
    console.warn('[WhatsApp] Meta API não configurada - pulando envio');
    return { success: false, error: 'WhatsApp não configurado' };
  }

  const formattedPhone = formatPhoneNumber(to);

  try {
    const url = `${META_API_BASE_URL}/${META_API_VERSION}/${config.phoneNumberId}/messages`;

    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: templateLanguage,
        },
      },
    };

    // Adicionar componentes se houver
    if (components.length > 0) {
      (body.template as Record<string, unknown>).components = components;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as MetaApiError;
      console.error('[WhatsApp] Erro da Meta API:', errorData);
      return {
        success: false,
        error: errorData.error?.message || 'Erro ao enviar mensagem',
      };
    }

    const data = (await response.json()) as MetaApiResponse;
    const messageId = data.messages?.[0]?.id;

    console.log(`[WhatsApp] Mensagem enviada para ${formattedPhone}: ${messageId}`);
    return { success: true, message_id: messageId };
  } catch (err) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', err);
    return { success: false, error: 'Erro ao enviar mensagem' };
  }
}

interface SendApprovalWhatsAppParams {
  to: string;
  name: string;
  siteName?: string;
  registrationUrl: string;
  leadId?: string;
}

/**
 * Envia mensagem de aprovação via WhatsApp
 * Usa o template "candidate_approved"
 */
export async function sendApprovalWhatsApp({
  to,
  name,
  siteName = 'Arena Te Amo',
  registrationUrl,
  leadId,
}: SendApprovalWhatsAppParams): Promise<WhatsAppSendResult> {
  // Componentes do template com parametros dinamicos
  const components: TemplateComponent[] = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: name },
        { type: 'text', text: siteName },
        { type: 'text', text: registrationUrl },
      ],
    },
  ];

  const result = await sendTemplateMessage({
    to,
    templateName: 'candidate_approved',
    components,
  });

  // Se temos leadId e sucesso, registrar no log
  if (leadId && result.success && result.message_id) {
    await logWhatsAppNotification({
      leadId,
      messageId: result.message_id,
      status: 'sent',
      templateName: 'candidate_approved',
    });
  }

  return result;
}

interface LogWhatsAppNotificationParams {
  leadId: string;
  messageId: string;
  status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'failed' | 'cancelled';
  templateName?: string;
}

/**
 * Registra uma notificacao de WhatsApp no banco de dados
 */
export async function logWhatsAppNotification({
  leadId,
  messageId,
  status = 'sent',
  templateName,
}: LogWhatsAppNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('notifications_log')
      .upsert(
        {
          lead_id: leadId,
          channel: 'whatsapp',
          status,
          external_id: messageId,
          sent_at: new Date().toISOString(),
          metadata: {
            template_name: templateName,
            delivery_status: status,
          },
        },
        { onConflict: 'lead_id,channel' }
      );

    if (error) {
      console.error('[WhatsApp] Erro ao registrar notificacao:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[WhatsApp] Erro ao registrar notificacao:', err);
    return { success: false, error: 'Erro ao registrar notificacao' };
  }
}

/**
 * Atualiza o status de uma notificacao de WhatsApp
 */
export async function updateWhatsAppNotificationStatus(
  messageId: string,
  status: 'delivered' | 'opened' | 'failed',
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {
      status,
      metadata: {
        delivery_status: status,
        ...metadata,
      },
    };

    const { error } = await supabase
      .from('notifications_log')
      .update(updateData)
      .eq('external_id', messageId)
      .eq('channel', 'whatsapp');

    if (error) {
      console.error('[WhatsApp] Erro ao atualizar status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[WhatsApp] Erro ao atualizar status:', err);
    return { success: false, error: 'Erro ao atualizar status' };
  }
}

/**
 * Verifica se a API Meta esta configurada
 */
export function isMetaWhatsAppConfigured(): boolean {
  return getMetaConfig() !== null;
}

/**
 * Valida a assinatura do webhook da Meta
 */
export function verifyMetaWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.warn('[WhatsApp] App secret não configurado');
    return false;
  }

  try {
    // A assinatura vem no formato "sha256=xxx"
    const expectedSignature = signature.split('sha256=')[1];

    if (!expectedSignature) {
      return false;
    }

    // Calcular HMAC SHA256
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    return calculatedSignature === expectedSignature;
  } catch {
    return false;
  }
}
