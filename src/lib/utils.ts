/**
 * Funções utilitárias
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes do Tailwind de forma inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma data para exibição
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  };

  return new Date(date).toLocaleDateString('pt-BR', defaultOptions);
}

/**
 * Formata uma data com hora
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata data relativa (ex: "há 2 horas")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
  }

  return formatDate(date);
}

/**
 * Formata pontos com separador de milhar
 */
export function formatPoints(points: number): string {
  return points.toLocaleString('pt-BR');
}

/**
 * Obtém iniciais de um nome
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';

  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Trunca texto com ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Gera slug a partir de texto
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formata número de forma compacta (1K, 1M, etc)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Aguarda um tempo em ms
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gera um ID único simples
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Verifica se uma URL é válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retorna a cor do nível do advocate
 */
export function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    1: 'text-gray-600',
    2: 'text-amber-600',
    3: 'text-slate-600',
    4: 'text-yellow-600',
    5: 'text-cyan-600',
    6: 'text-purple-600',
  };
  return colors[level] || colors[1];
}

/**
 * Retorna o nome do nível do advocate
 */
export function getLevelName(level: number): string {
  const names: Record<number, string> = {
    1: 'Iniciante',
    2: 'Bronze',
    3: 'Prata',
    4: 'Ouro',
    5: 'Platina',
    6: 'Diamante',
  };
  return names[level] || names[1];
}
