'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { likePost } from '@/actions/posts';
import { useHeartsToast } from '@/components/ui/HeartsToast';

interface TeAmoButtonProps {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  compact?: boolean;
  onDoubleTap?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  
  const particleIdRef = useRef(0);
  const lastTapRef = useRef(0);
  
  // Toast de corações
  const { showHearts } = useHeartsToast();

  // Criar partículas de explosão
  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const numParticles = 8;
    
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * 360;
      const distance = 40 + Math.random() * 30;
      const radian = (angle * Math.PI) / 180;
      
      newParticles.push({
        id: particleIdRef.current++,
        x: Math.cos(radian) * distance,
        y: Math.sin(radian) * distance,
        scale: 0.5 + Math.random() * 0.5,
        rotation: Math.random() * 360,
      });
    }
    
    setParticles(newParticles);
    setShowRipple(true);
    setIsAnimating(true);
    
    // Limpar após animação
    setTimeout(() => {
      setParticles([]);
      setShowRipple(false);
      setIsAnimating(false);
    }, 800);
  }, []);

  // Toggle like
  const handleLike = useCallback(() => {
    const newLiked = !liked;
    
    setLiked(newLiked);
    setCount(prev => newLiked ? prev + 1 : prev - 1);
    
    if (newLiked) {
      createParticles();
    }

    startTransition(async () => {
      const result = await likePost(postId);
      if (!result.success) {
        setLiked(!newLiked);
        setCount(prev => newLiked ? prev - 1 : prev + 1);
      } else if (newLiked && result.hearts) {
        // Mostrar toast de corações ganhos
        showHearts(result.hearts, 'Te Amo!');
      }
    });
  }, [liked, postId, createParticles]);

  // Double tap detection
  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300) {
      if (!liked) {
        handleLike();
      } else {
        createParticles();
      }
      onDoubleTap?.();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) {
          handleLike();
        }
      }, 300);
    }
  }, [liked, handleLike, createParticles, onDoubleTap]);

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Ripple/Glow effect */}
      {showRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-16 h-16 rounded-full bg-pink-500/30 animate-ripple" />
          <div className="absolute w-16 h-16 rounded-full bg-red-500/20 animate-ripple-delayed" />
        </div>
      )}

      {/* Partículas explosivas */}
      <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
        {particles.map(particle => (
          <span
            key={particle.id}
            className="absolute text-lg animate-particle"
            style={{
              '--tx': `${particle.x}px`,
              '--ty': `${particle.y}px`,
              '--scale': particle.scale,
              '--rotation': `${particle.rotation}deg`,
            } as React.CSSProperties}
          >
            ❤️
          </span>
        ))}
      </div>

      {/* Botão Te Amo */}
      <button
        onClick={handleTap}
        disabled={isPending}
        className={cn(
          'relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200',
          'select-none touch-manipulation active:scale-95',
          liked
            ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/30'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          isPending && 'opacity-70'
        )}
      >
        <span 
          className={cn(
            'text-xl transition-transform',
            isAnimating && liked && 'animate-heart-pop'
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

      {/* Contador com animação */}
      <span className={cn(
        'text-sm font-medium transition-all duration-300',
        liked ? 'text-pink-600' : 'text-gray-500',
        isAnimating && 'animate-count-pop'
      )}>
        {count > 0 && (
          <>
            {count} {count === 1 ? 'Te Amo' : 'Te Amos'}
          </>
        )}
      </span>

      {/* Estilos de animação */}
      <style jsx>{`
        @keyframes heart-pop {
          0% { transform: scale(1); }
          15% { transform: scale(1.4); }
          30% { transform: scale(0.9); }
          45% { transform: scale(1.2); }
          60% { transform: scale(0.95); }
          75% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-heart-pop {
          animation: heart-pop 0.6s cubic-bezier(0.17, 0.89, 0.32, 1.49);
        }
        
        @keyframes particle {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(0) rotate(0deg);
          }
          20% {
            opacity: 1;
            transform: translate(calc(var(--tx) * 0.3), calc(var(--ty) * 0.3)) scale(var(--scale)) rotate(calc(var(--rotation) * 0.3));
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0) rotate(var(--rotation));
          }
        }
        .animate-particle {
          animation: particle 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
        .animate-ripple-delayed {
          animation: ripple 0.6s ease-out 0.1s forwards;
        }
        
        @keyframes count-pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-count-pop {
          animation: count-pop 0.3s ease-out;
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
      {/* Coração central */}
      <span className="text-8xl animate-explode-heart drop-shadow-2xl">❤️‍🔥</span>
      
      {/* Mini corações ao redor */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * 360;
        const radian = (angle * Math.PI) / 180;
        const distance = 80;
        return (
          <span
            key={i}
            className="absolute text-2xl animate-mini-heart"
            style={{
              '--tx': `${Math.cos(radian) * distance}px`,
              '--ty': `${Math.sin(radian) * distance}px`,
              animationDelay: `${i * 0.05}s`,
            } as React.CSSProperties}
          >
            ❤️
          </span>
        );
      })}
      
      {/* Brilho */}
      <div className="absolute w-32 h-32 rounded-full bg-pink-500/40 animate-glow-pulse" />
      
      <style jsx>{`
        @keyframes explode-heart {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-15deg);
          }
          20% {
            opacity: 1;
            transform: scale(1.3) rotate(5deg);
          }
          35% {
            transform: scale(0.95) rotate(-3deg);
          }
          50% {
            transform: scale(1.1) rotate(2deg);
          }
          65% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: scale(1.2) rotate(0deg);
          }
        }
        .animate-explode-heart {
          animation: explode-heart 1s cubic-bezier(0.17, 0.89, 0.32, 1.28) forwards;
        }
        
        @keyframes mini-heart {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0);
          }
          30% {
            opacity: 1;
            transform: translate(calc(var(--tx) * 0.5), calc(var(--ty) * 0.5)) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0);
          }
        }
        .animate-mini-heart {
          animation: mini-heart 0.8s ease-out forwards;
        }
        
        @keyframes glow-pulse {
          0% {
            transform: scale(0);
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        .animate-glow-pulse {
          animation: glow-pulse 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
