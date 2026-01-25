'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            {/* Emoji grande */}
            <div className="text-8xl mb-6">🚨</div>
            
            {/* Título */}
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Erro crítico
            </h1>
            
            {/* Descrição */}
            <p className="text-gray-600 mb-8">
              Ocorreu um erro grave no sistema. Por favor, 
              tente recarregar a página ou volte mais tarde.
            </p>
            
            {/* Código do erro */}
            {error.digest && (
              <p className="text-xs text-gray-400 mb-6 font-mono">
                Código: {error.digest}
              </p>
            )}
            
            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-red-600 transition-all"
              >
                🔄 Recarregar
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
