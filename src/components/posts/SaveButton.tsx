'use client';

import { useState, useTransition } from 'react';
import { toggleSavePost } from '@/actions/saves';

interface SaveButtonProps {
  postId: string;
  initialSaved?: boolean;
  size?: 'sm' | 'md';
}

export function SaveButton({ postId, initialSaved = false, size = 'md' }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const handleToggleSave = () => {
    // Optimistic update
    setIsSaved(!isSaved);

    startTransition(async () => {
      const result = await toggleSavePost(postId);

      if (!result.success) {
        // Reverter se falhou
        setIsSaved(isSaved);
      } else {
        setIsSaved(result.saved ?? !isSaved);
      }
    });
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const buttonSize = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <button
      type="button"
      onClick={handleToggleSave}
      disabled={isPending}
      className={`${buttonSize} rounded-lg transition-all hover:bg-gray-100 ${
        isSaved
          ? 'text-purple-600'
          : 'text-gray-400 hover:text-purple-600'
      } ${isPending ? 'opacity-50' : ''}`}
      title={isSaved ? 'Remover dos salvos' : 'Salvar post'}
      aria-label={isSaved ? 'Remover dos salvos' : 'Salvar post'}
    >
      {isSaved ? (
        // Ícone preenchido (salvo)
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ) : (
        // Ícone outline (não salvo)
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      )}
    </button>
  );
}
