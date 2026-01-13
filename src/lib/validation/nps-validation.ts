/**
 * Validação de NPS - Filtros Inteligentes
 *
 * Funções para validar nome, motivo e detectar typos em emails
 */

// Padrões de teclado comuns (qwerty, numpad, etc)
const KEYBOARD_PATTERNS = [
  'qwerty', 'qwertz', 'azerty', 'qwer', 'asdf', 'zxcv', 'wasd',
  '1234', '12345', '123456', '0987', '9876',
  'qazwsx', 'qazxsw', 'zaqwsx',
  'abcd', 'bcde', 'cdef',
];

// Mapa de typos de domínios comuns → domínio correto
export const EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  // Gmail
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gemail.com': 'gmail.com',
  'gimail.com': 'gmail.com',
  'g]mail.com': 'gmail.com',
  // Hotmail
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotamail.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmeil.com': 'hotmail.com',
  'hotamil.com': 'hotmail.com',
  'hitmail.com': 'hotmail.com',
  // Outlook
  'outlock.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outllook.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlool.com': 'outlook.com',
  'outook.com': 'outlook.com',
  // Yahoo
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  // iCloud
  'iclould.com': 'icloud.com',
  'icould.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  // UOL
  'uol.com': 'uol.com.br',
  'uol.con.br': 'uol.com.br',
  // BOL
  'bol.con.br': 'bol.com.br',
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Verifica se uma string contém padrão de teclado
 */
function hasKeyboardPattern(text: string): boolean {
  const lower = text.toLowerCase().replace(/\s/g, '');
  return KEYBOARD_PATTERNS.some(pattern => lower.includes(pattern));
}

/**
 * Verifica se tem caracteres repetidos demais (ex: aaaa, xxxx)
 */
function hasExcessiveRepeating(text: string, maxRepeat = 3): boolean {
  const regex = new RegExp(`(.)\\1{${maxRepeat},}`, 'i');
  return regex.test(text);
}

/**
 * Conta vogais em uma string
 */
function countVowels(text: string): number {
  return (text.match(/[aeiouáéíóúàèìòùâêîôûãõ]/gi) || []).length;
}

/**
 * Verifica se é apenas números
 */
function isOnlyNumbers(text: string): boolean {
  return /^\d+$/.test(text.replace(/\s/g, ''));
}

/**
 * Verifica se é apenas pontuação/símbolos
 */
function isOnlySymbols(text: string): boolean {
  return /^[^a-zA-Z0-9áéíóúàèìòùâêîôûãõÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕçÇ]+$/.test(text);
}

/**
 * Valida nome - verifica se é um nome real
 *
 * Regras:
 * - Mínimo 2 partes (nome + sobrenome)
 * - Cada parte com mínimo 2 caracteres
 * - Sem padrões de teclado
 * - Sem caracteres excessivamente repetidos
 * - Tem vogais suficientes (nomes reais têm vogais)
 * - Não é só números
 */
export function validateName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nome é obrigatório' };
  }

  const trimmed = name.trim();

  // Mínimo de caracteres total
  if (trimmed.length < 3) {
    return { valid: false, error: 'Nome muito curto' };
  }

  // Dividir em partes (nome e sobrenome)
  const parts = trimmed.split(/\s+/).filter(p => p.length > 0);

  // Precisa ter pelo menos nome e sobrenome
  if (parts.length < 2) {
    return { valid: false, error: 'Por favor, informe seu nome completo (nome e sobrenome)' };
  }

  // Cada parte precisa ter pelo menos 2 caracteres
  const shortParts = parts.filter(p => p.length < 2);
  if (shortParts.length > 0) {
    return { valid: false, error: 'Nome ou sobrenome muito curto' };
  }

  // Verificar se é só números
  if (isOnlyNumbers(trimmed)) {
    return { valid: false, error: 'Nome não pode conter apenas números' };
  }

  // Verificar padrões de teclado
  if (hasKeyboardPattern(trimmed)) {
    return { valid: false, error: 'Por favor, informe um nome válido' };
  }

  // Verificar caracteres repetidos (aaaa, xxxx)
  if (hasExcessiveRepeating(trimmed, 2)) {
    return { valid: false, error: 'Por favor, informe um nome válido' };
  }

  // Verificar se tem vogais suficientes (pelo menos 15% do nome)
  const vowelRatio = countVowels(trimmed) / trimmed.replace(/\s/g, '').length;
  if (vowelRatio < 0.15) {
    return { valid: false, error: 'Por favor, informe um nome válido' };
  }

  // Verificar se não tem só consonantes seguidas demais (mais de 5)
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(trimmed.replace(/\s/g, ''))) {
    return { valid: false, error: 'Por favor, informe um nome válido' };
  }

  return { valid: true };
}

