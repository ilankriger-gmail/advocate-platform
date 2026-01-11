/**
 * Testes para validação de senha
 *
 * Testa as funções de validação de senha seguindo recomendações NIST:
 * - Validação de comprimento mínimo
 * - Validação de complexidade (maiúscula, minúscula, número)
 * - Verificação de senhas comuns
 * - Cálculo de força da senha
 */

import {
  validatePassword,
  calculatePasswordStrength,
  isCommonPassword,
  isPasswordValid,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  getPasswordRequirements,
  type PasswordValidationResult,
  type PasswordStrengthScore,
  type PasswordStrength,
} from '@/lib/password-validation';

describe('Password Validation Functions', () => {
  describe('validatePassword', () => {
    describe('senhas curtas', () => {
      it('should reject password with less than 8 characters', () => {
        const result = validatePassword('Ab1');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('A senha deve ter pelo menos 8 caracteres');
      });

      it('should reject password with exactly 7 characters', () => {
        const result = validatePassword('Abc1234');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('A senha deve ter pelo menos 8 caracteres');
      });

      it('should reject empty string', () => {
        const result = validatePassword('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('A senha deve ter pelo menos 8 caracteres');
      });

      it('should accept password with exactly 8 characters', () => {
        const result = validatePassword('Abc12345');
        expect(result.isValid).toBe(true);
        expect(result.errors).not.toContain('A senha deve ter pelo menos 8 caracteres');
      });

      it('should accept password longer than 8 characters', () => {
        const result = validatePassword('Abc123456789');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('senhas sem complexidade', () => {
      it('should reject password without uppercase letter', () => {
        const result = validatePassword('abc12345');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('A senha deve conter pelo menos uma letra maiúscula');
      });

      it('should reject password without lowercase letter', () => {
        const result = validatePassword('ABC12345');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('A senha deve conter pelo menos uma letra minúscula');
      });

      it('should reject password without number', () => {
        const result = validatePassword('AbcdEfgh');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('A senha deve conter pelo menos um número');
      });

      it('should reject password with only lowercase', () => {
        const result = validatePassword('abcdefgh');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('A senha deve conter pelo menos uma letra maiúscula');
        expect(result.errors).toContain('A senha deve conter pelo menos um número');
      });

      it('should reject password with only uppercase', () => {
        const result = validatePassword('ABCDEFGH');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('A senha deve conter pelo menos uma letra minúscula');
        expect(result.errors).toContain('A senha deve conter pelo menos um número');
      });

      it('should reject password with only numbers', () => {
        const result = validatePassword('12345678');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('A senha deve conter pelo menos uma letra maiúscula');
        expect(result.errors).toContain('A senha deve conter pelo menos uma letra minúscula');
      });

      it('should reject password missing all complexity requirements', () => {
        const result = validatePassword('abc');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(4); // curta + sem maiúscula + sem número
        expect(result.errors).toContain('A senha deve ter pelo menos 8 caracteres');
        expect(result.errors).toContain('A senha deve conter pelo menos uma letra maiúscula');
        expect(result.errors).toContain('A senha deve conter pelo menos um número');
      });

      it('should accept password with all complexity requirements', () => {
        const result = validatePassword('Abc12345');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with multiple uppercase letters', () => {
        const result = validatePassword('ABCdef123');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with multiple numbers', () => {
        const result = validatePassword('Abc123456');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with special characters', () => {
        const result = validatePassword('Abc123!@#');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('senhas comuns', () => {
      it('should reject common password "123456"', () => {
        const result = validatePassword('123456');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Esta senha é muito comum. Escolha uma senha mais segura');
      });

      it('should reject common password "password"', () => {
        const result = validatePassword('password');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Esta senha é muito comum. Escolha uma senha mais segura');
      });

      it('should reject common password "qwerty"', () => {
        const result = validatePassword('qwerty');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Esta senha é muito comum. Escolha uma senha mais segura');
      });

      it('should reject common password "admin123"', () => {
        const result = validatePassword('admin123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Esta senha é muito comum. Escolha uma senha mais segura');
      });

      it('should reject common password "senha123"', () => {
        const result = validatePassword('senha123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Esta senha é muito comum. Escolha uma senha mais segura');
      });

      it('should reject common password case-insensitive', () => {
        const result = validatePassword('PASSWORD');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Esta senha é muito comum. Escolha uma senha mais segura');
      });

      it('should reject common password "Password1"', () => {
        const result = validatePassword('Password1');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Esta senha é muito comum. Escolha uma senha mais segura');
      });

      it('should accept uncommon password', () => {
        const result = validatePassword('MySecure123');
        expect(result.isValid).toBe(true);
        expect(result.errors).not.toContain('Esta senha é muito comum. Escolha uma senha mais segura');
      });
    });

    describe('senhas validas', () => {
      it('should accept strong password with all requirements', () => {
        const result = validatePassword('MyP@ssw0rd123');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with minimum requirements', () => {
        const result = validatePassword('Abc12345');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept long password', () => {
        const result = validatePassword('ThisIsAVeryLongPassword123456');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with special characters', () => {
        const result = validatePassword('MyP@ss!2023');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with accented characters', () => {
        const result = validatePassword('Sênha123');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with spaces', () => {
        const result = validatePassword('My Pass 123');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password starting with number', () => {
        const result = validatePassword('1Abcdefg');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password ending with uppercase', () => {
        const result = validatePassword('abc123Z');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('resultado da validacao', () => {
      it('should return correct structure for valid password', () => {
        const result: PasswordValidationResult = validatePassword('MyPass123');
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('strength');
        expect(typeof result.isValid).toBe('boolean');
        expect(Array.isArray(result.errors)).toBe(true);
        expect(['weak', 'medium', 'strong']).toContain(result.strength);
      });

      it('should return correct structure for invalid password', () => {
        const result: PasswordValidationResult = validatePassword('abc');
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('strength');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should include strength level for valid password', () => {
        const result = validatePassword('Abc12345');
        expect(result.strength).toBeDefined();
        expect(['weak', 'medium', 'strong']).toContain(result.strength);
      });

      it('should include strength level even for invalid password', () => {
        const result = validatePassword('abc');
        expect(result.strength).toBeDefined();
        expect(['weak', 'medium', 'strong']).toContain(result.strength);
      });
    });
  });

  describe('calculatePasswordStrength', () => {
    describe('calculo de forca', () => {
      it('should return score of 0 for empty password', () => {
        const result = calculatePasswordStrength('');
        expect(result.score).toBe(0);
        expect(result.level).toBe('weak');
      });

      it('should return weak for very short password', () => {
        const result = calculatePasswordStrength('Ab1');
        expect(result.level).toBe('weak');
        expect(result.score).toBeLessThan(50);
      });

      it('should return weak for password with only lowercase', () => {
        const result = calculatePasswordStrength('abcdefgh');
        expect(result.level).toBe('weak');
      });

      it('should return higher score for longer password', () => {
        const short = calculatePasswordStrength('Abc123');
        const long = calculatePasswordStrength('Abc123456789');
        expect(long.score).toBeGreaterThan(short.score);
      });

      it('should return higher score for password with uppercase', () => {
        const withoutUpper = calculatePasswordStrength('abc12345');
        const withUpper = calculatePasswordStrength('Abc12345');
        expect(withUpper.score).toBeGreaterThan(withoutUpper.score);
      });

      it('should return higher score for password with numbers', () => {
        const withoutNumbers = calculatePasswordStrength('Abcdefgh');
        const withNumbers = calculatePasswordStrength('Abcd1234');
        expect(withNumbers.score).toBeGreaterThan(withoutNumbers.score);
      });

      it('should return higher score for password with special characters', () => {
        const withoutSpecial = calculatePasswordStrength('Abc12345');
        const withSpecial = calculatePasswordStrength('Abc123!@');
        expect(withSpecial.score).toBeGreaterThan(withoutSpecial.score);
      });

      it('should return medium strength for moderately complex password', () => {
        const result = calculatePasswordStrength('Abc12345');
        expect(result.level).toBe('medium');
        expect(result.score).toBeGreaterThanOrEqual(50);
        expect(result.score).toBeLessThan(80);
      });

      it('should return strong for very complex password', () => {
        const result = calculatePasswordStrength('MyP@ssw0rd!2023');
        expect(result.level).toBe('strong');
        expect(result.score).toBeGreaterThanOrEqual(80);
      });

      it('should return correct structure', () => {
        const result: PasswordStrengthScore = calculatePasswordStrength('Abc123');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('level');
        expect(typeof result.score).toBe('number');
        expect(['weak', 'medium', 'strong']).toContain(result.level);
      });

      it('should keep score between 0 and 100', () => {
        const veryShort = calculatePasswordStrength('a');
        const veryLong = calculatePasswordStrength('A'.repeat(1000) + 'b1!@#$%');
        expect(veryShort.score).toBeGreaterThanOrEqual(0);
        expect(veryShort.score).toBeLessThanOrEqual(100);
        expect(veryLong.score).toBeGreaterThanOrEqual(0);
        expect(veryLong.score).toBeLessThanOrEqual(100);
      });
    });

    describe('penalizacoes', () => {
      it('should penalize password with repetitions', () => {
        const withoutReps = calculatePasswordStrength('Abc12345');
        const withReps = calculatePasswordStrength('Aaa12345');
        expect(withReps.score).toBeLessThan(withoutReps.score);
      });

      it('should penalize password with common sequences', () => {
        const withoutSeq = calculatePasswordStrength('Def45678');
        const withSeq = calculatePasswordStrength('Abc12345');
        expect(withSeq.score).toBeLessThan(withoutSeq.score);
      });

      it('should penalize common password', () => {
        const uncommon = calculatePasswordStrength('MySecure123');
        const common = calculatePasswordStrength('Password1');
        expect(common.score).toBeLessThan(uncommon.score);
      });

      it('should penalize short password', () => {
        const longer = calculatePasswordStrength('Abc123456');
        const shorter = calculatePasswordStrength('Abc123');
        expect(shorter.score).toBeLessThan(longer.score);
      });
    });

    describe('bonus', () => {
      it('should give bonus for combining letters and numbers', () => {
        const lettersOnly = calculatePasswordStrength('AbcdefghIJ');
        const combined = calculatePasswordStrength('Abcdefgh12');
        expect(combined.score).toBeGreaterThan(lettersOnly.score);
      });

      it('should give bonus for combining letters/numbers with special chars', () => {
        const withoutSpecial = calculatePasswordStrength('Abcd1234');
        const withSpecial = calculatePasswordStrength('Abcd12!@');
        expect(withSpecial.score).toBeGreaterThan(withoutSpecial.score);
      });
    });
  });

  describe('isCommonPassword', () => {
    it('should return true for "123456"', () => {
      expect(isCommonPassword('123456')).toBe(true);
    });

    it('should return true for "password"', () => {
      expect(isCommonPassword('password')).toBe(true);
    });

    it('should return true for "qwerty"', () => {
      expect(isCommonPassword('qwerty')).toBe(true);
    });

    it('should return true for "admin"', () => {
      expect(isCommonPassword('admin')).toBe(true);
    });

    it('should return true for "senha"', () => {
      expect(isCommonPassword('senha')).toBe(true);
    });

    it('should return true for common password in uppercase', () => {
      expect(isCommonPassword('PASSWORD')).toBe(true);
    });

    it('should return true for common password in mixed case', () => {
      expect(isCommonPassword('Password')).toBe(true);
    });

    it('should return false for uncommon password', () => {
      expect(isCommonPassword('MySecurePassword123')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isCommonPassword('')).toBe(false);
    });

    it('should return false for random complex password', () => {
      expect(isCommonPassword('x9K!mP2@qL5#')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isCommonPassword('QWERTY')).toBe(true);
      expect(isCommonPassword('qWeRtY')).toBe(true);
      expect(isCommonPassword('qwerty')).toBe(true);
    });
  });

  describe('isPasswordValid', () => {
    it('should return true for valid password', () => {
      expect(isPasswordValid('MyPass123')).toBe(true);
    });

    it('should return false for invalid password', () => {
      expect(isPasswordValid('abc')).toBe(false);
    });

    it('should return false for short password', () => {
      expect(isPasswordValid('Abc123')).toBe(false);
    });

    it('should return false for password without uppercase', () => {
      expect(isPasswordValid('abc12345')).toBe(false);
    });

    it('should return false for password without lowercase', () => {
      expect(isPasswordValid('ABC12345')).toBe(false);
    });

    it('should return false for password without number', () => {
      expect(isPasswordValid('AbcdEfgh')).toBe(false);
    });

    it('should return false for common password', () => {
      expect(isPasswordValid('Password1')).toBe(false);
    });

    it('should return true for strong password', () => {
      expect(isPasswordValid('MyP@ssw0rd!123')).toBe(true);
    });
  });

  describe('getPasswordStrengthColor', () => {
    it('should return red color for weak password', () => {
      const color = getPasswordStrengthColor('weak');
      expect(color).toBe('text-red-600');
    });

    it('should return yellow color for medium password', () => {
      const color = getPasswordStrengthColor('medium');
      expect(color).toBe('text-yellow-600');
    });

    it('should return green color for strong password', () => {
      const color = getPasswordStrengthColor('strong');
      expect(color).toBe('text-green-600');
    });
  });

  describe('getPasswordStrengthLabel', () => {
    it('should return "Fraca" for weak password', () => {
      const label = getPasswordStrengthLabel('weak');
      expect(label).toBe('Fraca');
    });

    it('should return "Média" for medium password', () => {
      const label = getPasswordStrengthLabel('medium');
      expect(label).toBe('Média');
    });

    it('should return "Forte" for strong password', () => {
      const label = getPasswordStrengthLabel('strong');
      expect(label).toBe('Forte');
    });
  });

  describe('getPasswordRequirements', () => {
    it('should return array of requirements', () => {
      const requirements = getPasswordRequirements('');
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBe(5);
    });

    it('should have correct structure for each requirement', () => {
      const requirements = getPasswordRequirements('');
      requirements.forEach((req) => {
        expect(req).toHaveProperty('text');
        expect(req).toHaveProperty('met');
        expect(typeof req.text).toBe('string');
        expect(typeof req.met).toBe('boolean');
      });
    });

    it('should mark all requirements as not met for empty password', () => {
      const requirements = getPasswordRequirements('');
      requirements.forEach((req) => {
        expect(req.met).toBe(false);
      });
    });

    it('should mark all requirements as met for valid password', () => {
      const requirements = getPasswordRequirements('MyPass123');
      requirements.forEach((req) => {
        expect(req.met).toBe(true);
      });
    });

    it('should mark length requirement correctly', () => {
      const short = getPasswordRequirements('Abc123');
      const long = getPasswordRequirements('Abc12345');
      expect(short[0].met).toBe(false);
      expect(long[0].met).toBe(true);
    });

    it('should mark uppercase requirement correctly', () => {
      const without = getPasswordRequirements('abc12345');
      const with_ = getPasswordRequirements('Abc12345');
      expect(without[1].met).toBe(false);
      expect(with_[1].met).toBe(true);
    });

    it('should mark lowercase requirement correctly', () => {
      const without = getPasswordRequirements('ABC12345');
      const with_ = getPasswordRequirements('Abc12345');
      expect(without[2].met).toBe(false);
      expect(with_[2].met).toBe(true);
    });

    it('should mark number requirement correctly', () => {
      const without = getPasswordRequirements('AbcdEfgh');
      const with_ = getPasswordRequirements('Abcd1234');
      expect(without[3].met).toBe(false);
      expect(with_[3].met).toBe(true);
    });

    it('should mark common password requirement correctly', () => {
      const common = getPasswordRequirements('Password1');
      const uncommon = getPasswordRequirements('MyPass123');
      expect(common[4].met).toBe(false);
      expect(uncommon[4].met).toBe(true);
    });

    it('should include description in Portuguese', () => {
      const requirements = getPasswordRequirements('');
      expect(requirements[0].text).toContain('caracteres');
      expect(requirements[1].text).toContain('maiúscula');
      expect(requirements[2].text).toContain('minúscula');
      expect(requirements[3].text).toContain('número');
      expect(requirements[4].text).toContain('comum');
    });
  });
});
