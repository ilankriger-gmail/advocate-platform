'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Emoji grande */}
        <div className="text-8xl mb-6">😅</div>
        
        {/* Título */}
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Algo deu errado
        </h1>
        
        {/* Descrição */}
        <p className="text-gray-600 mb-8">
          Aconteceu um erro inesperado. Nossa equipe já foi notificada 
          e estamos trabalhando para resolver!
        </p>
        
        {/* Código do erro (se disponível) */}
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">
            Código: {error.digest}
          </p>
        )}
        
        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-red-600 transition-all shadow-lg shadow-pink-500/25"
          >
            🔄 Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
          >
            🏠 Ir para o início
          </a>
        </div>
      </div>
    </div>
  );
}
