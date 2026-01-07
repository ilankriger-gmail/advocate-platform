/**
 * Testes para funções utilitárias
 */

import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getInitials,
  truncate,
  slugify,
} from '@/lib/utils';

describe('Date Formatting Functions', () => {
  describe('formatDate', () => {
    it('should format a date with default options', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDate(date);

      // Formato padrão: DD de MMM de YYYY
      expect(result).toMatch(/15 de jan\. de 2024/);
    });

    it('should format a date string', () => {
      const dateString = '2024-12-25T00:00:00';
      const result = formatDate(dateString);

      expect(result).toMatch(/25 de dez\. de 2024/);
    });

    it('should format a date with custom options', () => {
      const date = new Date('2024-06-10T10:30:00');
      const result = formatDate(date, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      expect(result).toMatch(/10 de junho de 2024/);
    });

    it('should handle ISO date strings', () => {
      const isoDate = '2024-03-20T15:45:30.000Z';
      const result = formatDate(isoDate);

      expect(result).toContain('2024');
      expect(result).toContain('mar');
    });

    it('should override default options with custom ones', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDate(date, {
        year: '2-digit',
      });

      // Deve usar year de 2 dígitos mas manter day e month padrão
      expect(result).toMatch(/24/);
    });
  });

  describe('formatDateTime', () => {
    it('should format a date with time', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDateTime(date);

      // Deve incluir data e hora
      expect(result).toMatch(/15 de jan\. de 2024/);
      expect(result).toMatch(/10:30/);
    });

    it('should format a date string with time', () => {
      const dateString = '2024-12-25T23:45:00';
      const result = formatDateTime(dateString);

      expect(result).toMatch(/25 de dez\. de 2024/);
      expect(result).toMatch(/23:45/);
    });

    it('should handle midnight correctly', () => {
      const date = new Date('2024-03-01T00:00:00');
      const result = formatDateTime(date);

      expect(result).toMatch(/00:00/);
    });

    it('should handle noon correctly', () => {
      const date = new Date('2024-06-15T12:00:00');
      const result = formatDateTime(date);

      expect(result).toMatch(/12:00/);
    });

    it('should format single digit hours and minutes with leading zeros', () => {
      const date = new Date('2024-01-05T09:05:00');
      const result = formatDateTime(date);

      expect(result).toMatch(/09:05/);
    });
  });

  describe('formatRelativeTime', () => {
    // Helper para criar data relativa ao now
    const createRelativeDate = (secondsAgo: number): Date => {
      const now = new Date();
      return new Date(now.getTime() - secondsAgo * 1000);
    };

    it('should return "agora mesmo" for times less than 60 seconds ago', () => {
      const date = createRelativeDate(30);
      const result = formatRelativeTime(date);

      expect(result).toBe('agora mesmo');
    });

    it('should return "agora mesmo" for just now (0 seconds)', () => {
      const date = createRelativeDate(0);
      const result = formatRelativeTime(date);

      expect(result).toBe('agora mesmo');
    });

    it('should format minutes correctly (singular)', () => {
      const date = createRelativeDate(60); // 1 minuto
      const result = formatRelativeTime(date);

      expect(result).toBe('há 1 minuto');
    });

    it('should format minutes correctly (plural)', () => {
      const date = createRelativeDate(5 * 60); // 5 minutos
      const result = formatRelativeTime(date);

      expect(result).toBe('há 5 minutos');
    });

    it('should format 59 minutes as minutes, not hours', () => {
      const date = createRelativeDate(59 * 60); // 59 minutos
      const result = formatRelativeTime(date);

      expect(result).toBe('há 59 minutos');
    });

    it('should format hours correctly (singular)', () => {
      const date = createRelativeDate(60 * 60); // 1 hora
      const result = formatRelativeTime(date);

      expect(result).toBe('há 1 hora');
    });

    it('should format hours correctly (plural)', () => {
      const date = createRelativeDate(3 * 60 * 60); // 3 horas
      const result = formatRelativeTime(date);

      expect(result).toBe('há 3 horas');
    });

    it('should format 23 hours as hours, not days', () => {
      const date = createRelativeDate(23 * 60 * 60); // 23 horas
      const result = formatRelativeTime(date);

      expect(result).toBe('há 23 horas');
    });

    it('should format days correctly (singular)', () => {
      const date = createRelativeDate(24 * 60 * 60); // 1 dia
      const result = formatRelativeTime(date);

      expect(result).toBe('há 1 dia');
    });

    it('should format days correctly (plural)', () => {
      const date = createRelativeDate(4 * 24 * 60 * 60); // 4 dias
      const result = formatRelativeTime(date);

      expect(result).toBe('há 4 dias');
    });

    it('should format 6 days as days, not use full date', () => {
      const date = createRelativeDate(6 * 24 * 60 * 60); // 6 dias
      const result = formatRelativeTime(date);

      expect(result).toBe('há 6 dias');
    });

    it('should use full date format for 7+ days ago', () => {
      const date = new Date('2024-01-01T10:00:00');
      const result = formatRelativeTime(date);

      // Para datas antigas, deve retornar data formatada
      expect(result).toContain('2024');
      expect(result).toContain('jan');
    });

    it('should handle date strings', () => {
      const dateString = createRelativeDate(2 * 60 * 60).toISOString(); // 2 horas
      const result = formatRelativeTime(dateString);

      expect(result).toBe('há 2 horas');
    });

    it('should handle ISO date strings', () => {
      const date = createRelativeDate(30 * 60); // 30 minutos
      const isoDate = date.toISOString();
      const result = formatRelativeTime(isoDate);

      expect(result).toBe('há 30 minutos');
    });

    it('should handle future dates as if they were now', () => {
      // Data no futuro (deveria retornar agora mesmo ou data formatada)
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hora no futuro
      const result = formatRelativeTime(futureDate);

      // O comportamento pode variar, mas não deve quebrar
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('formatDate should handle Date object', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(() => formatDate(date)).not.toThrow();
    });

    it('formatDateTime should handle Date object', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(() => formatDateTime(date)).not.toThrow();
    });

    it('formatRelativeTime should handle Date object', () => {
      const date = new Date();
      expect(() => formatRelativeTime(date)).not.toThrow();
    });

    it('formatDate should handle string date', () => {
      const dateString = '2024-01-15T10:30:00';
      expect(() => formatDate(dateString)).not.toThrow();
    });

    it('formatDateTime should handle string date', () => {
      const dateString = '2024-01-15T10:30:00';
      expect(() => formatDateTime(dateString)).not.toThrow();
    });

    it('formatRelativeTime should handle string date', () => {
      const dateString = new Date().toISOString();
      expect(() => formatRelativeTime(dateString)).not.toThrow();
    });
  });
});

