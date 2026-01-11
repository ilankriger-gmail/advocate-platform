/**
 * Biblioteca de sanitização de dados sensíveis
 *
 * Este arquivo fornece funções para mascarar e sanitizar dados sensíveis
 * antes de serem registrados em logs ou exibidos em ambientes não seguros.
 *
 * Características:
 * - maskEmail: Mascara endereços de email
 * - maskId: Mascara IDs longos (UUIDs, etc.)
 * - maskToken: Remove ou mascara tokens de autenticação
 * - sanitizeError: Remove stack traces detalhados em produção
 * - sanitizeObject: Sanitiza recursivamente objetos complexos
 *
 * @example
 * ```ts
 * import { maskEmail, sanitizeObject } from '@/lib/sanitize';
 *
 * const email = maskEmail('user@example.com'); // 'us***@ex***le.com'
 * const data = sanitizeObject({ email: 'test@test.com', token: 'secret' });
 * ```
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface SanitizeOptions {
  /**
   * Se deve sanitizar completamente ou permitir valores parciais
   * @default false
   */
  strict?: boolean;

  /**
   * Lista de chaves que devem ser completamente removidas
   * @default []
   */
  removeKeys?: string[];

  /**
   * Lista de chaves que devem ser mascaradas
   * @default []
   */
  maskKeys?: string[];
}

export interface SanitizedError {
  message: string;
  name: string;
  code?: string;
  stack?: string;
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Chaves que devem ser sempre removidas dos logs
 */
const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'secretKey',
  'privateKey',
  'authorization',
  'cookie',
  'sessionId',
  'session_id',
];

/**
 * Chaves que devem ser mascaradas (não removidas completamente)
 */
const MASKABLE_KEYS = [
  'email',
  'phone',
  'cpf',
  'cnpj',
  'creditCard',
  'cardNumber',
];

// ============================================================================
// FUNÇÕES DE SANITIZAÇÃO
// ============================================================================

/**
 * Mascara um endereço de email
 *
 * @param email - Endereço de email a ser mascarado
 * @returns Email mascarado no formato 'us***@do***om'
 *
 * @example
 * ```ts
 * maskEmail('user@example.com') // 'us***@ex***le.com'
 * maskEmail('a@b.co') // 'a***@b***co'
 * maskEmail('invalid-email') // '***'
 * ```
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '***';
  }

  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '***';
  }

  const [localPart, domain] = email.split('@');

  // Mascara a parte local (antes do @)
  const maskedLocal = localPart.length <= 2
    ? localPart.charAt(0) + '***'
    : localPart.substring(0, 2) + '***';

  // Mascara o domínio
  const domainParts = domain.split('.');
  const maskedDomainParts = domainParts.map((part, index) => {
    if (index === domainParts.length - 1) {
      // Última parte (TLD) - mostra completa se pequena, senão mascara
      return part.length <= 3 ? part : part.substring(0, 2) + '***' + part.slice(-2);
    }
    // Partes do meio - mascara
    return part.length <= 2
      ? part.charAt(0) + '***'
      : part.substring(0, 2) + '***';
  });

  return `${maskedLocal}@${maskedDomainParts.join('.')}`;
}

/**
 * Mascara um ID (UUID, hash, etc.)
 *
 * @param id - ID a ser mascarado
 * @returns ID mascarado mostrando apenas os primeiros 5 caracteres
 *
 * @example
 * ```ts
 * maskId('abc123-def456-ghi789') // 'abc12***'
 * maskId('short') // 'sho***'
 * maskId(null) // '***'
 * ```
 */
export function maskId(id: string | null | undefined): string {
  if (!id || typeof id !== 'string') {
    return '***';
  }

  if (id.length <= 3) {
    return '***';
  }

  if (id.length <= 5) {
    return id.substring(0, 3) + '***';
  }

  return id.substring(0, 5) + '***';
}

/**
 * Mascara ou remove completamente um token
 *
 * @param token - Token a ser mascarado
 * @param showType - Se deve mostrar o tipo do token (ex: 'Bearer')
 * @returns Token mascarado ou tipo do token
 *
 * @example
 * ```ts
 * maskToken('Bearer abc123def456') // '[TOKEN]'
 * maskToken('Bearer abc123def456', true) // 'Bearer [REDACTED]'
 * maskToken('secret-key-123') // '[TOKEN]'
 * ```
 */
export function maskToken(
  token: string | null | undefined,
  showType: boolean = false
): string {
  if (!token || typeof token !== 'string') {
    return '[TOKEN]';
  }

  if (!showType) {
    return '[TOKEN]';
  }

  // Detecta se é um Bearer token
  if (token.toLowerCase().startsWith('bearer ')) {
    return 'Bearer [REDACTED]';
  }

  // Detecta se é um Basic token
  if (token.toLowerCase().startsWith('basic ')) {
    return 'Basic [REDACTED]';
  }

  // Para outros tokens, apenas retorna [TOKEN]
  return '[TOKEN]';
}

/**
 * Sanitiza um objeto Error para logging seguro
 *
 * Remove stack traces detalhados em produção, mantém apenas
 * informações essenciais para debugging.
 *
 * @param error - Error object ou unknown
 * @returns Objeto de erro sanitizado
 *
 * @example
 * ```ts
 * try {
 *   throw new Error('Database connection failed');
 * } catch (error) {
 *   const sanitized = sanitizeError(error);
 *   logger.error('Error occurred', sanitized);
 * }
 * ```
 */
