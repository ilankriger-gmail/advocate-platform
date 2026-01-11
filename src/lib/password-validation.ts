/**
 * Utilitário de validação de senha
 *
 * Implementa validação robusta de senhas seguindo recomendações NIST:
 * - Mínimo de 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Cálculo de força da senha (fraca/média/forte)
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthScore {
  score: number; // 0-100
  level: PasswordStrength;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MIN_PASSWORD_LENGTH = 8;
const STRONG_PASSWORD_MIN_SCORE = 80;
const MEDIUM_PASSWORD_MIN_SCORE = 50;

/**
 * Lista das 100 senhas mais comuns
 * Baseado em análises de vazamentos de dados e pesquisas de segurança
 * Referências: NIST, Have I Been Pwned, SplashData
 */
const COMMON_PASSWORDS = [
  // Top 10 mais comuns
  '123456',
  'password',
  '123456789',
  '12345678',
  '12345',
  '1234567',
  '1234567890',
  'qwerty',
  'abc123',
  '111111',
  // 11-30
  '123123',
  'qwerty123',
  '1q2w3e4r',
  'admin',
  'qwertyuiop',
  '654321',
  '555555',
  'lovely',
  '7777777',
  'welcome',
  '888888',
  'princess',
  'dragon',
  'password1',
  '123qwe',
  'sunshine',
  'master',
  'monkey',
  'letmein',
  '666666',
  // 31-60
  'qazwsx',
  '123321',
  'mustang',
  '121212',
  'starwars',
  'baseball',
  'trustno1',
  'flower',
  'passw0rd',
  'shadow',
  'michael',
  'football',
  'superman',
  'batman',
  'iloveyou',
  'welcome123',
  'hello',
  'freedom',
  'whatever',
  'nicole',
  'jordan',
  'cameron',
  'secret',
  'summer',
  'qwerty1',
  'zxcvbnm',
  'asdfgh',
  'hunter',
  'buster',
  'soccer',
  // 61-90
  'harley',
  'ranger',
  'jennifer',
  'ashley',
  'charlie',
  'robert',
  'thomas',
  'daniel',
  'matthew',
  'jessica',
  'taylor',
  'samantha',
  'killer',
  'hockey',
  'george',
  'andrew',
  'michelle',
  'computer',
  'maggie',
  'pepper',
  'jordan23',
  'ginger',
  'cookie',
  'london',
  'cookie1',
  'access',
  'pepper1',
  'abc123456',
  'baseball1',
  'football1',
  // 91-100
  '123456a',
  'password123',
  'senha',
  'senha123',
  '1234',
  'admin123',
  'root',
  'toor',
  'pass',
  'test',
];

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Valida uma senha de acordo com as regras de segurança
 *
 * @param password - Senha a ser validada
 * @returns Objeto com resultado da validação, lista de erros e força da senha
 *
 * @example
 * const result = validatePassword('Senha123');
 * if (result.isValid) {
 *   console.log(`Senha válida com força: ${result.strength}`);
 * } else {
 *   console.log('Erros:', result.errors.join(', '));
 * }
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Validar comprimento mínimo
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }

  // Validar presença de letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }

  // Validar presença de letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }

  // Validar presença de número
  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }

  // Validar se não é uma senha comum
  if (isCommonPassword(password)) {
    errors.push('Esta senha é muito comum. Escolha uma senha mais segura');
  }

  // Calcular força da senha
  const strengthScore = calculatePasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors,
    strength: strengthScore.level,
  };
}

/**
 * Calcula a força de uma senha com base em diversos critérios
 *
 * @param password - Senha a ser avaliada
 * @returns Score de 0-100 e nível de força (fraca/média/forte)
 *
 * Critérios avaliados:
 * - Comprimento (quanto maior, melhor)
 * - Variedade de caracteres (minúsculas, maiúsculas, números, símbolos)
 * - Padrões comuns (penaliza sequências e repetições)
 */
