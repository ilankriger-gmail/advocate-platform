/**
 * CRON Processor para tarefas agendadas
 * Processa tarefas pendentes a cada 15 minutos
 *
 * Configurar no Vercel (vercel.json):
 * { "crons": [{ "path": "/api/cron/process-tasks", "schedule": "0/15 * * * *" }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getNextPendingTasks,
  incrementTaskAttempts,
  markTaskCompleted,
  markTaskFailed,
  checkEmailOpened,
  sendApprovalWhatsApp,
  isMetaWhatsAppConfigured,
} from '@/lib/notifications';
import { getSiteSettings } from '@/lib/config/site';
import type { ScheduledTask, TaskProcessingResult, CheckEmailOpenedPayload } from '@/types/notification';

// Limite de tarefas por execucao
const TASKS_PER_RUN = 20;

/**
 * Verifica se a requisicao e do Vercel Cron
 */
function isValidCronRequest(request: NextRequest): boolean {
  // Em producao, verificar o header de autorizacao do Vercel
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Se CRON_SECRET esta configurado, validar
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  // Em desenvolvimento, aceitar requisicoes locais
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  // Verificar header do Vercel Cron
  const vercelCron = request.headers.get('x-vercel-cron');
  return vercelCron === '1';
}

/**
 * Processa uma tarefa do tipo check_email_opened
 */
async function processCheckEmailOpened(task: ScheduledTask): Promise<{
  success: boolean;
  sentWhatsApp: boolean;
  error?: string;
}> {
  const leadId = task.lead_id;

  if (!leadId) {
    return { success: false, sentWhatsApp: false, error: 'Lead ID nao encontrado' };
  }

  try {
    const supabase = createAdminClient();

    // Verificar se o email foi aberto
    const emailOpened = await checkEmailOpened(leadId);

    if (emailOpened) {
      console.log(`[CRON] Email aberto para lead ${leadId} - nao enviar WhatsApp`);
      return { success: true, sentWhatsApp: false };
    }

    // Email nao foi aberto - verificar se o lead tem WhatsApp opt-in
    const { data: lead, error: leadError } = await supabase
      .from('nps_leads')
      .select('id, name, email, phone, whatsapp_opted_in')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return { success: false, sentWhatsApp: false, error: 'Lead nao encontrado' };
    }

    // Verificar se tem telefone e optou por WhatsApp
    if (!lead.phone || !lead.whatsapp_opted_in) {
      console.log(`[CRON] Lead ${leadId} nao tem telefone ou nao optou por WhatsApp`);
      return { success: true, sentWhatsApp: false };
    }

    // Verificar se WhatsApp Meta esta configurado
    if (!isMetaWhatsAppConfigured()) {
      console.warn('[CRON] WhatsApp Meta nao configurado - pulando envio');
      return { success: true, sentWhatsApp: false };
    }

    // Buscar configuracoes do site
    const settings = await getSiteSettings(['site_name']);
    const siteName = settings.site_name;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nextlovers.com';
    const registrationUrl = `${baseUrl}/registro?email=${encodeURIComponent(lead.email)}`;

    // Enviar WhatsApp
    console.log(`[CRON] Enviando WhatsApp para lead ${leadId} (${lead.phone})`);
    const result = await sendApprovalWhatsApp({
      to: lead.phone,
      name: lead.name,
      siteName,
      registrationUrl,
      leadId,
    });

    if (!result.success) {
      return { success: false, sentWhatsApp: false, error: result.error };
    }

    // Atualizar lead com whatsapp_sent
    await supabase
      .from('nps_leads')
      .update({
        whatsapp_sent: true,
        whatsapp_sent_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    console.log(`[CRON] WhatsApp enviado com sucesso para lead ${leadId}`);
    return { success: true, sentWhatsApp: true };
  } catch (error) {
    console.error(`[CRON] Erro ao processar tarefa para lead ${leadId}:`, error);
    return { success: false, sentWhatsApp: false, error: 'Erro interno' };
  }
}

/**
 * Processa uma tarefa agendada
 */
async function processTask(task: ScheduledTask): Promise<{
  success: boolean;
  sentWhatsApp: boolean;
  error?: string;
}> {
  switch (task.type) {
    case 'check_email_opened':
      return processCheckEmailOpened(task);

    case 'send_reminder':
      // TODO: Implementar lembretes
      console.log(`[CRON] Tipo send_reminder nao implementado`);
      return { success: true, sentWhatsApp: false };

    case 'cleanup':
      // TODO: Implementar limpeza
      console.log(`[CRON] Tipo cleanup nao implementado`);
      return { success: true, sentWhatsApp: false };

    default:
      return { success: false, sentWhatsApp: false, error: `Tipo desconhecido: ${task.type}` };
  }
}

export async function GET(request: NextRequest) {
  // Validar que e uma requisicao legitima do CRON
  if (!isValidCronRequest(request)) {
    console.error('[CRON] Requisicao nao autorizada');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  const result: TaskProcessingResult = {
    processed: 0,
    sent_whatsapp: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    console.log('[CRON] Iniciando processamento de tarefas...');

    // Buscar tarefas pendentes
    const { tasks, error } = await getNextPendingTasks(TASKS_PER_RUN);

    if (error) {
      console.error('[CRON] Erro ao buscar tarefas:', error);
      return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 });
    }

    if (tasks.length === 0) {
      console.log('[CRON] Nenhuma tarefa pendente');
      return NextResponse.json({
        message: 'Nenhuma tarefa pendente',
        ...result,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[CRON] Processando ${tasks.length} tarefa(s)...`);

    // Processar cada tarefa
    for (const task of tasks) {
      try {
        // Incrementar tentativas e marcar como processing
        const { success: incrementSuccess, attempts } = await incrementTaskAttempts(task.id);

        if (!incrementSuccess) {
          result.failed++;
          result.errors.push(`Falha ao incrementar tentativas para ${task.id}`);
          continue;
        }

        // Processar a tarefa
        const taskResult = await processTask(task);

        if (taskResult.success) {
          await markTaskCompleted(task.id);
          result.processed++;

          if (taskResult.sentWhatsApp) {
            result.sent_whatsapp++;
          } else {
            result.skipped++;
          }
        } else {
          await markTaskFailed(task.id, taskResult.error || 'Erro desconhecido');
          result.failed++;
          result.errors.push(taskResult.error || 'Erro desconhecido');
        }
      } catch (taskError) {
        console.error(`[CRON] Erro ao processar tarefa ${task.id}:`, taskError);
        await markTaskFailed(task.id, 'Erro inesperado');
        result.failed++;
        result.errors.push(`Erro inesperado na tarefa ${task.id}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[CRON] Concluido em ${duration}ms: ` +
      `${result.processed} processadas, ${result.sent_whatsapp} WhatsApps enviados, ` +
      `${result.skipped} puladas, ${result.failed} falhas`
    );

    return NextResponse.json({
      message: 'Processamento concluido',
      ...result,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('[CRON] Erro geral:', error);
    return NextResponse.json(
      {
        error: 'Erro interno',
        ...result,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Tambem aceitar POST para compatibilidade
export async function POST(request: NextRequest) {
  return GET(request);
}
