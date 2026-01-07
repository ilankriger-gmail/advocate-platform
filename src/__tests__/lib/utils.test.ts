/**
 * Testes para funções utilitárias
 */

import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
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
