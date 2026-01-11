/**
 * Modulo de Seguranca
 *
 * Exporta todas as funcoes de seguranca da aplicacao
 */

// Rate Limiting
export {
  checkRateLimit,
  withRateLimit,
  getClientIP,
  RATE_LIMITS,
} from './rate-limit';

// CSRF Protection
export {
  generateCSRFToken,
  setCSRFToken,
  getCSRFToken,
  validateCSRFToken,
  requireCSRF,
} from './csrf';

// Validation
export {
  validateEmail,
  validatePassword,
  sanitizeText,
  isValidUUID,
  isValidURL,
  type EmailValidationResult,
  type PasswordValidationResult,
} from './validation';

// Audit Logging
export {
  auditLog,
  getRequestInfo,
  logFailedLogin,
  logRateLimitExceeded,
  logModerationAction,
  logSettingsChange,
  type AuditAction,
  type AuditLogEntry,
} from './audit-log';
