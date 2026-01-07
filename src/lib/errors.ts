/**
 * Sistema centralizado de mensagens de erro e códigos de erro
 *
 * Este arquivo padroniza todas as mensagens de erro da plataforma,
 * facilitando troubleshooting e manutenção.
 *
 * Cada erro inclui:
 * - code: Código único para identificação
 * - message: Mensagem amigável para o usuário
 * - technicalMessage: Detalhes técnicos para desenvolvedores
 * - troubleshootingUrl: Link direto para seção do guia de troubleshooting
 * - severity: Nível de severidade do erro
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface AppError {
  code: string;
  message: string;
  technicalMessage: string;
  troubleshootingUrl: string;
  severity: ErrorSeverity;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const TROUBLESHOOTING_BASE_URL = '/docs/TROUBLESHOOTING.md';

// ============================================================================
// 1. ERROS DE VARIÁVEIS DE AMBIENTE
// ============================================================================

export const ENV_ERRORS = {
  SUPABASE_URL_MISSING: {
    code: 'ENV_001',
    message: 'Não foi possível conectar ao banco de dados. Por favor, verifique as configurações.',
    technicalMessage: 'NEXT_PUBLIC_SUPABASE_URL não está definida no arquivo .env.local',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#11-erro-next_public_supabase_url-is-not-defined`,
    severity: 'error' as ErrorSeverity,
  },
  SUPABASE_ANON_KEY_MISSING: {
    code: 'ENV_002',
    message: 'Não foi possível conectar ao banco de dados. Por favor, verifique as configurações.',
    technicalMessage: 'NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida no arquivo .env.local',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#12-erro-next_public_supabase_anon_key-is-not-defined`,
    severity: 'error' as ErrorSeverity,
  },
  SITE_URL_MISSING: {
    code: 'ENV_003',
    message: 'Configuração de URL do site está faltando.',
    technicalMessage: 'NEXT_PUBLIC_SITE_URL não está definida no arquivo .env.local',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#13-erro-next_public_site_url-is-not-defined`,
    severity: 'warning' as ErrorSeverity,
  },
  SERVICE_ROLE_KEY_MISSING: {
    code: 'ENV_004',
    message: 'Operação administrativa não disponível. Entre em contato com o administrador.',
    technicalMessage: 'SUPABASE_SERVICE_ROLE_KEY não está definida no arquivo .env.local',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#14-erro-supabase_service_role_key-is-not-defined`,
    severity: 'error' as ErrorSeverity,
  },
  GEMINI_API_KEY_MISSING: {
    code: 'ENV_005',
    message: 'Verificação automática de vídeo não está disponível. A verificação será feita manualmente.',
    technicalMessage: 'GEMINI_API_KEY não está definida no arquivo .env.local ou está com valor padrão',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#15-erro-gemini_api_key-não-configurada`,
    severity: 'warning' as ErrorSeverity,
  },
  ENV_FILE_NOT_FOUND: {
    code: 'ENV_006',
    message: 'Arquivo de configuração não encontrado. Por favor, configure o ambiente.',
    technicalMessage: 'Arquivo .env.local não existe na raiz do projeto',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#16-erro-arquivo-envlocal-não-existe`,
    severity: 'error' as ErrorSeverity,
  },
  INVALID_URL_FORMAT: {
    code: 'ENV_007',
    message: 'URL de configuração está em formato inválido.',
    technicalMessage: 'NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SITE_URL não está em formato válido de URL',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#17-erro-formato-inválido-de-url`,
    severity: 'error' as ErrorSeverity,
  },
} as const;

// ============================================================================
// 2. ERROS DE AUTENTICAÇÃO
// ============================================================================

export const AUTH_ERRORS = {
  OAUTH_GOOGLE_NOT_CONFIGURED: {
    code: 'AUTH_001',
    message: 'Login com Google não está disponível no momento. Use email e senha.',
    technicalMessage: 'OAuth Google não está configurado no Supabase ou Google Cloud Console',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#21-erro-oauth-google-não-configurado`,
    severity: 'warning' as ErrorSeverity,
  },
  INVALID_CREDENTIALS: {
    code: 'AUTH_002',
    message: 'Email ou senha incorretos. Por favor, verifique suas credenciais.',
    technicalMessage: 'Invalid login credentials - email ou senha não correspondem',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#22-erro-invalid-login-credentials`,
    severity: 'info' as ErrorSeverity,
  },
  EMAIL_NOT_CONFIRMED: {
    code: 'AUTH_003',
    message: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
    technicalMessage: 'Email not confirmed - usuário não clicou no link de confirmação',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#23-erro-email-not-confirmed`,
    severity: 'info' as ErrorSeverity,
  },
  SESSION_EXPIRED: {
    code: 'AUTH_004',
    message: 'Sua sessão expirou. Por favor, faça login novamente.',
    technicalMessage: 'Session expired ou token JWT inválido',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#24-erro-session-expired`,
    severity: 'warning' as ErrorSeverity,
  },
  USER_NOT_AUTHORIZED: {
    code: 'AUTH_005',
    message: 'Você não tem permissão para acessar este recurso.',
    technicalMessage: 'User not authorized - RLS policy bloqueou a operação',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#25-erro-user-not-authorized--rls`,
    severity: 'warning' as ErrorSeverity,
  },
  WEAK_PASSWORD: {
    code: 'AUTH_006',
    message: 'A senha deve ter pelo menos 6 caracteres.',
    technicalMessage: 'Password should be at least 6 characters',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#2-erros-de-autenticação`,
    severity: 'info' as ErrorSeverity,
  },
  USER_ALREADY_EXISTS: {
    code: 'AUTH_007',
    message: 'Já existe uma conta com este email.',
    technicalMessage: 'User already registered',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#2-erros-de-autenticação`,
    severity: 'info' as ErrorSeverity,
  },
} as const;

// ============================================================================
// 3. ERROS DO SUPABASE
// ============================================================================

export const SUPABASE_ERRORS = {
  CONNECTION_FAILED: {
    code: 'SUPABASE_001',
    message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
    technicalMessage: 'Failed to fetch - erro de conexão com Supabase',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#31-erro-failed-to-fetch---erro-de-conexão`,
    severity: 'error' as ErrorSeverity,
  },
  TABLE_NOT_FOUND: {
    code: 'SUPABASE_002',
    message: 'Erro ao acessar os dados. Entre em contato com o suporte.',
    technicalMessage: 'relation does not exist - tabela não existe no banco de dados',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#32-erro-relation-does-not-exist---tabela-não-existe`,
    severity: 'error' as ErrorSeverity,
  },
  COLUMN_NOT_FOUND: {
    code: 'SUPABASE_003',
    message: 'Erro ao processar os dados. Entre em contato com o suporte.',
    technicalMessage: 'column does not exist - coluna não existe na tabela',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#33-erro-column-does-not-exist---coluna-não-existe`,
    severity: 'error' as ErrorSeverity,
  },
  DUPLICATE_KEY: {
    code: 'SUPABASE_004',
    message: 'Este registro já existe. Por favor, use valores diferentes.',
    technicalMessage: 'duplicate key value violates unique constraint',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#34-erro-duplicate-key-constraint---violação-de-unicidade`,
    severity: 'info' as ErrorSeverity,
  },
  FOREIGN_KEY_VIOLATION: {
    code: 'SUPABASE_005',
    message: 'Não é possível completar esta operação devido a dependências de dados.',
    technicalMessage: 'foreign key violation - tentou deletar/atualizar registro referenciado',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#35-erro-foreign-key-violation---violação-de-chave-estrangeira`,
    severity: 'warning' as ErrorSeverity,
  },
  STORAGE_BUCKET_NOT_FOUND: {
    code: 'SUPABASE_006',
    message: 'Erro ao fazer upload do arquivo. Entre em contato com o suporte.',
    technicalMessage: 'Storage bucket not found ou permission denied no Storage',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#36-erro-storage-bucket-not-found---problemas-com-storage`,
    severity: 'error' as ErrorSeverity,
  },
  INVALID_JSON: {
    code: 'SUPABASE_007',
    message: 'Formato de dados inválido.',
    technicalMessage: 'invalid input syntax for type json/jsonb',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#37-erro-invalid-json---problemas-com-jsonjsonb`,
    severity: 'error' as ErrorSeverity,
  },
  MIGRATION_FAILED: {
    code: 'SUPABASE_008',
    message: 'Erro de sincronização do banco de dados. Entre em contato com o suporte.',
    technicalMessage: 'Migration failed - schema out of sync',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#38-erro-migração-falhou---schema-out-of-sync`,
    severity: 'error' as ErrorSeverity,
  },
  RLS_POLICY_VIOLATION: {
    code: 'SUPABASE_009',
    message: 'Você não tem permissão para realizar esta ação.',
    technicalMessage: 'Row Level Security policy violation',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#25-erro-user-not-authorized--rls`,
    severity: 'warning' as ErrorSeverity,
  },
} as const;

// ============================================================================
// 4. ERROS DE APIs EXTERNAS
// ============================================================================

export const API_ERRORS = {
  GEMINI_NOT_CONFIGURED: {
    code: 'API_001',
    message: 'Verificação automática de vídeo não está disponível. A verificação será feita manualmente.',
    technicalMessage: 'API Gemini não configurada - GEMINI_API_KEY faltando ou inválida',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#41-erro-api-gemini-não-configurada`,
    severity: 'warning' as ErrorSeverity,
  },
  GEMINI_CONNECTION_ERROR: {
    code: 'API_002',
    message: 'Erro ao conectar com o serviço de verificação. A verificação será feita manualmente.',
    technicalMessage: 'Erro ao conectar com API Gemini - network error ou API down',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#42-erro-falha-na-conexão-com-gemini-api`,
    severity: 'error' as ErrorSeverity,
  },
  GEMINI_INVALID_API_KEY: {
    code: 'API_003',
    message: 'Serviço de verificação configurado incorretamente. Entre em contato com o suporte.',
    technicalMessage: 'API key not valid - GEMINI_API_KEY inválida ou revogada',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#43-erro-gemini-api-key-inválida`,
    severity: 'error' as ErrorSeverity,
  },
  GEMINI_RATE_LIMIT: {
    code: 'API_004',
    message: 'Limite de verificações atingido. Tente novamente em alguns minutos.',
    technicalMessage: 'Rate limit exceeded ou quota excedida do Gemini',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#44-erro-rate-limitquota-excedida-do-gemini`,
    severity: 'warning' as ErrorSeverity,
  },
  GEMINI_UNEXPECTED_RESPONSE: {
    code: 'API_005',
    message: 'Erro ao processar a verificação. Tente novamente.',
    technicalMessage: 'Resposta inesperada da API Gemini - JSON inválido ou formato inesperado',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#45-erro-resposta-inesperada-da-api-gemini`,
    severity: 'error' as ErrorSeverity,
  },
  INVALID_VIDEO_URL: {
    code: 'API_006',
    message: 'URL do vídeo inválida. Por favor, use links do YouTube, Instagram ou TikTok.',
    technicalMessage: 'URL de vídeo não corresponde aos padrões aceitos',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}#4-erros-de-apis-externas`,
    severity: 'info' as ErrorSeverity,
  },
} as const;

// ============================================================================
// 5. ERROS GERAIS DA APLICAÇÃO
// ============================================================================

export const APP_ERRORS = {
  NETWORK_ERROR: {
    code: 'APP_001',
    message: 'Erro de conexão. Verifique sua internet e tente novamente.',
    technicalMessage: 'Network request failed',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}`,
    severity: 'error' as ErrorSeverity,
  },
  TIMEOUT: {
    code: 'APP_002',
    message: 'A operação demorou muito tempo. Tente novamente.',
    technicalMessage: 'Request timeout',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}`,
    severity: 'warning' as ErrorSeverity,
  },
  UNKNOWN_ERROR: {
    code: 'APP_003',
    message: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
    technicalMessage: 'Unknown error',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}`,
    severity: 'error' as ErrorSeverity,
  },
  VALIDATION_ERROR: {
    code: 'APP_004',
    message: 'Dados inválidos. Por favor, verifique os campos e tente novamente.',
    technicalMessage: 'Validation error',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}`,
    severity: 'info' as ErrorSeverity,
  },
  NOT_FOUND: {
    code: 'APP_005',
    message: 'Recurso não encontrado.',
    technicalMessage: 'Resource not found',
    troubleshootingUrl: `${TROUBLESHOOTING_BASE_URL}`,
    severity: 'info' as ErrorSeverity,
  },
} as const;

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Cria um objeto Error com metadados adicionais
 */