export function sanitizeError(error: unknown): SanitizedError {
  // Se não é um erro válido
  if (!error) {
    return {
      name: 'UnknownError',
      message: 'An unknown error occurred',
    };
  }

  // Se é uma string
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
    };
  }

  // Se é um objeto Error
  if (error instanceof Error) {
    const sanitized: SanitizedError = {
      name: error.name || 'Error',
      message: error.message || 'No error message',
    };

    // Adiciona código de erro se disponível
    if ('code' in error && typeof error.code === 'string') {
      sanitized.code = error.code;
    }

    // Em desenvolvimento, inclui stack trace
    // Em produção, remove completamente para evitar exposição de paths internos
    if (!IS_PRODUCTION && error.stack) {
      sanitized.stack = error.stack;
    }

    return sanitized;
  }

  // Para outros tipos de objetos
  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    return {
      name: String(err.name || 'Error'),
      message: String(err.message || 'An error occurred'),
      code: err.code ? String(err.code) : undefined,
    };
  }

  // Fallback para tipos primitivos
  return {
    name: 'Error',
    message: String(error),
  };
}

/**
 * Sanitiza recursivamente um objeto, mascarando campos sensíveis
 *
 * @param obj - Objeto a ser sanitizado
 * @param options - Opções de sanitização
 * @returns Objeto sanitizado (cópia, não modifica original)
 *
 * @example
 * ```ts
 * const user = {
 *   email: 'user@example.com',
 *   password: 'secret123',
 *   id: 'abc123-def456',
 *   profile: {
 *     phone: '+5511999999999'
 *   }
 * };
 *
 * const sanitized = sanitizeObject(user);
 * // {
 * //   email: 'us***@ex***le.com',
 * //   password: '[REDACTED]',
 * //   id: 'abc123-def456', // IDs não são automaticamente mascarados
 * //   profile: { phone: '+55***' }
 * // }
 * ```
 */
export function sanitizeObject<T = unknown>(
  obj: T,
  options: SanitizeOptions = {}
): T {
  const {
    strict = false,
    removeKeys = [],
    maskKeys = [],
  } = options;

  // Combina chaves sensíveis padrão com as fornecidas pelo usuário
  const allRemoveKeys = [...SENSITIVE_KEYS, ...removeKeys];
  const allMaskKeys = [...MASKABLE_KEYS, ...maskKeys];

  /**
   * Função interna recursiva para sanitizar
   */
  function sanitizeValue(value: unknown, key?: string): unknown {
    // Null ou undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Se a chave deve ser removida
    if (key && allRemoveKeys.includes(key.toLowerCase())) {
      return '[REDACTED]';
    }

    // Se a chave deve ser mascarada
    if (key && allMaskKeys.includes(key.toLowerCase())) {
      if (typeof value === 'string') {
        // Detecta tipo de dado e aplica máscara apropriada
        if (key.toLowerCase().includes('email')) {
          return maskEmail(value);
        }
        if (key.toLowerCase().includes('phone')) {
          return value.length > 4 ? value.substring(0, 3) + '***' : '***';
        }
        // Máscara genérica para outros campos
        return value.length > 3 ? value.substring(0, 3) + '***' : '***';
      }
    }

    // Arrays
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item));
    }

    // Objetos
    if (typeof value === 'object') {
      // Error objects
      if (value instanceof Error) {
        return sanitizeError(value);
      }

      // Date objects
      if (value instanceof Date) {
        return value;
      }

      // Objetos genéricos
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        sanitized[k] = sanitizeValue(v, k);
      }
      return sanitized;
    }

    // Tipos primitivos (string, number, boolean)
    return value;
  }

  return sanitizeValue(obj) as T;
}

/**
 * Utilitário para sanitizar dados de usuário
 *
 * Conveniência específica para sanitizar objetos de usuário,
 * mascarando automaticamente email e outros dados pessoais.
 *
 * @param user - Objeto de usuário
 * @returns Usuário sanitizado
 *
 * @example
 * ```ts
 * const user = { id: '123', email: 'user@test.com', name: 'John' };
 * const safe = sanitizeUser(user);
 * logger.info('User loaded', safe);
 * ```
 */
export function sanitizeUser<T extends Record<string, unknown>>(user: T): T {
  return sanitizeObject(user, {
    maskKeys: ['email', 'phone', 'cpf', 'cnpj'],
    removeKeys: ['password', 'passwordHash', 'token'],
  });
}

/**
 * Utilitário para sanitizar dados de API request/response
 *
 * Remove headers sensíveis e sanitiza body.
 *
 * @param data - Dados da request/response
 * @returns Dados sanitizados
 */
export function sanitizeApiData<T extends Record<string, unknown>>(data: T): T {
  return sanitizeObject(data, {
    removeKeys: [
      'authorization',
      'cookie',
      'set-cookie',
      'api-key',
      'x-api-key',
      'token',
    ],
  });
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

/**
 * Exporta todas as funções de sanitização e tipos
 */
export default {
  maskEmail,
  maskId,
  maskToken,
  sanitizeError,
  sanitizeObject,
  sanitizeUser,
  sanitizeApiData,
};
