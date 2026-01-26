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
  sendFollowupEmail,
  sendOnboardingEmail,
  isMetaWhatsAppConfigured,
  scheduleWhatsAppFinal,
  cancelAllLeadTasks,
} from '@/lib/notifications';
import { getSiteSettings } from '@/lib/config/site';
import { checkLeadConversion, updateLeadSequenceStep } from '@/actions/leads';
import { processarRespostasAgendadas } from '@/actions/autoresponder';
import type { ScheduledTask, TaskProcessingResult } from '@/types/notification';

// Limite de tarefas por execucao
const TASKS_PER_RUN = 20;

/**
 * Verifica se a requisicao e do Vercel Cron
 * SEGURANCA: Sempre exige CRON_SECRET para prevenir execucao nao autorizada
 */
function isValidCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // SEGURANCA: CRON_SECRET e OBRIGATORIO em todos os ambientes
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET nao configurado - endpoint desabilitado');
    return false;
  }

  // Validar token de autorizacao
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Verificar header do Vercel Cron como fallback adicional (nao substitui CRON_SECRET)
  // Isso permite que o Vercel Cron funcione junto com a validacao do secret
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron === '1') {
    // Mesmo com o header do Vercel, ainda precisa do secret no header Authorization
    // Esta verificacao e apenas para logging
    console.log('[CRON] Requisicao do Vercel Cron detectada');
  }

  return false;
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
    return { success: false, sentWhatsApp: false, error: 'Lead ID não encontrado' };
  }

  try {
    const supabase = createAdminClient();

    // Verificar se o email foi aberto
    const emailOpened = await checkEmailOpened(leadId);

    if (emailOpened) {
      console.log(`[CRON] Email aberto para lead ${leadId} - nao enviar WhatsApp`);
      return { success: true, sentWhatsApp: false };
    }

    // Email não foi aberto - verificar se o lead tem WhatsApp opt-in
    const { data: lead, error: leadError } = await supabase
      .from('nps_leads')
      .select('id, name, email, phone, whatsapp_opted_in')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return { success: false, sentWhatsApp: false, error: 'Lead não encontrado' };
    }

    // Verificar se tem telefone e optou por WhatsApp
    if (!lead.phone || !lead.whatsapp_opted_in) {
      console.log(`[CRON] Lead ${leadId} não tem telefone ou nao optou por WhatsApp`);
      return { success: true, sentWhatsApp: false };
    }

    // Verificar se WhatsApp Meta esta configurado
    if (!isMetaWhatsAppConfigured()) {
      console.warn('[CRON] WhatsApp Meta não configurado - pulando envio');
      return { success: true, sentWhatsApp: false };
    }

    // Buscar configurações do site
    const settings = await getSiteSettings(['site_name']);
    const siteName = settings.site_name;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comunidade.omocodoteamo.com.br';
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
 * Processa uma tarefa do tipo send_email_2 (Email de follow-up)
 * Verifica conversão antes de enviar
 */
async function processSendEmail2(task: ScheduledTask): Promise<{
  success: boolean;
  sentEmail: boolean;
  converted: boolean;
  error?: string;
}> {
  const leadId = task.lead_id;

  if (!leadId) {
    return { success: false, sentEmail: false, converted: false, error: 'Lead ID não encontrado' };
  }

  try {
    const supabase = createAdminClient();

    // Verificar se o lead já converteu
    const { converted, userId } = await checkLeadConversion(leadId);

    if (converted) {
      console.log(`[CRON] Lead ${leadId} já converteu (user ${userId}) - cancelando sequência`);
      await cancelAllLeadTasks(leadId);
      return { success: true, sentEmail: false, converted: true };
    }

    // Buscar dados do lead
    const { data: lead, error: leadError } = await supabase
      .from('nps_leads')
      .select('id, name, email, phone, sequence_step')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return { success: false, sentEmail: false, converted: false, error: 'Lead não encontrado' };
    }

    // Gerar link de cadastro
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comunidade.omocodoteamo.com.br';
    const registrationUrl = `${baseUrl}/registro?email=${encodeURIComponent(lead.email)}`;

    // Enviar Email 2 (follow-up)
    console.log(`[CRON] Enviando Email 2 para lead ${leadId} (${lead.email})`);
    const result = await sendFollowupEmail({
      to: lead.email,
      name: lead.name,
      loginUrl: registrationUrl,
      leadId,
    });

    if (!result.success) {
      return { success: false, sentEmail: false, converted: false, error: result.error };
    }

    // Atualizar sequence_step para 2
    await updateLeadSequenceStep(leadId, 2);

    // Agendar WhatsApp final para 24h (se tem telefone)
    if (lead.phone) {
      await scheduleWhatsAppFinal(leadId, {
        email: lead.email,
        lead_name: lead.name,
        phone: lead.phone,
      });
      console.log(`[CRON] WhatsApp final agendado para lead ${leadId}`);
    }

    console.log(`[CRON] Email 2 enviado com sucesso para lead ${leadId}`);
    return { success: true, sentEmail: true, converted: false };
  } catch (error) {
    console.error(`[CRON] Erro ao processar Email 2 para lead ${leadId}:`, error);
    return { success: false, sentEmail: false, converted: false, error: 'Erro interno' };
  }
}