export class ApplicationError extends Error {
  code: string;
  technicalMessage: string;
  troubleshootingUrl: string;
  severity: ErrorSeverity;

  constructor(appError: AppError) {
    super(appError.message);
    this.name = 'ApplicationError';
    this.code = appError.code;
    this.technicalMessage = appError.technicalMessage;
    this.troubleshootingUrl = appError.troubleshootingUrl;
    this.severity = appError.severity;

    // Mantém o stack trace correto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }
}

/**
 * Mapeia erros do Supabase para erros padronizados da aplicação
 */
export function mapSupabaseError(error: unknown): AppError {
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; code?: string };
    const message = err.message?.toLowerCase() || '';

    // Erros de conexão
    if (message.includes('failed to fetch') || message.includes('network')) {
      return SUPABASE_ERRORS.CONNECTION_FAILED;
    }

    // Erros de schema
    if (message.includes('relation') && message.includes('does not exist')) {
      return SUPABASE_ERRORS.TABLE_NOT_FOUND;
    }
    if (message.includes('column') && message.includes('does not exist')) {
      return SUPABASE_ERRORS.COLUMN_NOT_FOUND;
    }

    // Erros de constraint
    if (message.includes('duplicate key')) {
      return SUPABASE_ERRORS.DUPLICATE_KEY;
    }
    if (message.includes('foreign key')) {
      return SUPABASE_ERRORS.FOREIGN_KEY_VIOLATION;
    }

