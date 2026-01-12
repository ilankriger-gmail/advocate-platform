/**
 * Scheduler para tarefas agendadas
 * Gerencia a fila de tarefas para processamento pelo CRON
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger, maskId, sanitizeError } from '@/lib';
import type {
  ScheduledTask,
  ScheduledTaskInsert,
  ScheduledTaskType,
  ScheduledTaskStatus,
  CheckEmailOpenedPayload,
} from '@/types/notification';

// Logger contextualizado para o módulo Scheduler
const schedulerLogger = logger.withContext('[Scheduler]');

// Delay padrão para verificar abertura de email (24 horas em ms)
const DEFAULT_EMAIL_CHECK_DELAY = 24 * 60 * 60 * 1000;

/**
 * Agenda uma tarefa para verificar se o email foi aberto
 * Por padrão, agenda para 24 horas após o envio
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
      schedulerLogger.error('Erro ao agendar tarefa check_email_opened:', sanitizeError(error));
      return { success: false, error: error.message };
    }

    schedulerLogger.debug(`Tarefa check_email_opened agendada`, {
      taskId: data.id,
      scheduledFor,
      leadId: maskId(leadId)
    });
    return { success: true, taskId: data.id };
  } catch (err) {
    schedulerLogger.error('Erro ao agendar tarefa check_email_opened:', sanitizeError(err));
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
      schedulerLogger.error('Erro ao cancelar tarefa:', sanitizeError(error));
      return { success: false, error: error.message };
    }

    schedulerLogger.debug(`Tarefa ${type} cancelada`, {
      type,
      leadId: maskId(leadId)
    });
    return { success: true };
  } catch (err) {
    schedulerLogger.error('Erro ao cancelar tarefa:', sanitizeError(err));
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
      schedulerLogger.error('Erro ao buscar tarefas pendentes:', sanitizeError(error));
      return { tasks: [], error: error.message };
    }

    return { tasks: (data as ScheduledTask[]) || [] };
  } catch (err) {
    schedulerLogger.error('Erro ao buscar tarefas pendentes:', sanitizeError(err));
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

    // Nota: O incremento de tentativas e feito pela função incrementTaskAttempts
    const { error } = await supabase
      .from('scheduled_tasks')
      .update({
        status: 'processing' as ScheduledTaskStatus,
      })
      .eq('id', taskId)
      .eq('status', 'pending');

    if (error) {
      schedulerLogger.error('Erro ao marcar tarefa como processing:', sanitizeError(error));
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    schedulerLogger.error('Erro ao marcar tarefa como processing:', sanitizeError(err));
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
      return { success: false, error: 'Tarefa não encontrada' };
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
    schedulerLogger.error('Erro ao incrementar tentativas:', sanitizeError(err));
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
      schedulerLogger.error('Erro ao completar tarefa:', sanitizeError(error));
      return { success: false, error: error.message };
    }

    schedulerLogger.debug(`Tarefa completada`, { taskId });
    return { success: true };
  } catch (err) {
    schedulerLogger.error('Erro ao completar tarefa:', sanitizeError(err));
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
      return { success: false, error: 'Tarefa não encontrada' };
    }

    // Se ainda ha tentativas disponíveis, voltar para pending
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
      schedulerLogger.error('Erro ao marcar tarefa como falha:', sanitizeError(error));
      return { success: false, error: error.message };
    }

    if (shouldRetry) {
      schedulerLogger.warn(`Tarefa voltou para pending após falha`, {
        taskId,
        attempts: task.attempts,
        maxAttempts: task.max_attempts
      });
    } else {
      schedulerLogger.error(`Tarefa falhou após todas as tentativas`, {
        taskId,
        maxAttempts: task.max_attempts,
        errorMessage: errorMessage.substring(0, 100) // Limitar tamanho do erro no log
      });
    }

    return { success: true };
  } catch (err) {
    schedulerLogger.error('Erro ao marcar tarefa como falha:', sanitizeError(err));
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
 * Por padrão, agenda para 24 horas após o Email 1
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
      schedulerLogger.error('Erro ao agendar Email 2:', sanitizeError(error));
      return { success: false, error: error.message };
    }

    schedulerLogger.debug(`Email 2 agendado`, {
      taskId: data.id,
      scheduledFor,
      leadId: maskId(leadId)
    });
    return { success: true, taskId: data.id };
  } catch (err) {
    schedulerLogger.error('Erro ao agendar Email 2:', sanitizeError(err));
    return { success: false, error: 'Erro ao agendar Email 2' };
  }
}

/**
 * Agenda o envio do WhatsApp final
 * Por padrão, agenda para 24 horas após o Email 2
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
      schedulerLogger.error('Erro ao agendar WhatsApp final:', sanitizeError(error));
      return { success: false, error: error.message };
    }

    schedulerLogger.debug(`WhatsApp final agendado`, {
      taskId: data.id,
      scheduledFor,
      leadId: maskId(leadId)
    });
    return { success: true, taskId: data.id };
  } catch (err) {
    schedulerLogger.error('Erro ao agendar WhatsApp final:', sanitizeError(err));
    return { success: false, error: 'Erro ao agendar WhatsApp final' };
  }
}

/**
 * Cancela todas as tarefas pendentes de um lead
 * Usado quando o lead converte antes de completar a sequência
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
      schedulerLogger.error('Erro ao cancelar tarefas do lead:', sanitizeError(error));
      return { success: false, cancelled: 0, error: error.message };
    }

    const cancelled = data?.length || 0;
    if (cancelled > 0) {
      schedulerLogger.debug(`Tarefas canceladas para lead`, {
        cancelled,
        leadId: maskId(leadId)
      });
    }

    return { success: true, cancelled };
  } catch (err) {
    schedulerLogger.error('Erro ao cancelar tarefas do lead:', sanitizeError(err));
    return { success: false, cancelled: 0, error: 'Erro ao cancelar tarefas' };
  }
}
