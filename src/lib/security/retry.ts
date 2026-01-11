/**
 * Utilitario de retry com exponential backoff para APIs externas
 *
 * Implementa padrao de resiliencia para chamadas de rede:
 * - Retry automatico com backoff exponencial
 * - Circuit breaker para evitar sobrecarga
 * - Timeout configuravel
 *
 * @example
 * ```ts
 * import { withRetry, withCircuitBreaker } from '@/lib/security/retry';
 *
 * // Retry simples
 * const result = await withRetry(() => fetchExternalAPI(), { maxRetries: 3 });
 *
 * // Com circuit breaker
 * const breaker = createCircuitBreaker('external-api');
 * const result = await withCircuitBreaker(breaker, () => fetchExternalAPI());
 * ```
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface RetryConfig {
  /** Numero maximo de tentativas (default: 3) */
  maxRetries?: number;
  /** Delay inicial em ms (default: 1000) */
  initialDelayMs?: number;
  /** Multiplicador do delay a cada retry (default: 2) */
  backoffMultiplier?: number;
  /** Delay maximo em ms (default: 30000) */
  maxDelayMs?: number;
  /** Timeout por tentativa em ms (default: 10000) */
  timeoutMs?: number;
  /** Funcao para determinar se deve fazer retry baseado no erro */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

export interface CircuitBreakerConfig {
  /** Numero de falhas para abrir o circuito (default: 5) */
  failureThreshold?: number;
  /** Tempo em ms para tentar reabrir (default: 30000) */
  resetTimeoutMs?: number;
}

// ============================================================================
// CONFIGURACAO PADRAO
// ============================================================================

const DEFAULT_RETRY_CONFIG: Required<Omit<RetryConfig, 'shouldRetry'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
  timeoutMs: 10000,
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG: Required<CircuitBreakerConfig> = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
};

// ============================================================================
// CIRCUIT BREAKERS (em memoria - para ambiente serverless considerar Redis)
// ============================================================================

const circuitBreakers = new Map<string, CircuitBreakerState>();

/**
 * Cria ou obtem um circuit breaker pelo nome
 */
export function getCircuitBreaker(name: string): CircuitBreakerState {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    });
  }
  return circuitBreakers.get(name)!;
}

/**
 * Reseta um circuit breaker
 */
export function resetCircuitBreaker(name: string): void {
  circuitBreakers.set(name, {
    failures: 0,
    lastFailure: 0,
    state: 'closed',
  });
}

// ============================================================================
// FUNCOES PRINCIPAIS
// ============================================================================

/**
 * Aguarda um tempo especificado
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calcula o delay para o proximo retry usando exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  multiplier: number,
  maxDelay: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  // Adiciona jitter para evitar thundering herd
  const jitter = delay * 0.1 * Math.random();
  return Math.min(delay + jitter, maxDelay);
}

/**
 * Verifica se o erro e retryable (default: erros de rede e 5xx)
 */
function defaultShouldRetry(error: unknown): boolean {
  // Erros de rede
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Erros com status HTTP
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    // Retry apenas para 5xx e alguns 4xx especificos
    return status >= 500 || status === 408 || status === 429;
  }

  // AbortError (timeout) - nao fazer retry
  if (error instanceof Error && error.name === 'AbortError') {
    return false;
  }

  return false;
}

/**
 * Executa uma funcao com retry e exponential backoff
 *
 * @param fn - Funcao async a ser executada
 * @param config - Configuracao de retry
 * @returns Resultado da funcao ou throw do ultimo erro
 *
 * @example
 * ```ts
 * const data = await withRetry(
 *   () => fetch('https://api.example.com/data').then(r => r.json()),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries,
    initialDelayMs,
    backoffMultiplier,
    maxDelayMs,
    timeoutMs,
  } = { ...DEFAULT_RETRY_CONFIG, ...config };

  const shouldRetry = config.shouldRetry || defaultShouldRetry;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Executar funcao (passando signal se necessario)
        const result = await fn();
        clearTimeout(timeoutId);
        return result;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error;

      // Verificar se deve fazer retry
      if (attempt > maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }

      // Calcular delay e aguardar
      const delay = calculateDelay(
        attempt,
        initialDelayMs,
        backoffMultiplier,
        maxDelayMs
      );

      console.warn(
        `[Retry] Tentativa ${attempt}/${maxRetries} falhou. Aguardando ${Math.round(delay)}ms...`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Executa uma funcao com circuit breaker
 *
 * @param name - Nome do circuit breaker
 * @param fn - Funcao async a ser executada
 * @param config - Configuracao do circuit breaker
 * @returns Resultado da funcao ou throw se circuito aberto
 *
 * @example
 * ```ts
 * const data = await withCircuitBreaker(
 *   'external-api',
 *   () => fetch('https://api.example.com/data').then(r => r.json())
 * );
 * ```
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  config: CircuitBreakerConfig = {}
): Promise<T> {
  const { failureThreshold, resetTimeoutMs } = {
    ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
    ...config,
  };

  const breaker = getCircuitBreaker(name);
  const now = Date.now();

  // Verificar estado do circuito
  if (breaker.state === 'open') {
    // Verificar se passou tempo suficiente para tentar reabrir
    if (now - breaker.lastFailure >= resetTimeoutMs) {
      breaker.state = 'half-open';
      console.log(`[CircuitBreaker] ${name}: half-open, tentando reabrir`);
    } else {
      throw new Error(`Circuit breaker '${name}' is open. Try again later.`);
    }
  }

  try {
    const result = await fn();

    // Sucesso - resetar contadores
    if (breaker.state === 'half-open') {
      console.log(`[CircuitBreaker] ${name}: closed (recuperado)`);
    }
    breaker.failures = 0;
    breaker.state = 'closed';

    return result;
  } catch (error) {
    // Falha - incrementar contador
    breaker.failures++;
    breaker.lastFailure = now;

    if (breaker.failures >= failureThreshold) {
      breaker.state = 'open';
      console.error(
        `[CircuitBreaker] ${name}: open (${breaker.failures} falhas)`
      );
    }

    throw error;
  }
}

/**
 * Combina retry com circuit breaker
 *
 * @param name - Nome do circuit breaker
 * @param fn - Funcao async a ser executada
 * @param retryConfig - Configuracao de retry
 * @param circuitConfig - Configuracao do circuit breaker
 */
export async function withRetryAndCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  retryConfig: RetryConfig = {},
  circuitConfig: CircuitBreakerConfig = {}
): Promise<T> {
  return withCircuitBreaker(
    name,
    () => withRetry(fn, retryConfig),
    circuitConfig
  );
}
