/**
 * Exportações centralizadas de utilitários da biblioteca
 *
 * Este arquivo centraliza exports de módulos principais da lib,
 * facilitando imports em toda a aplicação.
 */

// ============================================================================
// LOGGER - Sistema de logging seguro
// ============================================================================

export {
  logger,
  createContextLogger,
} from './logger';

export type {
  Logger,
  LogLevel,
  LogContext,
} from './logger';

// ============================================================================
// SANITIZE - Sanitização de dados sensíveis
// ============================================================================

export {
  maskEmail,
  maskId,
  maskToken,
  sanitizeError,
  sanitizeObject,
  sanitizeUser,
  sanitizeApiData,
} from './sanitize';

export type {
  SanitizeOptions,
  SanitizedError,
} from './sanitize';

// ============================================================================
// EMAIL - Envio de emails com Resend
// ============================================================================

export {
  sendEmail,
  sendChallengeApprovedEmail,
} from './email';
