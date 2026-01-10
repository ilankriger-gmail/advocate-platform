/**
 * Scheduler para tarefas agendadas
 * Gerencia a fila de tarefas para processamento pelo CRON
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ScheduledTask,
  ScheduledTaskInsert,
  ScheduledTaskType,
  ScheduledTaskStatus,
  CheckEmailOpenedPayload,
} from '@/types/notification';

// Delay padrao para verificar abertura de email (24 horas em ms)
const DEFAULT_EMAIL_CHECK_DELAY = 24 * 60 * 60 * 1000;

/**
 * Agenda uma tarefa para verificar se o email foi aberto
 * Por padrao, agenda para 24 horas apos o envio
 */
export async function scheduleEmailCheck(
  leadId: string,
  payload?: CheckEmailOpenedPayload,
  delayMs: number = DEFAULT_EMAIL_CHECK_DELAY
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const supabase = createAdminClient();

    const scheduledFor = new Date(Date.now() + delayMs).toISOString();

    const taskData: ScheduledTaskInsert = {
      type: 'check_email_opened',
      lead_id: leadId,
      scheduled_for: scheduledFor,
      payload: payload || {},
    };

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .insert(taskData)
      .select('id')
      .single();

    if (error) {
      console.error('[Scheduler] Erro ao agendar tarefa:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Scheduler] Tarefa check_email_opened agendada para ${scheduledFor}`);
    return { success: true, taskId: data.id };
  } catch (err) {
    console.error('[Scheduler] Erro ao agendar tarefa:', err);
    return { success: false, error: 'Erro ao agendar tarefa' };
  }
}

/**
 * Cancela uma tarefa agendada por tipo e lead_id
 */
export async function cancelScheduledTask(
  leadId: string,
  type: ScheduledTaskType
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('scheduled_tasks')
      .update({
        status: 'cancelled' as ScheduledTaskStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('lead_id', leadId)
      .eq('type', type)
      .eq('status', 'pending');

    if (error) {
      console.error('[Scheduler] Erro ao cancelar tarefa:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Scheduler] Tarefa ${type} cancelada para lead ${leadId}`);
    return { success: true };
  } catch (err) {
    console.error('[Scheduler] Erro ao cancelar tarefa:', err);
    return { success: false, error: 'Erro ao cancelar tarefa' };
  }
}

/**
 * Busca as proximas tarefas pendentes para processamento
 */
export async function getNextPendingTasks(
  limit: number = 10
): Promise<{ tasks: ScheduledTask[]; error?: string }> {
  try {
    const supabase = createAdminClient();

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[Scheduler] Erro ao buscar tarefas:', error);
      return { tasks: [], error: error.message };
    }

    return { tasks: (data as ScheduledTask[]) || [] };
  } catch (err) {
    console.error('[Scheduler] Erro ao buscar tarefas:', err);
    return { tasks: [], error: 'Erro ao buscar tarefas' };
  }
}

/**
 * Marca uma tarefa como em processamento
 */
export async function markTaskProcessing(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Nota: O incremento de tentativas e feito pela funcao incrementTaskAttempts
    const { error } = await supabase
      .from('scheduled_tasks')
      .update({
        status: 'processing' as ScheduledTaskStatus,
      })
      .eq('id', taskId)
      .eq('status', 'pending');

    if (error) {
      console.error('[Scheduler] Erro ao marcar tarefa como processing:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[Scheduler] Erro ao marcar tarefa:', err);
    return { success: false, error: 'Erro ao marcar tarefa' };
  }
}

/**
 * Incrementa tentativas e marca como processing
 */
export async function incrementTaskAttempts(
  taskId: string
): Promise<{ success: boolean; attempts?: number; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Primeiro, buscar a tarefa para obter attempts atual
    const { data: task, error: fetchError } = await supabase
      .from('scheduled_tasks')
      .select('attempts, max_attempts')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, error: 'Tarefa nao encontrada' };
    }

    const newAttempts = (task.attempts || 0) + 1;

    // Atualizar a tarefa
    const { error } = await supabase
      .from('scheduled_tasks')
      .update({
        status: 'processing' as ScheduledTaskStatus,
        attempts: newAttempts,
      })
      .eq('id', taskId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, attempts: newAttempts };
  } catch (err) {
    console.error('[Scheduler] Erro ao incrementar tentativas:', err);
    return { success: false, error: 'Erro ao incrementar tentativas' };
  }
}

/**
 * Marca uma tarefa como concluida
 */
