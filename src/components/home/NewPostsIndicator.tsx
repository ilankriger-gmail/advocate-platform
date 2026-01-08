'use client';

interface NewPostsIndicatorProps {
  count: number;
  onClick: () => void;
}

/**
 * Banner que aparece quando há novos posts disponíveis
 * Ao clicar, rola para o topo e recarrega o feed
 */
export function NewPostsIndicator({ count, onClick }: NewPostsIndicatorProps) {
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-full shadow-lg hover:bg-purple-700 transition-all animate-bounce-slow flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
      {count === 1 ? '1 novo post' : `${count} novos posts`}
    </button>
  );
}
