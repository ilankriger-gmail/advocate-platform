/**
 * Webhook para receber eventos do WhatsApp (Meta Cloud API)
 * Eventos: message status updates (sent, delivered, read, failed)
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateWhatsAppNotificationStatus } from '@/lib/notifications';
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/security/rate-limit';
import { maskId } from '@/lib/sanitize';

// Tipos de status do WhatsApp
type WhatsAppMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      statuses?: Array<{
        id: string;
        status: WhatsAppMessageStatus;
        timestamp: string;
        recipient_id: string;
        errors?: Array<{
          code: number;
          title: string;
          message: string;
          error_data: {
            details: string;
          };
        }>;
      }>;
      messages?: Array<{
        id: string;
        from: string;
        timestamp: string;
        type: string;
        text?: {
          body: string;
        };
      }>;
    };
    field: string;
  }>;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

/**
 * Verifica a assinatura do webhook da Meta
 */
function verifyMetaSignature(payload: string, signature: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.error('[Webhook WhatsApp] WHATSAPP_APP_SECRET não configurado - requisição será rejeitada');
    return false;
  }

  if (!signature) {
    return false;
  }

  try {
    // A assinatura vem no formato "sha256=xxx"
    const expectedSignature = signature.split('sha256=')[1];

    if (!expectedSignature) {
      return false;
    }

    // Calcular HMAC SHA256
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Webhook WhatsApp] Erro ao verificar assinatura:', error);
    return false;
  }
}

/**
 * Mapeia status do WhatsApp para status do nosso sistema
 */
function mapWhatsAppStatus(
  status: WhatsAppMessageStatus
): 'delivered' | 'opened' | 'failed' | null {
  switch (status) {
    case 'delivered':
      return 'delivered';
    case 'read':
      return 'opened'; // "read" no WhatsApp = "opened" no nosso sistema
    case 'failed':
      return 'failed';
    default:
      return null; // "sent" nao precisa atualizar
  }
}

export async function POST(request: NextRequest) {
  try {
    // SEGURANCA: Rate limiting para prevenir abuso
    const ip = getClientIP(request);
    const rateLimitResult = await checkRateLimit(`webhook:whatsapp:${ip}`, RATE_LIMITS.webhook);
    if (!rateLimitResult.success) {
      console.warn('[Webhook WhatsApp] Rate limit excedido');
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // SEGURANCA: Validar Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('[Webhook WhatsApp] Content-Type invalido');
      return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verificar assinatura
    if (!verifyMetaSignature(body, signature)) {
      console.error('[Webhook WhatsApp] Assinatura invalida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body) as WhatsAppWebhookPayload;

    // Verificar se e um webhook do WhatsApp
    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ received: true });
    }

    // Processar cada entry
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Processar status updates
        if (value.statuses) {
          for (const statusUpdate of value.statuses) {
            const messageId = statusUpdate.id;
            const status = statusUpdate.status;
            const timestamp = statusUpdate.timestamp;

            console.log(`[Webhook WhatsApp] Status update: ${messageId} -> ${status}`);

            const mappedStatus = mapWhatsAppStatus(status);

            if (mappedStatus) {
              const metadata: Record<string, unknown> = {
                delivery_status: status,
                status_timestamp: new Date(parseInt(timestamp, 10) * 1000).toISOString(),
              };

              // Se falhou, adicionar detalhes do erro
              if (status === 'failed' && statusUpdate.errors) {
                metadata.error_code = statusUpdate.errors[0]?.code;
                metadata.error_message = statusUpdate.errors[0]?.message;
              }

              // Se foi lido, adicionar read_at
              if (status === 'read') {
                metadata.read_at = metadata.status_timestamp;
              }

              const result = await updateWhatsAppNotificationStatus(
                messageId,
                mappedStatus,
                metadata
              );

              if (!result.success) {
                console.error(`[Webhook WhatsApp] Erro ao atualizar status: ${result.error}`);
              }
            }
          }
        }

        // Processar mensagens recebidas (opcional - para respostas dos usuários)
        if (value.messages) {
          for (const message of value.messages) {
            console.log(
              `[Webhook WhatsApp] Mensagem recebida de ${message.from}: ${message.text?.body || '[media]'}`
            );
            // Aqui podemos implementar logica para respostas no futuro
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook WhatsApp] Erro ao processar webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET - Verificação do webhook (desafio da Meta)
 * A Meta envia um GET com hub.mode, hub.verify_token e hub.challenge
 */
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  // Verificar se é uma requisição de verificação da Meta
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook WhatsApp] Verificação bem-sucedida');
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Se nao for verificação, retornar status
  return NextResponse.json({ status: 'Webhook WhatsApp ativo' });
}
