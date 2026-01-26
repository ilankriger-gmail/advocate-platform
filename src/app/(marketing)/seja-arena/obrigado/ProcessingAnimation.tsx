'use client';

import { useState, useEffect } from 'react';

const FUNNY_WORDS = [
  'Preparando seus corações ❤️...',
  'Contando quanto amor você merece...',
  'Consultando o Moço do Te Amo...',
  'Calculando corações infinitos...',
  'Espalhando amor pelo servidor...',
  'Fazendo mágica com ❤️...',
  'Aquecendo os corações...',
  'Conectando com a comunidade...',
  'Carregando muito amor...',
  'Processando a 300 corações/s...',
  'Invocando os algoritmos do amor...',
  'Organizando seus ❤️...',
  'Alinhando os chakras do te amo...',
  'Perguntando pro universo...',
  'Desbloqueando conquistas ❤️...',
];

export function ProcessingAnimation() {
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % FUNNY_WORDS.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      {/* Spinner animado */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        {/* Círculo externo girando */}
        <div className="absolute inset-0 border-4 border-primary-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-primary-600 rounded-full animate-spin" />

        {/* Ícone central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-primary-500 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      </div>

      {/* Texto engraçado com transição */}
      <div className="h-8 overflow-hidden">
        <p
          key={currentWord}
          className="text-lg text-gray-600 animate-fade-in"
        >
          {FUNNY_WORDS[currentWord]}
        </p>
      </div>

      {/* Dots animados */}
      <div className="flex justify-center gap-1 mt-4">
        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
