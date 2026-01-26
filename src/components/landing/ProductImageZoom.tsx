'use client';

import { useState } from 'react';
import Image from 'next/image';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { ZoomIn } from 'lucide-react';

interface ProductImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImageZoom({ src, alt, className = '' }: ProductImageZoomProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative group ${className}`}>
      <Zoom
        zoomMargin={40}
        classDialog="custom-zoom-dialog"
      >
        <div className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-lg cursor-zoom-in">
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
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
              <ZoomIn className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        </div>
      </Zoom>
      <p className="text-center text-xs text-gray-400 mt-2">
        Clique na imagem para ampliar
      </p>
    </div>
  );
}
