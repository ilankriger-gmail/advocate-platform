'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import YouTubeEmbed from '@/components/posts/YouTubeEmbed';
import InstagramEmbed from '@/components/posts/InstagramEmbed';
import { RichTextDisplay } from '@/components/editor/RichTextEditor';
import { LinkedContentCard } from './LinkedContentCard';
import type { StoryMediaType, LinkedContentType } from '@/types/story';

interface StoryContentProps {
  mediaUrl: string[];
  mediaType: StoryMediaType;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  title?: string | null;
  content?: string | null;
  caption?: string | null;
  linkedContentType?: LinkedContentType | null;
  linkedContentId?: string | null;
  linkedContentTitle?: string;
  linkedContentImage?: string | null;
  linkedContentSubtitle?: string;
  currentImageIndex?: number;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
}

export function StoryContent({
  mediaUrl,
  mediaType,
  youtubeUrl,
  instagramUrl,
  title,
  content,
  caption,
  linkedContentType,
  linkedContentId,
  linkedContentTitle,
  linkedContentImage,
  linkedContentSubtitle,
  currentImageIndex = 0,
  onPauseTimer,
  onResumeTimer,
}: StoryContentProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const currentImage = mediaUrl[currentImageIndex] || mediaUrl[0];

  // Resetar estado quando muda de story
  useEffect(() => {
    setImageLoaded(false);
    setShowContent(false);
  }, [currentImage, youtubeUrl, instagramUrl]);

  // Função para alternar exibição do conteúdo rico
  const toggleContent = () => {
    const willShow = !showContent;
    setShowContent(willShow);
    // Pausar timer enquanto o conteúdo está visível
    if (willShow) {
      onPauseTimer?.();
    } else {
      onResumeTimer?.();
    }
  };

  // Verificar se tem conteúdo rico para exibir
  const hasRichContent = title || (content && content.trim() !== '' && content !== '<p></p>');

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Conteúdo principal baseado no tipo de mídia */}
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col">

        {/* Área de mídia */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Imagem/Carrossel */}
          {(mediaType === 'image' || mediaType === 'carousel') && currentImage && (
            <>
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
            </>
          )}

          {/* YouTube */}
          {mediaType === 'youtube' && youtubeUrl && (
            <div className="w-full px-4">
              <YouTubeEmbed url={youtubeUrl} title={title || undefined} />
            </div>
          )}

          {/* Instagram */}
          {mediaType === 'instagram' && instagramUrl && (
            <div className="w-full px-4 max-h-[70vh] overflow-y-auto">
              <InstagramEmbed url={instagramUrl} />
            </div>
          )}
        </div>

        {/* Indicador de carrossel */}
        {mediaUrl.length > 1 && (mediaType === 'image' || mediaType === 'carousel') && (
          <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-1.5 z-10">
            {mediaUrl.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Overlay inferior com caption e botão de conteúdo */}
        <div className="absolute bottom-16 left-0 right-0 px-4 z-10 space-y-2">
          {/* Card de conteúdo vinculado */}
          {linkedContentType && linkedContentId && linkedContentTitle && (
            <LinkedContentCard
              type={linkedContentType}
              id={linkedContentId}
              title={linkedContentTitle}
              image={linkedContentImage}
              subtitle={linkedContentSubtitle}
            />
          )}

          {/* Botão para ver conteúdo rico */}
          {hasRichContent && (
            <button
              onClick={toggleContent}
              className="w-full py-2 px-4 bg-white/90 backdrop-blur-sm rounded-lg text-center text-sm font-medium text-gray-900 hover:bg-white transition-colors"
            >
              {showContent ? 'Ocultar detalhes' : 'Ver detalhes'}
            </button>
          )}

          {/* Caption */}
          {caption && !showContent && (
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-white text-sm text-center">{caption}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de conteúdo rico */}
      {showContent && hasRichContent && (
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center p-4"
          onClick={toggleContent}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Título */}
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {title}
              </h3>
            )}

            {/* Conteúdo rico */}
            {content && content.trim() !== '' && content !== '<p></p>' && (
              <div className="prose prose-sm max-w-none">
                <RichTextDisplay content={content} />
              </div>
            )}

            {/* Botão fechar */}
            <button
              onClick={toggleContent}
              className="mt-4 w-full py-2 px-4 bg-gray-100 rounded-lg text-center text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
