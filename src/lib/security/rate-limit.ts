/**
 * Rate Limiting com Redis/Upstash para ambiente serverless
 *
 * Funciona corretamente em deployments multi-instância (Vercel)
 * Usa REST API do Upstash - otimizado para edge/serverless
 */

import { Redis } from '@upstash/redis';

interface RateLimitConfig {
  /** Numero maximo de requisicoes */
  limit: number;
  /** Janela de tempo em segundos */
  windowSeconds: number;
  /**
   * Comportamento em caso de falha do Redis:
   * - 'open': Permite requisicao (default, prioriza disponibilidade)
   * - 'closed': Bloqueia requisicao (prioriza seguranca)
   *
   * Use 'closed' para endpoints criticos como login e alteracao de senha
   */
  failMode?: 'open' | 'closed';
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

// Inicializar Redis apenas se as credenciais estiverem disponíveis
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Verifica rate limit para um identificador (IP, userId, etc)
 * Usa Redis para funcionar em ambiente serverless multi-instância
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();

  // Fallback se Redis não estiver configurado
  if (!redis) {
    console.warn('Rate limit: Redis não configurado, permitindo requisição');
    return {
      success: true,
      remaining: config.limit - 1,
      reset: now + config.windowSeconds * 1000,
    };
  }

  try {
    const key = `ratelimit:${identifier}`;

    // Incrementar contador atomicamente
    const count = await redis.incr(key);

    // Se é a primeira requisição na janela, setar TTL
    if (count === 1) {
      await redis.expire(key, config.windowSeconds);
    }

    // Obter TTL para calcular reset time
    const ttl = await redis.ttl(key);
    const reset = now + (ttl > 0 ? ttl * 1000 : config.windowSeconds * 1000);

    // Verificar se excedeu limite
    if (count > config.limit) {
      return {
        success: false,
        remaining: 0,
        reset,
      };
    }

    return {
      success: true,
      remaining: config.limit - count,
      reset,
    };
  } catch (error) {
    // SEGURANCA: Nao logar detalhes do erro que podem conter dados sensiveis
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Rate limit Redis error:', errorMessage);

    // SEGURANCA: Fail-closed para endpoints criticos, fail-open para outros
    const failMode = config.failMode || 'open';

    if (failMode === 'closed') {
      // Bloquear requisicao em caso de erro (prioriza seguranca)
      console.warn('Rate limit fail-closed: bloqueando requisicao por falha do Redis');
      return {
        success: false,
        remaining: 0,
        reset: now + config.windowSeconds * 1000,
      };
    }

    // Permitir requisicao em caso de erro (prioriza disponibilidade)
    return {
      success: true,
      remaining: config.limit - 1,
      reset: now + config.windowSeconds * 1000,
    };
  }
}

/**
 * Configuracoes pre-definidas para diferentes endpoints
 * Endpoints criticos usam failMode: 'closed' para priorizar seguranca
 */
export const RATE_LIMITS = {
  // Login: 5 tentativas por minuto (CRITICO: fail-closed)
  login: { limit: 5, windowSeconds: 60, failMode: 'closed' as const },

  // Signup: 3 tentativas por minuto (CRITICO: fail-closed)
  signup: { limit: 3, windowSeconds: 60, failMode: 'closed' as const },

  // Reset de senha: 3 tentativas por minuto (CRITICO: fail-closed)
  resetPassword: { limit: 3, windowSeconds: 60, failMode: 'closed' as const },

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
  const result = await checkRateLimit(identifier, config);

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    return {
      error: `Muitas tentativas. Aguarde ${retryAfter} segundos.`,
      retryAfter,
    };
  }

  return action();
}