/**
 * Processa uma tarefa do tipo send_whatsapp_final
 * Verifica conversão antes de enviar
 */
async function processSendWhatsAppFinal(task: ScheduledTask): Promise<{
  success: boolean;
  sentWhatsApp: boolean;
  converted: boolean;
  error?: string;
}> {
  const leadId = task.lead_id;

  if (!leadId) {
    return { success: false, sentWhatsApp: false, converted: false, error: 'Lead ID não encontrado' };
  }

  try {
    const supabase = createAdminClient();

    // Verificar se o lead já converteu
    const { converted, userId } = await checkLeadConversion(leadId);

    if (converted) {
      console.log(`[CRON] Lead ${leadId} já converteu (user ${userId}) - cancelando sequência`);
      await cancelAllLeadTasks(leadId);
      return { success: true, sentWhatsApp: false, converted: true };
    }

    // Buscar dados do lead
    const { data: lead, error: leadError } = await supabase
      .from('nps_leads')
      .select('id, name, email, phone, whatsapp_opted_in')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return { success: false, sentWhatsApp: false, converted: false, error: 'Lead não encontrado' };
    }

    // Verificar se tem telefone
    if (!lead.phone) {
      console.log(`[CRON] Lead ${leadId} não tem telefone - finalizando sequência`);
      await updateLeadSequenceStep(leadId, 3);
      return { success: true, sentWhatsApp: false, converted: false };
    }

    // Verificar se WhatsApp Meta esta configurado
    if (!isMetaWhatsAppConfigured()) {
      console.warn('[CRON] WhatsApp Meta não configurado - pulando envio');
      await updateLeadSequenceStep(leadId, 3);
      return { success: true, sentWhatsApp: false, converted: false };
    }

    // Buscar configurações do site
    const settings = await getSiteSettings(['site_name']);
    const siteName = settings.site_name;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comunidade.omocodoteamo.com.br';
    const registrationUrl = `${baseUrl}/registro?email=${encodeURIComponent(lead.email)}`;

    // Enviar WhatsApp final
    console.log(`[CRON] Enviando WhatsApp final para lead ${leadId} (${lead.phone})`);
    const result = await sendApprovalWhatsApp({
      to: lead.phone,
      name: lead.name,
      siteName,
      registrationUrl,
      leadId,
    });

    if (!result.success) {
      return { success: false, sentWhatsApp: false, converted: false, error: result.error };
    }

    // Atualizar lead com sequence_step = 3 e whatsapp_sent
    await supabase
      .from('nps_leads')
      .update({
        sequence_step: 3,
        whatsapp_sent: true,
        whatsapp_sent_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    console.log(`[CRON] WhatsApp final enviado com sucesso para lead ${leadId}`);
    return { success: true, sentWhatsApp: true, converted: false };
  } catch (error) {
    console.error(`[CRON] Erro ao processar WhatsApp final para lead ${leadId}:`, error);
    return { success: false, sentWhatsApp: false, converted: false, error: 'Erro interno' };
  }
}

/**
 * Processa uma tarefa de email de onboarding
 * Envia email para usuário que acabou de criar conta
 */
async function processOnboardingEmail(task: ScheduledTask, step: 1 | 2 | 3): Promise<{
  success: boolean;
  sentEmail: boolean;
  error?: string;
}> {
  const payload = task.payload as { user_id?: string; email?: string; name?: string };

  if (!payload.user_id || !payload.email || !payload.name) {
    return { success: false, sentEmail: false, error: 'Dados do usuário não encontrados no payload' };
  }

  try {
    const supabase = createAdminClient();

    // Verificar se o usuário ainda existe e está ativo
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', payload.user_id)
      .single();

    if (userError || !user) {
      console.log(`[CRON] Usuário ${payload.user_id} não encontrado - cancelando onboarding`);
      return { success: true, sentEmail: false };
    }

    // Verificar se o onboarding existe e esse email ainda não foi enviado
    const { data: onboarding } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', payload.user_id)
      .single();

    if (!onboarding) {
      console.log(`[CRON] Registro de onboarding não encontrado para usuário ${payload.user_id}`);
      return { success: true, sentEmail: false };
    }

    // Verificar se esse email já foi enviado
    const emailSentField = `email_${step}_sent` as keyof typeof onboarding;
    if (onboarding[emailSentField]) {
      console.log(`[CRON] Email de onboarding ${step} já enviado para usuário ${payload.user_id}`);
      return { success: true, sentEmail: false };
    }

    // Enviar email de onboarding
    console.log(`[CRON] Enviando email de onboarding ${step} para ${payload.email}`);
    const result = await sendOnboardingEmail({
      to: payload.email,
      name: payload.name,
      userId: payload.user_id,
      step,
    });

    if (!result.success) {
      return { success: false, sentEmail: false, error: result.error };
    }

    console.log(`[CRON] Email de onboarding ${step} enviado com sucesso para ${payload.email}`);
    return { success: true, sentEmail: true };
  } catch (error) {
    console.error(`[CRON] Erro ao processar email de onboarding ${step}:`, error);
    return { success: false, sentEmail: false, error: 'Erro interno' };
  }
}

/**
 * Processa uma tarefa agendada
 */
async function processTask(task: ScheduledTask): Promise<{
  success: boolean;
  sentWhatsApp: boolean;
  sentEmail?: boolean;
  converted?: boolean;
  error?: string;
}> {
  switch (task.type) {
    case 'check_email_opened':
      // Legado - mantido para compatibilidade com tarefas antigas
      return processCheckEmailOpened(task);

    case 'send_email_2':
      // Novo sistema de sequência - enviar Email 2
      const email2Result = await processSendEmail2(task);
      return {
        success: email2Result.success,
        sentWhatsApp: false,
        sentEmail: email2Result.sentEmail,
        converted: email2Result.converted,
        error: email2Result.error,
      };

    case 'send_whatsapp_final':
      // Novo sistema de sequência - enviar WhatsApp final
      const whatsappResult = await processSendWhatsAppFinal(task);
      return {
        success: whatsappResult.success,
        sentWhatsApp: whatsappResult.sentWhatsApp,
        converted: whatsappResult.converted,
        error: whatsappResult.error,
      };

    case 'send_onboarding_email_1':
    case 'send_onboarding_email_2':
    case 'send_onboarding_email_3': {
      // Emails de onboarding para novos usuários
      const step = parseInt(task.type.replace('send_onboarding_email_', '')) as 1 | 2 | 3;
      const onboardingResult = await processOnboardingEmail(task, step);
      return {
        success: onboardingResult.success,
        sentWhatsApp: false,
        sentEmail: onboardingResult.sentEmail,
        error: onboardingResult.error,
      };
    }

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
  // Validar que é uma requisição legitima do CRON
  if (!isValidCronRequest(request)) {
    console.error('[CRON] Requisição nao autorizada');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  const result: TaskProcessingResult & { sent_email_2: number; converted: number } = {
    processed: 0,
    sent_whatsapp: 0,
    sent_email_2: 0,
    converted: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    console.log('[CRON] Iniciando processamento de tarefas...');

    // Processar auto-respostas do Moço (respostas agendadas de 3min a 2h)
    try {
      const autoRespostas = await processarRespostasAgendadas();
      if (autoRespostas.enviadas > 0) {
        console.log(`[CRON] Auto-respostas: ${autoRespostas.enviadas}/${autoRespostas.processadas} enviadas`);
      }
    } catch (autoErr) {
      console.error('[CRON] Erro ao processar auto-respostas:', autoErr);
    }

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

          if (taskResult.converted) {
            result.converted++;
          } else if (taskResult.sentWhatsApp) {
            result.sent_whatsapp++;
          } else if (taskResult.sentEmail) {
            result.sent_email_2++;
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
      `${result.processed} processadas, ${result.sent_email_2} Email2 enviados, ` +
      `${result.sent_whatsapp} WhatsApps enviados, ${result.converted} convertidos, ` +
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

// Também aceitar POST para compatibilidade
export async function POST(request: NextRequest) {
  return GET(request);
}
