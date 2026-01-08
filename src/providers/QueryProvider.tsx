'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados ficam fresh por 1 minuto
            staleTime: 60 * 1000,
            // Cache por 5 minutos
            gcTime: 5 * 60 * 1000,
            // Retry automático em caso de erro
            retry: 1,
            // Refetch ao focar na janela
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
