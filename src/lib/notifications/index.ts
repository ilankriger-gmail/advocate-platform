/**
 * Exportacoes centralizadas do sistema de notificacoes
 */

// Email (Resend)
export {
  sendApprovalEmail,
  sendFollowupEmail,
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
  scheduleEmail2,
  scheduleWhatsAppFinal,
  cancelScheduledTask,
  cancelAllLeadTasks,
  getNextPendingTasks,
  markTaskProcessing,
  markTaskCompleted,
  markTaskFailed,
  incrementTaskAttempts,
  getTaskStats,
} from './scheduler';
