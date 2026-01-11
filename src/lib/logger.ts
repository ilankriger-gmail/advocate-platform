/**
 * Sistema centralizado de logging seguro
 *
 * Este arquivo fornece um logger centralizado com controle de ambiente,
 * níveis de log, e suporte a contexto/namespace.
 *
 * Características:
 * - Níveis de log: debug, info, warn, error
 * - Suporte a contexto/namespace para rastreabilidade
 * - Controle baseado em ambiente (desabilita debug/info em produção)
 * - Mantém warn/error em produção para debugging crítico
 * - Preparado para integração futura com serviços externos (Datadog, Sentry, etc.)
 *
 * @example
 * ```ts
 * import { logger } from '@/lib/logger';
 *
 * // Log simples
 * logger.info('Operação concluída');
 * logger.error('Erro ao processar dados', { errorCode: 'ERR_001' });
 *
 * // Log com contexto
 * const schedulerLogger = logger.withContext('[Scheduler]');
 * schedulerLogger.debug('Iniciando processamento de tarefas');
 * ```
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  withContext: (prefix: string) => Logger;
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_TEST = process.env.NODE_ENV === 'test';

/**
 * Níveis de log que devem ser habilitados em cada ambiente
 */
const ENABLED_LEVELS: Record<string, Set<LogLevel>> = {
  development: new Set(['debug', 'info', 'warn', 'error']),
  test: new Set(['warn', 'error']), // Em testes, só logs importantes
  production: new Set(['warn', 'error']), // Em produção, só warnings e erros
};

// ============================================================================
// FUNÇÕES INTERNAS
// ============================================================================

/**
 * Verifica se um nível de log está habilitado no ambiente atual
 */
function isLevelEnabled(level: LogLevel): boolean {
  const env = process.env.NODE_ENV || 'development';
  const enabledLevels = ENABLED_LEVELS[env] || ENABLED_LEVELS.development;
  return enabledLevels.has(level);
}

/**
 * Formata a mensagem de log com timestamp e nível
 */
function formatMessage(level: LogLevel, message: string, prefix?: string): string {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase().padEnd(5);
  const contextPrefix = prefix ? `${prefix} ` : '';

  return `[${timestamp}] ${levelUpper} ${contextPrefix}${message}`;
}

/**
 * Formata o contexto adicional para logging
 */
function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }

  try {
    return '\n' + JSON.stringify(context, null, 2);
  } catch (error) {
    return '\n[Erro ao serializar contexto]';
  }
}

/**
 * Executa o log de forma segura, tratando possíveis erros
 */
function safeLog(
  consoleMethod: (...args: unknown[]) => void,
  level: LogLevel,
  message: string,
  context?: LogContext,
  prefix?: string
): void {
  if (!isLevelEnabled(level)) {
    return;
  }

  try {
    const formattedMessage = formatMessage(level, message, prefix);
    const formattedContext = formatContext(context);

    consoleMethod(formattedMessage + formattedContext);

    // TODO: Integração futura com serviços externos
    // if (IS_PRODUCTION) {
    //   sendToExternalService(level, message, context);
    // }
  } catch (error) {
    // Fallback silencioso em caso de erro no próprio logger
    // para não quebrar a aplicação
    if (!IS_PRODUCTION) {
      console.error('[Logger] Erro ao processar log:', error);
    }
  }
}

// ============================================================================
// IMPLEMENTAÇÃO DO LOGGER
// ============================================================================

/**
 * Cria uma instância do logger com prefixo opcional
 */
function createLogger(contextPrefix?: string): Logger {
  return {
    debug: (message: string, context?: LogContext) => {
      safeLog(console.log, 'debug', message, context, contextPrefix);
    },

    info: (message: string, context?: LogContext) => {
      safeLog(console.info, 'info', message, context, contextPrefix);
    },

    warn: (message: string, context?: LogContext) => {
      safeLog(console.warn, 'warn', message, context, contextPrefix);
    },

    error: (message: string, context?: LogContext) => {
      safeLog(console.error, 'error', message, context, contextPrefix);
    },

    withContext: (prefix: string) => {
      const newPrefix = contextPrefix ? `${contextPrefix}${prefix}` : prefix;
      return createLogger(newPrefix);
    },
  };
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

/**
 * Instância padrão do logger
 *
 * Use este logger em toda a aplicação para garantir logging consistente
 * e controlado por ambiente.
 */
export const logger = createLogger();

/**
 * Utilitário para criar logger com contexto específico
 *
 * @param context - Prefixo de contexto (ex: '[Scheduler]', '[API]', '[Auth]')
 * @returns Logger com contexto configurado
 *
 * @example
 * ```ts
 * const apiLogger = createContextLogger('[API]');
 * apiLogger.info('Request processado com sucesso');
 * ```
 */
export function createContextLogger(context: string): Logger {
  return createLogger(context);
}
