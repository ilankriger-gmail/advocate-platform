/**
 * Tipos para o Sistema de Notificações Hibrido
 * Email + WhatsApp Fallback
 */

// ============ NOTIFICACOES ============

/**
 * Canal de notificacao
 */
export type NotificationChannel = 'email' | 'whatsapp';

/**
 * Status da notificacao
 */
export type NotificationStatus =
  | 'pending'    // Aguardando envio
  | 'sent'       // Enviada
  | 'delivered'  // Entregue
  | 'opened'     // Aberta (email) ou lida (whatsapp)
  | 'failed'     // Falha no envio
  | 'cancelled'; // Cancelada

/**
 * Metadados da notificacao por email
 */
export interface EmailNotificationMetadata {
  opened?: boolean;
  opened_at?: string;
  clicks?: string[];
  bounced?: boolean;
  bounce_reason?: string;
}

/**
 * Metadados da notificacao por WhatsApp
 */
export interface WhatsAppNotificationMetadata {
  template_name?: string;
  delivery_status?: string;
  read_at?: string;
  error_code?: string;
  error_message?: string;
}

/**
 * Metadados flexiveis da notificacao
 */
export type NotificationMetadata = EmailNotificationMetadata | WhatsAppNotificationMetadata;

/**
 * Log de notificacao
 */
export interface NotificationLog {
  id: string;
  lead_id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  external_id: string | null;
  metadata: NotificationMetadata;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

/**
 * Dados para inserir um log de notificacao
 */
export interface NotificationLogInsert {
  lead_id: string;
  channel: NotificationChannel;
  status?: NotificationStatus;
  external_id?: string | null;
  metadata?: NotificationMetadata;
  sent_at?: string | null;
}

/**
 * Dados para atualizar um log de notificacao
 */
export interface NotificationLogUpdate {
  status?: NotificationStatus;
  external_id?: string | null;
  metadata?: NotificationMetadata;
  sent_at?: string | null;
  updated_at?: string;
}

// ============ TAREFAS AGENDADAS ============

/**
 * Tipo da tarefa agendada
 */
export type ScheduledTaskType =
  | 'check_email_opened'       // Verificar se email foi aberto (legado)
  | 'send_reminder'            // Enviar lembrete
  | 'cleanup'                  // Limpeza de dados antigos
  | 'send_email_2'             // Enviar Email 2 (follow-up para leads)
  | 'send_whatsapp_final'      // Enviar WhatsApp final
  | 'send_onboarding_email_1'  // Onboarding: Email de boas-vindas
  | 'send_onboarding_email_2'  // Onboarding: Email de engajamento (24h)
  | 'send_onboarding_email_3'; // Onboarding: Email de reengajamento (72h)

/**
 * Status da tarefa agendada
 */
export type ScheduledTaskStatus =
  | 'pending'     // Aguardando execucao
  | 'processing'  // Em processamento
  | 'completed'   // Concluida
  | 'failed'      // Falhou
  | 'cancelled';  // Cancelada

/**
 * Payload da tarefa check_email_opened
 */
export interface CheckEmailOpenedPayload {
  notification_log_id?: string;
  email?: string;
  lead_name?: string;
}

/**
 * Payload generico da tarefa
 */
export type ScheduledTaskPayload = CheckEmailOpenedPayload | Record<string, unknown>;

/**
 * Tarefa agendada
 */
export interface ScheduledTask {
  id: string;
  type: ScheduledTaskType;
  lead_id: string | null;
  scheduled_for: string;
  status: ScheduledTaskStatus;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  payload: ScheduledTaskPayload;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/**
 * Dados para inserir uma tarefa agendada
 */
export interface ScheduledTaskInsert {
  type: ScheduledTaskType;
  lead_id?: string | null;
  scheduled_for: string;
  status?: ScheduledTaskStatus;
  payload?: ScheduledTaskPayload;
  max_attempts?: number;
}

/**
 * Dados para atualizar uma tarefa agendada
 */
export interface ScheduledTaskUpdate {
  status?: ScheduledTaskStatus;
  attempts?: number;
  last_error?: string | null;
  completed_at?: string | null;
  updated_at?: string;
}

// ============ ESTATISTICAS ============

/**
 * Estatisticas de notificações
 */
export interface NotificationStats {
  total_emails_sent: number;
  emails_opened: number;
  emails_open_rate: number;
  total_whatsapp_sent: number;
  whatsapp_delivered: number;
  whatsapp_read: number;
  whatsapp_fallback_rate: number;
  pending_tasks: number;
}

/**
 * Resumo de notificacao para exibicao
 */
export interface NotificationSummary {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_email: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sent_at: string | null;
  opened_at?: string | null;
}

// ============ RESULTADOS DE PROCESSAMENTO ============

/**
 * Resultado do processamento de tarefas (CRON)
 */
export interface TaskProcessingResult {
  processed: number;
  sent_whatsapp: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Resultado do envio de email
 */
export interface EmailSendResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

/**
 * Resultado do envio de WhatsApp
 */
export interface WhatsAppSendResult {
  success: boolean;
  message_id?: string;
  error?: string;
}
