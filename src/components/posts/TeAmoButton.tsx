'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { likePost } from '@/actions/posts';

interface TeAmoButtonProps {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  compact?: boolean;
  onDoubleTap?: () => void; // Para animação de coração na imagem
}

// Corações flutuantes para a chuva de amor
interface FloatingHeart {
  id: number;
  x: number;
  delay: number;
}

export function TeAmoButton({
  postId,
  initialCount,
  initialLiked,
  compact = false,
  onDoubleTap,
}: TeAmoButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [isHolding, setIsHolding] = useState(false);
  const [holdCount, setHoldCount] = useState(0);
  
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartIdRef = useRef(0);
  const lastTapRef = useRef(0);

  // Adicionar coração flutuante
  const addFloatingHeart = useCallback(() => {
    const newHeart: FloatingHeart = {
      id: heartIdRef.current++,
      x: Math.random() * 60 - 30, // -30 a +30px do centro
      delay: Math.random() * 0.2,
    };
    setFloatingHearts(prev => [...prev, newHeart]);
    
    // Remover após animação
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1500);
  }, []);

  // Toggle like simples
  const handleLike = useCallback(() => {
    const newLiked = !liked;
    
    // Optimistic update
    setLiked(newLiked);
    setCount(prev => newLiked ? prev + 1 : prev - 1);
    
    if (newLiked) {
      addFloatingHeart();
    }

    startTransition(async () => {
      const result = await likePost(postId);
      if (!result.success) {
        // Rollback
        setLiked(!newLiked);
        setCount(prev => newLiked ? prev - 1 : prev + 1);
      }
    });
  }, [liked, postId, addFloatingHeart]);

  // Double tap detection
  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300) {
      // Double tap!
      if (!liked) {
        handleLike();
      } else {
        addFloatingHeart();
      }
      onDoubleTap?.();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single tap após delay
      setTimeout(() => {
        if (lastTapRef.current === now) {
          handleLike();
        }
      }, 300);
    }
  }, [liked, handleLike, addFloatingHeart, onDoubleTap]);

  // Iniciar chuva de amor (hold)
  const startHold = useCallback(() => {
    if (!liked) {
      handleLike();
    }
    
    setIsHolding(true);
    setHoldCount(1);
    addFloatingHeart();

    // Após 500ms, começar a adicionar corações extras
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        setHoldCount(prev => {
          if (prev >= 10) {
            // Máximo de 10 corações
            stopHold();
            return prev;
          }
          addFloatingHeart();
          return prev + 1;
        });
      }, 150); // Um coração a cada 150ms
    }, 500);
  }, [liked, handleLike, addFloatingHeart]);

  // Parar chuva de amor
  const stopHold = useCallback(() => {
    setIsHolding(false);
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }

    // Enviar corações extras para o servidor (se holdCount > 1)
    // Por enquanto, só a animação - implementar depois
    setHoldCount(0);
  }, []);

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Corações flutuantes */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {floatingHearts.map(heart => (
          <span
            key={heart.id}
            className="absolute text-2xl animate-float-up"
            style={{
              left: `calc(50% + ${heart.x}px)`,
              bottom: '100%',
              animationDelay: `${heart.delay}s`,
            }}
          >
            ❤️‍🔥
          </span>
        ))}
      </div>

      {/* Botão Te Amo */}
      <button
        onClick={handleTap}
        onMouseDown={startHold}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={startHold}
        onTouchEnd={stopHold}
        disabled={isPending}
        className={cn(
          'relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200',
          'select-none touch-manipulation',
          liked
            ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/30'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          isHolding && 'scale-110',
          isPending && 'opacity-70'
        )}
      >
        <span 
          className={cn(
            'text-xl transition-transform duration-200',
            liked && 'animate-heartbeat',
            isHolding && 'scale-125'
          )}
        >
          {liked ? '❤️‍🔥' : '🤍'}
        </span>
        
        {!compact && (
          <span className="font-semibold">
            {liked ? 'Te Amo!' : 'Te Amo'}
          </span>
        )}
      </button>

      {/* Contador */}
      <span className={cn(
        'text-sm font-medium',
        liked ? 'text-pink-600' : 'text-gray-500'
      )}>
        {count > 0 && (
          <>
            {count} {count === 1 ? 'Te Amo' : 'Te Amos'}
          </>
        )}
      </span>

      {/* Indicador de chuva de amor */}
      {isHolding && holdCount > 1 && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
          +{holdCount} ❤️‍🔥
        </span>
      )}

      {/* Estilos de animação */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(1.5);
          }
        }
        .animate-float-up {
          animation: float-up 1.2s ease-out forwards;
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(1); }
          75% { transform: scale(1.1); }
        }
        .animate-heartbeat {
          animation: heartbeat 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}

/**
 * Componente de coração explodindo para double-tap em imagens
 */
export function ExplodingHeart({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <span className="text-8xl animate-explode-heart">❤️‍🔥</span>
      <style jsx>{`
        @keyframes explode-heart {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          15% {
            opacity: 1;
            transform: scale(1.4);
          }
          30% {
            transform: scale(1.2);
          }
          80% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }
        .animate-explode-heart {
          animation: explode-heart 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