describe('String Utility Functions', () => {
  describe('getInitials', () => {
    it('should return initials from a full name', () => {
      const result = getInitials('João Silva');
      expect(result).toBe('JS');
    });

    it('should return initials from a name with three words', () => {
      const result = getInitials('João Pedro Silva');
      expect(result).toBe('JP');
    });

    it('should return initials from a name with multiple words', () => {
      const result = getInitials('Maria José Santos Oliveira');
      expect(result).toBe('MJ');
    });

    it('should return only first 2 initials even for longer names', () => {
      const result = getInitials('Ana Beatriz Carolina Diana');
      expect(result).toBe('AB');
    });

    it('should return uppercase initials', () => {
      const result = getInitials('joão silva');
      expect(result).toBe('JS');
    });

    it('should handle single word names', () => {
      const result = getInitials('João');
      expect(result).toBe('J');
    });

    it('should return "?" for null', () => {
      const result = getInitials(null);
      expect(result).toBe('?');
    });

    it('should return "?" for undefined', () => {
      const result = getInitials(undefined);
      expect(result).toBe('?');
    });

    it('should return "?" for empty string', () => {
      const result = getInitials('');
      expect(result).toBe('?');
    });

    it('should handle names with extra spaces', () => {
      const result = getInitials('João  Silva');
      expect(result).toBe('JS');
    });

    it('should handle names with leading/trailing spaces', () => {
      const result = getInitials('  João Silva  ');
      expect(result).toBe('JS');
    });

    it('should handle names with special characters', () => {
      const result = getInitials('José-Maria Silva');
      expect(result).toBe('JS');
    });

    it('should handle accented characters', () => {
      const result = getInitials('Ângela Mônica');
      expect(result).toBe('ÂM');
    });
  });

  describe('truncate', () => {
    it('should not truncate text shorter than maxLength', () => {
      const result = truncate('Hello', 10);
      expect(result).toBe('Hello');
    });

    it('should not truncate text equal to maxLength', () => {
      const result = truncate('Hello World', 11);
      expect(result).toBe('Hello World');
    });

    it('should truncate text longer than maxLength', () => {
      const result = truncate('This is a long text', 10);
      expect(result).toBe('This is...');
    });

    it('should truncate and add ellipsis correctly', () => {
      const result = truncate('Lorem ipsum dolor sit amet', 15);
      expect(result).toBe('Lorem ipsum...');
      expect(result.length).toBe(15);
    });

    it('should handle exact boundary case', () => {
      const result = truncate('Hello', 5);
      expect(result).toBe('Hello');
    });

    it('should handle maxLength of 3 (minimum for ellipsis)', () => {
      const result = truncate('Hello', 3);
      expect(result).toBe('...');
    });

    it('should handle maxLength of 4', () => {
      const result = truncate('Hello World', 4);
      expect(result).toBe('H...');
    });

    it('should handle empty string', () => {
      const result = truncate('', 10);
      expect(result).toBe('');
    });

    it('should handle single character', () => {
      const result = truncate('A', 10);
      expect(result).toBe('A');
    });

    it('should preserve text structure when not truncating', () => {
      const result = truncate('Hello\nWorld', 20);
      expect(result).toBe('Hello\nWorld');
    });

    it('should truncate text with special characters', () => {
      const result = truncate('Olá! Como você está?', 10);
      expect(result).toBe('Olá! Co...');
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(1000);
      const result = truncate(longText, 50);
      expect(result.length).toBe(50);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('slugify', () => {
    it('should convert text to lowercase slug', () => {
      const result = slugify('Hello World');
      expect(result).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      const result = slugify('This is a test');
      expect(result).toBe('this-is-a-test');
    });

    it('should remove accents from characters', () => {
      const result = slugify('Café com Pão');
      expect(result).toBe('cafe-com-pao');
    });

    it('should handle Portuguese characters', () => {
      const result = slugify('Ação Notificação');
      expect(result).toBe('acao-notificacao');
    });

    it('should remove special characters', () => {
      const result = slugify('Hello! World?');
      expect(result).toBe('hello-world');
    });

    it('should handle multiple special characters', () => {
      const result = slugify('Hello@#$ %^&*() World');
      expect(result).toBe('hello-world');
    });

    it('should remove leading hyphens', () => {
      const result = slugify('---Hello World');
      expect(result).toBe('hello-world');
    });

    it('should remove trailing hyphens', () => {
      const result = slugify('Hello World---');
      expect(result).toBe('hello-world');
    });

    it('should remove both leading and trailing hyphens', () => {
      const result = slugify('---Hello World---');
      expect(result).toBe('hello-world');
    });

    it('should collapse multiple hyphens into one', () => {
      const result = slugify('Hello     World');
      expect(result).toBe('hello-world');
    });

    it('should handle text with numbers', () => {
      const result = slugify('Product 123');
      expect(result).toBe('product-123');
    });

    it('should handle mixed case with numbers', () => {
      const result = slugify('iPhone 15 Pro Max');
      expect(result).toBe('iphone-15-pro-max');
    });

    it('should handle empty string', () => {
      const result = slugify('');
      expect(result).toBe('');
    });

    it('should handle only special characters', () => {
      const result = slugify('!@#$%^&*()');
      expect(result).toBe('');
    });

    it('should handle only spaces', () => {
      const result = slugify('     ');
      expect(result).toBe('');
    });

    it('should handle underscores', () => {
      const result = slugify('Hello_World');
      expect(result).toBe('hello-world');
    });

    it('should handle complex Portuguese text', () => {
      const result = slugify('João é o melhor programador!');
      expect(result).toBe('joao-e-o-melhor-programador');
    });

    it('should handle text with quotes', () => {
      const result = slugify("It's a beautiful day");
      expect(result).toBe('it-s-a-beautiful-day');
    });

    it('should handle text with periods', () => {
      const result = slugify('Hello. World. Test.');
      expect(result).toBe('hello-world-test');
    });

    it('should create valid URLs slugs', () => {
      const result = slugify('Meu Artigo Sobre TypeScript');
      expect(result).toBe('meu-artigo-sobre-typescript');
      // Verifica se é um slug válido para URL
      expect(result).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    });
  });
});
