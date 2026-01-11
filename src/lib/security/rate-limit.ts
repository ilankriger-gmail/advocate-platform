/**
 * Rate Limiting para proteger contra brute force e DDoS
 *
 * Em desenvolvimento: usa Map em memoria
 * Em producao: deve ser substituido por Redis/Upstash
 */

interface RateLimitConfig {
  /** Numero maximo de requisicoes */
  limit: number;
  /** Janela de tempo em segundos */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

// Cache em memoria (apenas para desenvolvimento/single instance)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

// Limpar cache periodicamente (a cada 5 minutos)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitCache.entries());
    for (const [key, value] of entries) {
      if (value.resetAt < now) {
        rateLimitCache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Verifica rate limit para um identificador (IP, userId, etc)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = `ratelimit:${identifier}`;

  const existing = rateLimitCache.get(key);

  // Se nao existe ou expirou, criar novo
  if (!existing || existing.resetAt < now) {
    rateLimitCache.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: config.limit - 1,
      reset: now + windowMs,
    };
  }

  // Incrementar contador
  existing.count++;

  // Verificar se excedeu limite
  if (existing.count > config.limit) {
    return {
      success: false,
      remaining: 0,
      reset: existing.resetAt,
    };
  }

  return {
    success: true,
    remaining: config.limit - existing.count,
    reset: existing.resetAt,
  };
}

/**
 * Configuracoes pre-definidas para diferentes endpoints
 */
export const RATE_LIMITS = {
  // Login: 5 tentativas por minuto
  login: { limit: 5, windowSeconds: 60 },

  // Signup: 3 tentativas por minuto
  signup: { limit: 3, windowSeconds: 60 },

  // API geral: 100 requisicoes por minuto
  api: { limit: 100, windowSeconds: 60 },

  // Webhooks: 50 requisicoes por minuto
  webhook: { limit: 50, windowSeconds: 60 },

  // Criacao de posts: 10 por minuto
  createPost: { limit: 10, windowSeconds: 60 },

  // Comentarios: 20 por minuto
  comment: { limit: 20, windowSeconds: 60 },

  // Leads/NPS: 5 por minuto
  lead: { limit: 5, windowSeconds: 60 },
} as const;

/**
 * Helper para extrair IP do request
 */
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback
  return 'unknown';
}

/**
 * Wrapper para aplicar rate limit em Server Actions
 */
export async function withRateLimit<T>(
  identifier: string,
  config: RateLimitConfig,
  action: () => Promise<T>
): Promise<T | { error: string; retryAfter: number }> {
  const result = checkRateLimit(identifier, config);

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    return {
      error: `Muitas tentativas. Aguarde ${retryAfter} segundos.`,
      retryAfter,
    };
  }

  return action();
}
