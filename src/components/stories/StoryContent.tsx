'use client';

import Image from 'next/image';
import { useState } from 'react';

interface StoryContentProps {
  mediaUrl: string[];
  mediaType: 'image' | 'carousel';
  caption?: string | null;
  currentImageIndex?: number;
}

export function StoryContent({
  mediaUrl,
  caption,
  currentImageIndex = 0,
}: StoryContentProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const currentImage = mediaUrl[currentImageIndex] || mediaUrl[0];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Imagem principal */}
      <div className="relative w-full h-full max-w-md mx-auto">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={currentImage}
          alt="Story"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 500px"
          className={`object-contain transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Caption overlay no rodapé */}
      {caption && (
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 max-w-md mx-auto">
            <p className="text-white text-sm text-center">{caption}</p>
          </div>
        </div>
      )}

      {/* Indicador de carrossel */}
      {mediaUrl.length > 1 && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1">
          {mediaUrl.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
