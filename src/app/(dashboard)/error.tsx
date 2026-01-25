'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md p-6">
        {/* Emoji */}
        <div className="text-6xl mb-4">😅</div>
        
        {/* Título */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Algo deu errado
        </h2>
        
        {/* Descrição */}
        <p className="text-gray-600 text-sm mb-6">
          Não foi possível carregar esta página. Tente novamente.
        </p>
        
        {/* Código do erro */}
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">
            Código: {error.digest}
          </p>
        )}
        
        {/* Botão */}
        <Button onClick={reset}>
          🔄 Tentar novamente
        </Button>
      </div>
    </div>
  );
}
