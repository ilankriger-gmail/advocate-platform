'use client';

import { useState, useTransition } from 'react';
import { sharePost } from '@/actions/saves';

interface ShareButtonProps {
  postId: string;
  postTitle?: string;
  size?: 'sm' | 'md';
}

export function ShareButton({ postId, postTitle, size = 'md' }: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${postId}`;
    const title = postTitle || 'Confira este post';

    // Tentar usar Web Share API (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        startTransition(async () => {
          await sharePost(postId, 'native');
        });
        return;
      } catch (err) {
        // Usuário cancelou ou erro - fallback para copiar
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: copiar link para clipboard
    try {
      await navigator.clipboard.writeText(url);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);

      startTransition(async () => {
        await sharePost(postId, 'copy_link');
      });
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const buttonSize = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        disabled={isPending}
        className={`${buttonSize} rounded-lg transition-all hover:bg-gray-100 text-gray-400 hover:text-blue-600 ${
          isPending ? 'opacity-50' : ''
        }`}
        title="Compartilhar"
        aria-label="Compartilhar post"
      >
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>

      {/* Toast de confirmação */}
      {showToast && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg animate-fade-in">
          Link copiado!
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