    // Erros de JSON
    if (message.includes('invalid') && message.includes('json')) {
      return SUPABASE_ERRORS.INVALID_JSON;
    }

    // Erros de storage
    if (message.includes('bucket') || message.includes('storage')) {
      return SUPABASE_ERRORS.STORAGE_BUCKET_NOT_FOUND;
    }

    // Erros de RLS
    if (message.includes('row level security') || message.includes('rls')) {
      return SUPABASE_ERRORS.RLS_POLICY_VIOLATION;
    }
  }

  return APP_ERRORS.UNKNOWN_ERROR;
}

/**
 * Mapeia erros de autenticação do Supabase para erros padronizados
 */
export function mapAuthError(error: unknown): AppError {
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string };
    const message = err.message?.toLowerCase() || '';

    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return AUTH_ERRORS.INVALID_CREDENTIALS;
    }
    if (message.includes('email not confirmed')) {
      return AUTH_ERRORS.EMAIL_NOT_CONFIRMED;
    }
    if (message.includes('session') && message.includes('expired')) {
      return AUTH_ERRORS.SESSION_EXPIRED;
    }
    if (message.includes('password') && message.includes('should be at least')) {
      return AUTH_ERRORS.WEAK_PASSWORD;
    }
    if (message.includes('user already registered')) {
      return AUTH_ERRORS.USER_ALREADY_EXISTS;
    }
  }

  return APP_ERRORS.UNKNOWN_ERROR;
}

