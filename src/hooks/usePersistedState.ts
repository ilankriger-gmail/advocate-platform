'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para persistir estado no sessionStorage
 * Funciona como useState mas persiste o valor durante a sessão do navegador
 *
 * @param key - Chave única no sessionStorage
 * @param initialValue - Valor inicial se não houver valor salvo
 * @returns Tupla [valor, setValue] similar ao useState
 *
 * @example
 * // Persistir filtro de ordenação
 * const [sort, setSort] = usePersistedState<FeedSortType>('feed-sort', 'new');
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Estado interno - inicializa com valor inicial
  const [state, setState] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidratar do sessionStorage no mount (client-side only)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        setState(parsed);
      }
    } catch {
      // Silenciosamente ignorar erros (SSR, JSON inválido, etc.)
    }
    setIsHydrated(true);
  }, [key]);

  // Persistir mudanças no sessionStorage
  useEffect(() => {
    // Só persistir após hidratação para evitar sobrescrever com valor inicial
    if (!isHydrated) return;

    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Silenciosamente ignorar erros (quota exceeded, etc.)
    }
  }, [key, state, isHydrated]);

  // Wrapper do setState que funciona igual ao useState
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  return [state, setValue];
}
