'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { StoryProgress } from './StoryProgress';
import { StoryContent } from './StoryContent';
import { Avatar } from '@/components/ui';
import { markStoryAsViewed } from '@/actions/stories';
import type { CreatorStories } from '@/types/story';
import { formatRelativeTime } from '@/lib/utils';

interface StoryViewerProps {
  creators: CreatorStories[];
  initialCreatorIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 segundos por story
const PROGRESS_INTERVAL = 50; // Atualizar progresso a cada 50ms

export function StoryViewer({
  creators,
  initialCreatorIndex,
  onClose,
}: StoryViewerProps) {
  const [creatorIndex, setCreatorIndex] = useState(initialCreatorIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCreator = creators[creatorIndex];
  const currentStory = currentCreator?.stories[storyIndex];

  // Marcar story como visualizado
  const markViewed = useCallback(async (storyId: string) => {
    await markStoryAsViewed(storyId);
  }, []);

  // Ir para o próximo story
  const goNext = useCallback(() => {
    const currentCreatorData = creators[creatorIndex];
    if (!currentCreatorData) {
      onClose();
      return;
    }

    // Se há mais stories do criador atual
    if (storyIndex < currentCreatorData.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    }
    // Se há mais criadores
    else if (creatorIndex < creators.length - 1) {
      setCreatorIndex((prev) => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    }
    // Fim dos stories
    else {
      onClose();
    }
  }, [creatorIndex, storyIndex, creators, onClose]);

  // Ir para o story anterior
  const goPrevious = useCallback(() => {
    // Se há stories anteriores do criador atual
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
    }
    // Se há criadores anteriores
    else if (creatorIndex > 0) {
      const prevCreator = creators[creatorIndex - 1];
      setCreatorIndex((prev) => prev - 1);
      setStoryIndex(prevCreator.stories.length - 1);
      setProgress(0);
    }
    // Já está no início, apenas reiniciar o progresso
    else {
      setProgress(0);
    }
  }, [creatorIndex, storyIndex, creators]);

  // Timer do progresso
  useEffect(() => {
    if (isPaused || !currentStory) return;

    const startTime = Date.now() - (progress / 100) * STORY_DURATION;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);

      if (newProgress >= 100) {
        goNext();
      } else {
        setProgress(newProgress);
        progressRef.current = requestAnimationFrame(updateProgress);
      }
    };

    progressRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (progressRef.current) {
        cancelAnimationFrame(progressRef.current);
      }
    };
  }, [isPaused, currentStory, goNext, progress]);

  // Marcar como visualizado quando o story mudar
  useEffect(() => {
    if (currentStory) {
      markViewed(currentStory.id);
    }
  }, [currentStory, markViewed]);

  // Handlers de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goPrevious();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrevious, onClose]);

  // Handler de clique nas áreas de navegação
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Terço esquerdo = anterior, terço direito = próximo
    if (x < width / 3) {
      goPrevious();
    } else if (x > (width * 2) / 3) {
      goNext();
    }
  };

  // Handler de touch para pausar
  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);
  const handleMouseDown = () => setIsPaused(true);
  const handleMouseUp = () => setIsPaused(false);

  if (!currentCreator || !currentStory) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        {/* Barras de progresso */}
        <StoryProgress
          totalStories={currentCreator.stories.length}
          currentIndex={storyIndex}
          progress={progress}
        />

        {/* Info do criador */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={currentCreator.creator.avatar_url}
              name={currentCreator.creator.full_name || 'Criador'}
              size="sm"
            />
            <div>
              <p className="text-white font-medium text-sm">
                {currentCreator.creator.full_name}
              </p>
              <p className="text-white/60 text-xs">
                {formatRelativeTime(currentStory.created_at)}
              </p>
            </div>
          </div>

          {/* Botão fechar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Conteúdo do story */}
      <StoryContent
        mediaUrl={currentStory.media_url}
        mediaType={currentStory.media_type}
        youtubeUrl={currentStory.youtube_url}
        instagramUrl={currentStory.instagram_url}
        title={currentStory.title}
        content={currentStory.content}
        caption={currentStory.caption}
        onPauseTimer={() => setIsPaused(true)}
        onResumeTimer={() => setIsPaused(false)}
      />

      {/* Botões de navegação (desktop) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          goPrevious();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden md:block"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden md:block"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Indicador de pausa */}
      {isPaused && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
          <p className="text-white text-sm">Pausado</p>
        </div>
      )}
    </div>
  );
}
