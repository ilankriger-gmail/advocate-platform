/**
 * Audit Logging - Registro de acoes de seguranca
 *
 * Registra acoes importantes para auditoria:
 * - Login/Logout
 * - Mudancas de permissao
 * - Acoes de moderacao
 * - Acesso a dados sensiveis
 */

import { createAdminClient } from '@/lib/supabase/admin';

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.signup'
  | 'user.password_change'
  | 'user.email_change'
  | 'user.profile_update'
  | 'admin.post_approve'
  | 'admin.post_reject'
  | 'admin.post_block'
  | 'admin.user_ban'
  | 'admin.user_role_change'
  | 'admin.settings_update'
  | 'admin.lead_approve'
  | 'admin.lead_reject'
  | 'security.failed_login'
  | 'security.rate_limit_exceeded'
  | 'security.csrf_violation'
  | 'security.unauthorized_access';

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  targetId?: string;
  targetType?: 'user' | 'post' | 'lead' | 'settings';
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra uma entrada no log de auditoria
 *
 * @example
 * await auditLog({
 *   action: 'admin.post_approve',
 *   userId: adminUser.id,
 *   targetId: postId,
 *   targetType: 'post',
 *   metadata: { previousStatus: 'blocked' }
 * });
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from('audit_logs').insert({
      action: entry.action,
      user_id: entry.userId || null,
      target_id: entry.targetId || null,
      target_type: entry.targetType || null,
      metadata: entry.metadata || {},
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log de auditoria nunca deve quebrar a aplicacao
    console.error('[AuditLog] Erro ao registrar:', error);
  }
}

/**
 * Helper para extrair informacoes do request para audit log
 */
export function getRequestInfo(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Log de tentativa de login falha
 */
export async function logFailedLogin(
  email: string,
  ipAddress: string,
  reason: string
): Promise<void> {
  await auditLog({
    action: 'security.failed_login',
    metadata: {
      email: email.substring(0, 3) + '***', // Mascara email
      reason,
    },
    ipAddress,
  });
}

/**
 * Log de rate limit excedido
 */
export async function logRateLimitExceeded(
  identifier: string,
  endpoint: string,
  ipAddress: string
): Promise<void> {
  await auditLog({
    action: 'security.rate_limit_exceeded',
    metadata: {
      identifier: identifier.substring(0, 8) + '***',
      endpoint,
    },
    ipAddress,
  });
}

/**
 * Log de acao de moderacao
 */
export async function logModerationAction(
  action: 'admin.post_approve' | 'admin.post_reject' | 'admin.post_block',
  adminUserId: string,
  postId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await auditLog({
    action,
    userId: adminUserId,
    targetId: postId,
    targetType: 'post',
    metadata,
  });
}

/**
 * Log de mudanca de configuracoes
 */
export async function logSettingsChange(
  adminUserId: string,
  settingKey: string,
  oldValue: unknown,
  newValue: unknown
): Promise<void> {
  await auditLog({
    action: 'admin.settings_update',
    userId: adminUserId,
    targetType: 'settings',
    metadata: {
      settingKey,
      oldValue: typeof oldValue === 'string' ? oldValue.substring(0, 50) : oldValue,
      newValue: typeof newValue === 'string' ? newValue.substring(0, 50) : newValue,
    },
  });
}
