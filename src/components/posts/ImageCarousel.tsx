'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  aspectRatio?: 'square' | 'vídeo' | 'portrait' | 'auto';
}

// Distancia minima em pixels para considerar um swipe
const MIN_SWIPE_DISTANCE = 50;

export default function ImageCarousel({
  images,
  alt = 'Imagem do post',
  aspectRatio = 'auto',
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Touch handlers para swipe em mobile
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  }, [touchStart, touchEnd, goToNext, goToPrev]);

  if (images.length === 0) return null;

  // Se for apenas uma imagem, exibir sem controles de carrossel
  if (images.length === 1) {
    return (
      <div className={`relative w-full overflow-hidden rounded-lg bg-gray-100 ${
        aspectRatio === 'square' ? 'aspect-square' :
        aspectRatio === 'vídeo' ? 'aspect-vídeo' :
        aspectRatio === 'portrait' ? 'aspect-[4/5]' :
        'aspect-auto'
      }`}>
        <Image
          src={images[0]}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Container da imagem com suporte a swipe */}
      <div
        className={`relative w-full overflow-hidden rounded-lg bg-gray-100 ${
          aspectRatio === 'square' ? 'aspect-square' :
          aspectRatio === 'vídeo' ? 'aspect-vídeo' :
          aspectRatio === 'portrait' ? 'aspect-[4/5]' :
          'aspect-auto min-h-[200px]'
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={images[currentIndex]}
          alt={`${alt} - ${currentIndex + 1} de ${images.length}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={currentIndex === 0}
        />

        {/* Setas de navegação */}
        <button
          type="button"
          onClick={goToPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          aria-label="Imagem anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          aria-label="Próxima imagem"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Contador */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Indicadores (dots) */}
      <div className="flex justify-center gap-1.5 mt-2">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goToIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex
                ? 'bg-purple-600'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Ir para imagem ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