export function calculatePasswordStrength(password: string): PasswordStrengthScore {
  let score = 0;

  if (!password) {
    return { score: 0, level: 'weak' };
  }

  // Pontuação por comprimento (máximo 30 pontos)
  score += Math.min(password.length * 3, 30);

  // Pontuação por variedade de caracteres
  if (/[a-z]/.test(password)) score += 15; // Minúsculas
  if (/[A-Z]/.test(password)) score += 15; // Maiúsculas
  if (/[0-9]/.test(password)) score += 15; // Números
  if (/[^a-zA-Z0-9]/.test(password)) score += 25; // Caracteres especiais

  // Bônus por combinações
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);

  if (hasLetters && hasNumbers) score += 10;
  if ((hasLetters || hasNumbers) && hasSpecialChars) score += 10;

  // Penalizar por padrões fracos
  score -= checkWeakPatterns(password);

  // Garantir que o score está entre 0 e 100
  score = Math.max(0, Math.min(100, score));

  // Determinar nível
  let level: PasswordStrength = 'weak';
  if (score >= STRONG_PASSWORD_MIN_SCORE) {
    level = 'strong';
  } else if (score >= MEDIUM_PASSWORD_MIN_SCORE) {
    level = 'medium';
  }

  return { score, level };
}

/**
 * Verifica se a senha está na lista de senhas comuns
 * Seguindo recomendação NIST de verificar contra senhas comprometidas/comuns
 *
 * @param password - Senha a ser verificada
 * @returns true se a senha está na lista de senhas comuns, false caso contrário
 *
 * @example
 * isCommonPassword('123456') // true
 * isCommonPassword('MySecureP@ss123') // false
 */
export function isCommonPassword(password: string): boolean {
  if (!password) return false;

  // Comparação case-insensitive para cobrir variações
  const lowerPassword = password.toLowerCase();
  return COMMON_PASSWORDS.includes(lowerPassword);
}

/**
 * Verifica padrões fracos na senha e retorna penalidade
 *
 * @param password - Senha a ser verificada
 * @returns Pontos a serem subtraídos do score (penalidade)
 */
function checkWeakPatterns(password: string): number {
  let penalty = 0;

  // Penalizar repetições (ex: "aaa", "111")
  if (/(.)\1{2,}/.test(password)) {
    penalty += 10;
  }

  // Penalizar sequências comuns (ex: "abc", "123")
  const sequences = ['abc', '123', 'qwerty', 'asdf'];
  for (const seq of sequences) {
    if (password.toLowerCase().includes(seq)) {
      penalty += 15;
    }
  }

  // Penalizar se for muito curta (menos de 8 caracteres)
  if (password.length < MIN_PASSWORD_LENGTH) {
    penalty += 20;
  }

  // Penalizar senhas comuns
  if (isCommonPassword(password)) {
    penalty += 50;
  }

  return penalty;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Verifica se a senha atende aos requisitos mínimos
 * Versão simplificada do validatePassword que retorna apenas boolean
 *
 * @param password - Senha a ser verificada
 * @returns true se a senha é válida, false caso contrário
 */
export function isPasswordValid(password: string): boolean {
  const result = validatePassword(password);
  return result.isValid;
}

/**
 * Obtém a cor correspondente ao nível de força da senha
 * Útil para exibição visual em componentes de UI
 *
 * @param strength - Nível de força da senha
 * @returns Classe CSS do Tailwind para cor
 */
export function getPasswordStrengthColor(strength: PasswordStrength): string {
  const colors: Record<PasswordStrength, string> = {
    weak: 'text-red-600',
    medium: 'text-yellow-600',
    strong: 'text-green-600',
  };
  return colors[strength];
}

/**
 * Obtém o texto descritivo do nível de força da senha
 *
 * @param strength - Nível de força da senha
 * @returns Texto em português descrevendo a força
 */
export function getPasswordStrengthLabel(strength: PasswordStrength): string {
  const labels: Record<PasswordStrength, string> = {
    weak: 'Fraca',
    medium: 'Média',
    strong: 'Forte',
  };
  return labels[strength];
}

/**
 * Obtém lista de requisitos de senha com status de atendimento
 * Útil para mostrar checklist em tempo real na UI
 *
 * @param password - Senha a ser verificada
 * @returns Array de requisitos com status de cumprimento
 */
export function getPasswordRequirements(password: string): Array<{
  text: string;
  met: boolean;
}> {
  return [
    {
      text: `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`,
      met: password.length >= MIN_PASSWORD_LENGTH,
    },
    {
      text: 'Pelo menos uma letra maiúscula',
      met: /[A-Z]/.test(password),
    },
    {
      text: 'Pelo menos uma letra minúscula',
      met: /[a-z]/.test(password),
    },
    {
      text: 'Pelo menos um número',
      met: /[0-9]/.test(password),
    },
    {
      text: 'Não pode ser uma senha comum',
      met: !isCommonPassword(password),
    },
  ];
}