/**
 * Mapeia erros da API Gemini para erros padronizados
 */
export function mapGeminiError(error: unknown): AppError {
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; status?: number };
    const message = err.message?.toLowerCase() || '';

    if (message.includes('api key') && message.includes('invalid')) {
      return API_ERRORS.GEMINI_INVALID_API_KEY;
    }
    if (message.includes('rate limit') || message.includes('quota')) {
      return API_ERRORS.GEMINI_RATE_LIMIT;
    }
    if (err.status === 401 || err.status === 403) {
      return API_ERRORS.GEMINI_INVALID_API_KEY;
    }
    if (err.status === 429) {
      return API_ERRORS.GEMINI_RATE_LIMIT;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return API_ERRORS.GEMINI_CONNECTION_ERROR;
    }
  }

  return API_ERRORS.GEMINI_UNEXPECTED_RESPONSE;
}

/**
 * Formata uma mensagem de erro para logging
 */
export function formatErrorForLogging(error: AppError, context?: Record<string, unknown>): string {
  const parts = [
    `[${error.code}] ${error.severity.toUpperCase()}`,
    `Message: ${error.message}`,
    `Technical: ${error.technicalMessage}`,
    `Troubleshooting: ${error.troubleshootingUrl}`,
  ];

  if (context) {
    parts.push(`Context: ${JSON.stringify(context)}`);
  }

  return parts.join(' | ');
}

/**
 * Valida se todas as variáveis de ambiente obrigatórias estão presentes
 */
export function validateRequiredEnvVars(): AppError[] {
  const errors: AppError[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push(ENV_ERRORS.SUPABASE_URL_MISSING);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push(ENV_ERRORS.SUPABASE_ANON_KEY_MISSING);
  }
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    errors.push(ENV_ERRORS.SITE_URL_MISSING);
  }

  // Validar formato de URLs
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !isValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    errors.push(ENV_ERRORS.INVALID_URL_FORMAT);
  }
  if (process.env.NEXT_PUBLIC_SITE_URL && !isValidUrl(process.env.NEXT_PUBLIC_SITE_URL)) {
    errors.push(ENV_ERRORS.INVALID_URL_FORMAT);
  }

  return errors;
}

/**
 * Valida se uma string é uma URL válida
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// EXPORTAÇÕES CONSOLIDADAS
// ============================================================================

/**
 * Todos os erros da aplicação organizados por categoria
 */
export const ERRORS = {
  ENV: ENV_ERRORS,
  AUTH: AUTH_ERRORS,
  SUPABASE: SUPABASE_ERRORS,
  API: API_ERRORS,
  APP: APP_ERRORS,
} as const;

/**
 * Tipo união de todos os erros possíveis
 */
export type AllErrors =
  | typeof ENV_ERRORS[keyof typeof ENV_ERRORS]
  | typeof AUTH_ERRORS[keyof typeof AUTH_ERRORS]
  | typeof SUPABASE_ERRORS[keyof typeof SUPABASE_ERRORS]
  | typeof API_ERRORS[keyof typeof API_ERRORS]
  | typeof APP_ERRORS[keyof typeof APP_ERRORS];
