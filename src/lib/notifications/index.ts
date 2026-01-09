/**
 * Exportacoes centralizadas do sistema de notificacoes
 */

// Email (Resend)
export {
  sendApprovalEmail,
  logEmailNotification,
  updateEmailNotificationStatus,
  checkEmailOpened,
} from './email';

// WhatsApp (Meta Cloud API)
export {
  sendApprovalWhatsApp,
  sendTemplateMessage,
  logWhatsAppNotification,
  updateWhatsAppNotificationStatus,
  formatPhoneNumber,
  isMetaWhatsAppConfigured,
  verifyMetaWebhookSignature,
} from './whatsapp-meta';

// Scheduler
export {
  scheduleEmailCheck,
  cancelScheduledTask,
  getNextPendingTasks,
  markTaskProcessing,
  markTaskCompleted,
  markTaskFailed,
  incrementTaskAttempts,
  getTaskStats,
} from './scheduler';