/**
 * Valida motivo/reason - verifica se é uma resposta real
 *
 * Regras:
 * - Mínimo 10 caracteres
 * - Mínimo 2 palavras
 * - Sem padrões de teclado
 * - Sem só caracteres repetidos
 * - Sem só pontuação/símbolos
 */
export function validateReason(reason: string): ValidationResult {
  if (!reason || typeof reason !== 'string') {
    return { valid: false, error: 'Por favor, explique o motivo da sua nota' };
  }

  const trimmed = reason.trim();

  // Mínimo de caracteres
  if (trimmed.length < 10) {
    return { valid: false, error: 'Por favor, escreva pelo menos 10 caracteres explicando o motivo' };
  }

  // Mínimo de palavras (pelo menos 2)
  const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
  if (words.length < 2) {
    return { valid: false, error: 'Por favor, escreva uma resposta mais completa' };
  }

  // Verificar se é só símbolos/pontuação
  if (isOnlySymbols(trimmed)) {
    return { valid: false, error: 'Por favor, escreva uma resposta válida' };
  }

  // Verificar se é só números
  if (isOnlyNumbers(trimmed)) {
    return { valid: false, error: 'Por favor, escreva uma resposta em texto' };
  }

  // Verificar padrões de teclado
  if (hasKeyboardPattern(trimmed)) {
    return { valid: false, error: 'Por favor, escreva uma resposta válida' };
  }

  // Verificar caracteres repetidos excessivos (kkkkk, hahaha)
  if (hasExcessiveRepeating(trimmed, 3)) {
    return { valid: false, error: 'Por favor, escreva uma resposta mais elaborada' };
  }

  // Verificar se mais de 80% são o mesmo caractere
  const charCount: Record<string, number> = {};
  for (const char of trimmed.toLowerCase().replace(/\s/g, '')) {
    charCount[char] = (charCount[char] || 0) + 1;
  }
  const totalChars = trimmed.replace(/\s/g, '').length;
  const maxCharCount = Math.max(...Object.values(charCount));
  if (maxCharCount / totalChars > 0.8) {
    return { valid: false, error: 'Por favor, escreva uma resposta válida' };
  }

  return { valid: true };
}

/**
 * Verifica se email tem typo comum e retorna sugestão
 */
export function checkEmailTypo(email: string): {
  hasTypo: boolean;
  suggestion?: string;
  correctedEmail?: string;
} {
  if (!email || !email.includes('@')) {
    return { hasTypo: false };
  }

  const [localPart, domain] = email.toLowerCase().trim().split('@');

  if (!domain) {
    return { hasTypo: false };
  }

  const correctDomain = EMAIL_DOMAIN_TYPOS[domain];

  if (correctDomain) {
    return {
      hasTypo: true,
      suggestion: correctDomain,
      correctedEmail: `${localPart}@${correctDomain}`,
    };
  }

  return { hasTypo: false };
}

/**
 * Valida telefone brasileiro
 *
 * Regras:
 * - Campo opcional (vazio é válido)
 * - Se preenchido: 10-11 dígitos (com ou sem DDD)
 * - Não pode ser só números repetidos (1111111111)
 * - Não pode ser padrão de teclado
 */
export function validatePhone(phone: string): ValidationResult {
  // Campo opcional - vazio é válido
  if (!phone || phone.trim() === '') {
    return { valid: true };
  }

  const trimmed = phone.trim();

  // Remover caracteres não numéricos para validação
  const digits = trimmed.replace(/\D/g, '');

  // Se digitou algo mas não tem dígitos suficientes
  if (digits.length === 0) {
    return { valid: false, error: 'Telefone inválido' };
  }

  // Telefone brasileiro: 10-11 dígitos (DDD + número)
  if (digits.length < 10 || digits.length > 11) {
    return { valid: false, error: 'Telefone inválido. Use formato (00) 00000-0000' };
  }

  // Verificar se não é só números repetidos (11111111111)
  if (/^(\d)\1+$/.test(digits)) {
    return { valid: false, error: 'Telefone inválido' };
  }

  // Verificar se não é sequência simples (12345678901)
  const isSequence = digits.split('').every((d, i, arr) => {
    if (i === 0) return true;
    return Math.abs(parseInt(d, 10) - parseInt(arr[i - 1], 10)) <= 1;
  });
  if (isSequence && digits.length >= 10) {
    return { valid: false, error: 'Telefone inválido' };
  }

  return { valid: true };
}
