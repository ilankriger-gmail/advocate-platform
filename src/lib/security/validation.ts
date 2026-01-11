/**
 * Validacao de Input - Seguranca
 *
 * Funcoes para validar emails, senhas e outros inputs
 */

/**
 * Regex RFC 5322 simplificada para validacao de email
 * Mais rigorosa que apenas verificar '@'
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Lista de dominios de email temporarios/descartaveis conhecidos
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'trashmail.com',
  'yopmail.com',
  'getnada.com',
];

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida um endereco de email
 *
 * @param email - Email a ser validado
 * @param options - Opcoes de validacao
 * @returns Resultado da validacao
 *
 * @example
 * const result = validateEmail('user@example.com');
 * if (!result.valid) {
 *   return { error: result.error };
 * }
 */
export function validateEmail(
  email: string,
  options: {
    allowDisposable?: boolean;
    maxLength?: number;
  } = {}
): EmailValidationResult {
  const { allowDisposable = false, maxLength = 254 } = options;

  // Verificar se foi fornecido
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email e obrigatorio' };
  }

  // Trim e lowercase
  const normalizedEmail = email.trim().toLowerCase();

  // Verificar comprimento
  if (normalizedEmail.length > maxLength) {
    return { valid: false, error: `Email muito longo (maximo ${maxLength} caracteres)` };
  }

  // Verificar formato com regex
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return { valid: false, error: 'Formato de email invalido' };
  }

  // Verificar dominio descartavel
  if (!allowDisposable) {
    const domain = normalizedEmail.split('@')[1];
    if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
      return { valid: false, error: 'Emails temporarios nao sao permitidos' };
    }
  }

  return { valid: true };
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Valida uma senha com requisitos de seguranca
 *
 * @param password - Senha a ser validada
 * @param options - Opcoes de validacao
 * @returns Resultado da validacao com forca da senha
 *
 * @example
 * const result = validatePassword('MyP@ssw0rd!');
 * if (!result.valid) {
 *   return { error: result.errors.join(', ') };
 * }
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
  } = {}
): PasswordValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options;

  const errors: string[] = [];
  let strengthScore = 0;

  // Verificar se foi fornecida
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Senha e obrigatoria'], strength: 'weak' };
  }

  // Verificar comprimento minimo
  if (password.length < minLength) {
    errors.push(`Senha deve ter pelo menos ${minLength} caracteres`);
  } else {
    strengthScore++;
    if (password.length >= 12) strengthScore++;
  }

  // Verificar letra maiuscula
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiuscula');
  } else if (/[A-Z]/.test(password)) {
    strengthScore++;
  }

  // Verificar letra minuscula
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minuscula');
  } else if (/[a-z]/.test(password)) {
    strengthScore++;
  }

  // Verificar numero
  if (requireNumber && !/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um numero');
  } else if (/[0-9]/.test(password)) {
    strengthScore++;
  }

  // Verificar caractere especial
  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strengthScore++;
  }

  // Calcular forca
  let strength: 'weak' | 'medium' | 'strong';
  if (strengthScore <= 2) {
    strength = 'weak';
  } else if (strengthScore <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Sanitiza input de texto removendo caracteres perigosos
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove < e > basico
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Valida UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valida URL
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
