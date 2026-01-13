/**
 * Exportacoes centralizadas do sistema de notificações
 */

// Email (Resend)
export {
  sendApprovalEmail,
  sendFollowupEmail,
  logEmailNotification,
  updateEmailNotificationStatus,
  checkEmailOpened,
  sendOnboardingEmail,
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
  scheduleUserOnboarding,
} from './scheduler';
