'use client';

import { useState } from 'react';

interface RewardImageZoomProps {
  imageUrl: string | null;
  altText: string;
  isMoney?: boolean;
}

/**
 * Componente que exibe imagem do prêmio com opção de zoom
 * Ao clicar, abre modal com imagem em tamanho maior
 */
export function RewardImageZoom({ imageUrl, altText, isMoney = false }: RewardImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Se não tem imagem, mostra placeholder sem zoom
  if (!imageUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-5xl ${isMoney ? '' : 'bg-gradient-to-br from-purple-100 to-pink-100'}`}>
        {isMoney ? '💰' : '🎁'}
      </div>
    );
  }

  return (
    <>
      {/* Imagem clicável com indicador de zoom */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full h-full relative group cursor-zoom-in"
        aria-label={`Ver ${altText} em tamanho maior`}
      >
        <img
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-cover"
        />
        {/* Overlay com ícone de lupa */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Modal de zoom */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setIsOpen(false)}
        >
          {/* Botão fechar */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Imagem ampliada */}
          <img
            src={imageUrl}
            alt={altText}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
