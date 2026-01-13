'use client';

import { useState, useEffect, useRef } from 'react';
import { StoryAvatar } from './StoryAvatar';
import { StoryViewer } from './StoryViewer';
import { CreateStoryModal } from './CreateStoryModal';
import { getStoriesForBar, canCreateStory } from '@/actions/stories';
import type { CreatorStories } from '@/types/story';
import { Skeleton } from '@/components/ui';

export function StoriesBar() {
  const [creators, setCreators] = useState<CreatorStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedCreatorIndex, setSelectedCreatorIndex] = useState(0);
  const [canCreate, setCanCreate] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carregar stories
  useEffect(() => {
    async function loadStories() {
      setLoading(true);
      try {
        const [storiesResult, canCreateResult] = await Promise.all([
          getStoriesForBar(),
          canCreateStory(),
        ]);

        if (storiesResult.data) {
          setCreators(storiesResult.data);
        }
        if (canCreateResult.data) {
          setCanCreate(canCreateResult.data);
        }
      } catch (error) {
        console.error('Erro ao carregar stories:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStories();
  }, []);

  // Abrir viewer
  const handleOpenViewer = (index: number) => {
    setSelectedCreatorIndex(index);
    setViewerOpen(true);
  };

  // Fechar viewer e recarregar stories
  const handleCloseViewer = async () => {
    setViewerOpen(false);
    // Recarregar para atualizar status de visualização
    const result = await getStoriesForBar();
    if (result.data) {
      setCreators(result.data);
    }
  };

  // Callback após criar story
  const handleStoryCreated = async () => {
    setCreateModalOpen(false);
    const result = await getStoriesForBar();
    if (result.data) {
      setCreators(result.data);
    }
  };

  // Não mostrar nada se não houver stories e usuário não pode criar
  if (!loading && creators.length === 0 && !canCreate) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-[500px] mx-auto">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            // Skeleton loading
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="w-12 h-3 rounded" />
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Botão de criar story (se permitido) */}
              {canCreate && (
                <div className="shrink-0">
                  <StoryAvatar
                    name="Criar"
                    hasUnviewed={false}
                    isAddButton
                    onClick={() => setCreateModalOpen(true)}
                  />
                </div>
              )}

              {/* Lista de criadores com stories */}
              {creators.map((creator, index) => (
                <div key={creator.creator.id} className="shrink-0">
                  <StoryAvatar
                    src={creator.creator.avatar_url}
                    name={creator.creator.full_name || 'Criador'}
                    hasUnviewed={creator.hasUnviewed}
                    onClick={() => handleOpenViewer(index)}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Viewer fullscreen */}
      {viewerOpen && creators.length > 0 && (
        <StoryViewer
          creators={creators}
          initialCreatorIndex={selectedCreatorIndex}
          onClose={handleCloseViewer}
        />
      )}

      {/* Modal de criação */}
      {createModalOpen && (
        <CreateStoryModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleStoryCreated}
        />
      )}
    </>
  );
}

// Skeleton para uso em Suspense
export function StoriesBarSkeleton() {
  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="flex gap-3 overflow-x-auto py-2 px-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-12 h-3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
