/**
 * Webhook para receber eventos do Resend
 * Eventos: email.sent, email.delivered, email.opened, email.clicked, email.bounced
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateEmailNotificationStatus, cancelScheduledTask } from '@/lib/notifications';
import { createAdminClient } from '@/lib/supabase/admin';

// Tipos de eventos do Resend
type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Para eventos de click
    click?: {
      link: string;
      timestamp: string;
    };
    // Para eventos de bounce
    bounce?: {
      message: string;
    };
  };
}

/**
 * Verifica a assinatura do webhook Resend
 */
function verifyResendSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[Webhook Resend] Secret não configurado - aceitando requisição');
    return true; // Em desenvolvimento, aceitar sem validacao
  }

  if (!signature || !timestamp) {
    return false;
  }

  try {
    // Verificar se o timestamp não é muito antigo (5 minutos)
    const timestampDate = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - timestampDate.getTime()) / (1000 * 60);

    if (diffMinutes > 5) {
      console.warn('[Webhook Resend] Timestamp muito antigo');
      return false;
    }

    // Calcular assinatura esperada
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');

    // Comparar assinaturas
    const signatureValue = signature.replace('v1,', '');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signatureValue)
    );
  } catch (error) {
    console.error('[Webhook Resend] Erro ao verificar assinatura:', error);
    return false;
  }
}

/**
 * Busca o lead_id a partir do email
 */
async function getLeadIdByEmail(email: string): Promise<string | null> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('nps_leads')
      .select('id')
      .eq('email', email)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('svix-signature');
    const timestamp = request.headers.get('svix-timestamp');

    // Verificar assinatura (opcional em dev)
    if (process.env.NODE_ENV === 'production') {
      if (!verifyResendSignature(body, signature, timestamp)) {
        console.error('[Webhook Resend] Assinatura invalida');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(body) as ResendWebhookPayload;

    console.log(`[Webhook Resend] Evento recebido: ${payload.type}`);

    const { type, data } = payload;
    const messageId = data.email_id;
    const recipientEmail = data.to[0];

    // Mapear eventos para status
    let newStatus: 'delivered' | 'opened' | 'failed' | null = null;
    let metadata: Record<string, unknown> = {};

    switch (type) {
      case 'email.delivered':
        newStatus = 'delivered';
        break;

      case 'email.opened':
        newStatus = 'opened';
        metadata = {
          opened: true,
          opened_at: payload.created_at,
        };

        // Cancelar tarefa de WhatsApp agendada
        const leadId = await getLeadIdByEmail(recipientEmail);
        if (leadId) {
          console.log(`[Webhook Resend] Email aberto - cancelando WhatsApp para lead ${leadId}`);
          await cancelScheduledTask(leadId, 'check_email_opened');
        }
        break;

      case 'email.clicked':
        // Apenas atualizar metadata com o link clicado
        if (data.click) {
          const supabase = createAdminClient();
          const { data: notification } = await supabase
            .from('notifications_log')
            .select('metadata')
            .eq('external_id', messageId)
            .single();

          const currentMetadata = (notification?.metadata as Record<string, unknown>) || {};
          const clicks = (currentMetadata.clicks as string[]) || [];
          clicks.push(data.click.link);

          metadata = {
            ...currentMetadata,
            clicks,
            opened: true, // Se clicou, abriu
          };
          newStatus = 'opened';
        }
        break;

      case 'email.bounced':
        newStatus = 'failed';
        metadata = {
          bounced: true,
          bounce_reason: data.bounce?.message,
        };
        break;

      case 'email.complained':
        // Marcado como spam - considerar como falha
        newStatus = 'failed';
        metadata = { complained: true };
        break;

      default:
        // Eventos que nao precisamos tratar
        console.log(`[Webhook Resend] Evento ignorado: ${type}`);
        return NextResponse.json({ received: true });
    }

    // Atualizar status no banco
    if (newStatus) {
      const result = await updateEmailNotificationStatus(messageId, newStatus, metadata);

      if (!result.success) {
        console.error(`[Webhook Resend] Erro ao atualizar status: ${result.error}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook Resend] Erro ao processar webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Endpoint de verificação (GET) para configuracao do webhook
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');

  if (challenge) {
    return new NextResponse(challenge);
  }

  return NextResponse.json({ status: 'Webhook Resend ativo' });
}