export async function markTaskCompleted(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('scheduled_tasks')
      .update({
        status: 'completed' as ScheduledTaskStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      console.error('[Scheduler] Erro ao completar tarefa:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Scheduler] Tarefa ${taskId} completada`);
    return { success: true };
  } catch (err) {
    console.error('[Scheduler] Erro ao completar tarefa:', err);
    return { success: false, error: 'Erro ao completar tarefa' };
  }
}

/**
 * Marca uma tarefa como falha
 */
export async function markTaskFailed(
  taskId: string,
  errorMessage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Buscar a tarefa para verificar tentativas
    const { data: task, error: fetchError } = await supabase
      .from('scheduled_tasks')
      .select('attempts, max_attempts')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, error: 'Tarefa nao encontrada' };
    }

    // Se ainda ha tentativas disponiveis, voltar para pending
    const shouldRetry = (task.attempts || 0) < (task.max_attempts || 3);
    const newStatus: ScheduledTaskStatus = shouldRetry ? 'pending' : 'failed';

    const { error } = await supabase
      .from('scheduled_tasks')
      .update({
        status: newStatus,
        last_error: errorMessage,
        completed_at: shouldRetry ? null : new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      console.error('[Scheduler] Erro ao marcar tarefa como falha:', error);
      return { success: false, error: error.message };
    }

    if (shouldRetry) {
      console.log(`[Scheduler] Tarefa ${taskId} voltou para pending (${task.attempts}/${task.max_attempts} tentativas)`);
    } else {
      console.log(`[Scheduler] Tarefa ${taskId} falhou apos ${task.max_attempts} tentativas: ${errorMessage}`);
    }

    return { success: true };
  } catch (err) {
    console.error('[Scheduler] Erro ao marcar tarefa como falha:', err);
    return { success: false, error: 'Erro ao marcar tarefa como falha' };
  }
}

/**
 * Busca estatisticas de tarefas agendadas
 */
export async function getTaskStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
}> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select('status');

    if (error || !data) {
      return { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 };
    }

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    data.forEach((task) => {
      const status = task.status as ScheduledTaskStatus;
      if (status in stats) {
        stats[status]++;
      }
    });

    return stats;
  } catch {
    return { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 };
  }
}

// ============ SEQUENCIA DE EMAILS ============

/**
 * Agenda o envio do Email 2 (follow-up)
 * Por padrao, agenda para 24 horas apos o Email 1
 */
export async function scheduleEmail2(
  leadId: string,
  payload?: { email: string; lead_name: string },
  delayMs: number = DEFAULT_EMAIL_CHECK_DELAY
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const supabase = createAdminClient();

    const scheduledFor = new Date(Date.now() + delayMs).toISOString();

    const taskData: ScheduledTaskInsert = {
      type: 'send_email_2' as ScheduledTaskType,
      lead_id: leadId,
      scheduled_for: scheduledFor,
      payload: payload || {},
    };

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .insert(taskData)
      .select('id')
      .single();

    if (error) {
      console.error('[Scheduler] Erro ao agendar Email 2:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Scheduler] Email 2 agendado para ${scheduledFor} (lead ${leadId})`);
    return { success: true, taskId: data.id };
  } catch (err) {
    console.error('[Scheduler] Erro ao agendar Email 2:', err);
    return { success: false, error: 'Erro ao agendar Email 2' };
  }
}

/**
 * Agenda o envio do WhatsApp final
 * Por padrao, agenda para 24 horas apos o Email 2
 */
export async function scheduleWhatsAppFinal(
  leadId: string,
  payload?: { email: string; lead_name: string; phone: string },
  delayMs: number = DEFAULT_EMAIL_CHECK_DELAY
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const supabase = createAdminClient();

    const scheduledFor = new Date(Date.now() + delayMs).toISOString();

    const taskData: ScheduledTaskInsert = {
      type: 'send_whatsapp_final' as ScheduledTaskType,
      lead_id: leadId,
      scheduled_for: scheduledFor,
      payload: payload || {},
    };

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .insert(taskData)
      .select('id')
      .single();

    if (error) {
      console.error('[Scheduler] Erro ao agendar WhatsApp final:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Scheduler] WhatsApp final agendado para ${scheduledFor} (lead ${leadId})`);
    return { success: true, taskId: data.id };
  } catch (err) {
    console.error('[Scheduler] Erro ao agendar WhatsApp final:', err);
    return { success: false, error: 'Erro ao agendar WhatsApp final' };
  }
}

/**
 * Cancela todas as tarefas pendentes de um lead
 * Usado quando o lead converte antes de completar a sequencia
 */
export async function cancelAllLeadTasks(
  leadId: string
): Promise<{ success: boolean; cancelled: number; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('scheduled_tasks')
      .update({
        status: 'cancelled' as ScheduledTaskStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('lead_id', leadId)
      .eq('status', 'pending')
      .select('id');

    if (error) {
      console.error('[Scheduler] Erro ao cancelar tarefas do lead:', error);
      return { success: false, cancelled: 0, error: error.message };
    }

    const cancelled = data?.length || 0;
    if (cancelled > 0) {
      console.log(`[Scheduler] ${cancelled} tarefa(s) cancelada(s) para lead ${leadId}`);
    }

    return { success: true, cancelled };
  } catch (err) {
    console.error('[Scheduler] Erro ao cancelar tarefas do lead:', err);
    return { success: false, cancelled: 0, error: 'Erro ao cancelar tarefas' };
  }
}
