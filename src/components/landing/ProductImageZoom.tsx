'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ZoomIn, X } from 'lucide-react';

interface ProductImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImageZoom({ src, alt, className = '' }: ProductImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {/* Main Image */}
      <div 
        className={`relative group cursor-zoom-in ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <div className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className={`object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            priority
            quality={90}
            onLoad={() => setIsLoaded(true)}
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          {/* Zoom hint overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
              <ZoomIn className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          🔍 Clique na imagem para ampliar
        </p>
      </div>

      {/* Fullscreen Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-8 h-8 text-white" />
          </button>

          {/* Zoomed Image */}
          <div 
            className="relative w-full max-w-5xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="w-full h-auto object-contain rounded-lg"
              quality={100}
              priority
            />
          </div>

          {/* Instructions */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            Clique fora da imagem ou no X para fechar
          </p>
        </div>
      )}
    </>
  );
}
