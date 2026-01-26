'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { likePost, likePostWithLevel } from '@/actions/posts';
import { useHeartsToast } from '@/components/ui/HeartsToast';
import { LOVE_LEVELS, type LoveLevel } from '@/lib/love-levels';

interface TeAmoButtonProps {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  initialLoveLevel?: number | null;
  userCoins?: number;
  compact?: boolean;
  onDoubleTap?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  emoji: string;
}

export function TeAmoButton({
  postId,
  initialCount,
  initialLiked,
  initialLoveLevel = null,
  userCoins = 0,
  compact = false,
  onDoubleTap,
}: TeAmoButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loveLevel, setLoveLevel] = useState<number | null>(initialLoveLevel);
  const [isPending, startTransition] = useTransition();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  
  const particleIdRef = useRef(0);
  const lastTapRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Toast de corações
  const { showHearts } = useHeartsToast();

  // Obter emoji do nível atual
  const currentLevel = LOVE_LEVELS.find(l => l.id === loveLevel) || LOVE_LEVELS[1];
  const currentEmoji = liked ? currentLevel.emoji : '🤍';

  // Criar partículas de explosão
  const createParticles = useCallback((emoji: string = '❤️', numParticles: number = 8) => {
    const newParticles: Particle[] = [];
    
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
        emoji,
      });
    }
    
    setParticles(newParticles);
    setShowRipple(true);
    setIsAnimating(true);
    
    setTimeout(() => {
      setParticles([]);
      setShowRipple(false);
      setIsAnimating(false);
    }, 800);
  }, []);

  // Like simples (nível 2 - Te Amo)
  const handleSimpleLike = useCallback(() => {
    const newLiked = !liked;
    
    setLiked(newLiked);
    setCount(prev => newLiked ? prev + 1 : prev - 1);
    if (newLiked) {
      setLoveLevel(2);
      createParticles('❤️');
    } else {
      setLoveLevel(null);
    }

    startTransition(async () => {
      const result = await likePost(postId);
      if (!result.success) {
        setLiked(!newLiked);
        setCount(prev => newLiked ? prev - 1 : prev + 1);
        setLoveLevel(initialLoveLevel);
      } else if (newLiked && result.hearts) {
        showHearts(result.hearts, 'Te Amo!');
      }
    });
  }, [liked, postId, createParticles, initialLoveLevel, showHearts]);

  // Like com nível específico
  const handleLevelLike = useCallback((level: LoveLevel) => {
    setShowLevelSelector(false);
    
    // Se já está no mesmo nível ou maior, ignora
    if (loveLevel && level.id <= loveLevel) return;

    const wasLiked = liked;
    setLiked(true);
    setLoveLevel(level.id);
    if (!wasLiked) {
      setCount(prev => prev + 1);
    }
    
    // Mais partículas para níveis maiores
    const numParticles = Math.min(level.id * 4, 20);
    createParticles(level.emoji, numParticles);

    startTransition(async () => {
      const result = await likePostWithLevel(postId, level.id);
      if (!result.success) {
        setLiked(wasLiked);
        setLoveLevel(initialLoveLevel);
        if (!wasLiked) {
          setCount(prev => prev - 1);
        }
      } else if (result.hearts) {
        showHearts(result.hearts, level.name + '!');
      }
    });
  }, [liked, loveLevel, postId, createParticles, initialLoveLevel, showHearts]);

  // Long press para mostrar seletor
  const handlePressStart = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      setShowLevelSelector(true);
    }, 500);
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Tap detection
  const handleTap = useCallback(() => {
    if (showLevelSelector) {
      setShowLevelSelector(false);
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300) {
      if (!liked) {
        handleSimpleLike();
      } else {
        createParticles(currentEmoji);
      }
      onDoubleTap?.();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) {
          handleSimpleLike();
        }
      }, 300);
    }
  }, [liked, handleSimpleLike, createParticles, currentEmoji, onDoubleTap, showLevelSelector]);

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Ripple/Glow effect */}
      {showRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={cn(
            "absolute w-16 h-16 rounded-full animate-ripple",
            loveLevel && loveLevel >= 3 ? 'bg-orange-500/30' : 'bg-pink-500/30'
          )} />
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
            {particle.emoji}
          </span>
        ))}
      </div>

      {/* Seletor de níveis de amor */}
      {showLevelSelector && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 min-w-[200px] animate-scale-in">
          <div className="text-xs text-gray-500 mb-2 px-2">Escolha seu amor:</div>
          <div className="space-y-1">
            {LOVE_LEVELS.map((level) => {
              const canAfford = userCoins >= level.cost || level.cost === 0;
              const isCurrentOrLower = loveLevel && level.id <= loveLevel;
              const disabled = !canAfford || !!isCurrentOrLower;

              return (
                <button
                  key={level.id}
                  onClick={() => !disabled && handleLevelLike(level)}
                  disabled={disabled}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all',
                    disabled 
                      ? 'opacity-40 cursor-not-allowed bg-gray-50' 
                      : 'hover:bg-pink-50 active:scale-95',
                    isCurrentOrLower && 'bg-pink-100'
                  )}
                >
                  <span className="text-xl">{level.emoji}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{level.name}</div>
                    {level.cost > 0 && (
                      <div className="text-xs text-gray-500">-{level.cost} ❤️</div>
                    )}
                  </div>
                  {level.reward > 1 && (
                    <div className="text-xs text-green-600 font-medium">
                      +{level.reward}❤️
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-gray-400 mt-2 px-2">
            Você tem: {userCoins} ❤️
          </div>
        </div>
      )}

      {/* Botão Te Amo */}
      <button
        onClick={handleTap}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        disabled={isPending}
        className={cn(
          'relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200',
          'select-none touch-manipulation active:scale-95',
          liked
            ? loveLevel && loveLevel >= 4
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : loveLevel && loveLevel >= 3
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/30'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          isPending && 'opacity-70'
        )}
      >
        <span 
          className={cn(
            'text-xl transition-transform',
            isAnimating && liked && 'animate-heart-pop',
            loveLevel && loveLevel >= 4 && 'animate-pulse'
          )}
        >
          {currentEmoji}
        </span>
        
        {!compact && (
          <span className="font-semibold">
            {liked ? (currentLevel.name === 'Curti' ? 'Te Amo!' : currentLevel.name) : 'Te Amo'}
          </span>
        )}
      </button>

      {/* Contador com animação */}
      <span className={cn(
        'text-sm font-medium transition-all duration-300',
        liked 
          ? loveLevel && loveLevel >= 3 ? 'text-orange-600' : 'text-pink-600'
          : 'text-gray-500',
        isAnimating && 'animate-count-pop'
      )}>
        {count > 0 && (
          <>
            {count} {count === 1 ? 'Te Amo' : 'Te Amos'}
          </>
        )}
      </span>

      {/* Dica de long press */}
      {!liked && !showLevelSelector && (
        <span className="text-xs text-gray-400 hidden sm:inline">
          segure para +
        </span>
      )}

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
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
        
        @keyframes count-pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-count-pop {
          animation: count-pop 0.3s ease-out;
        }

        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * Componente de coração explodindo para double-tap em imagens
 */
export function ExplodingHeart({ show, emoji = '❤️‍🔥' }: { show: boolean; emoji?: string }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <span className="text-8xl animate-explode-heart drop-shadow-2xl">{emoji}</span>
      
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
            {emoji}
          </span>
        );
      })}
      
      <div className="absolute w-32 h-32 rounded-full bg-pink-500/40 animate-glow-pulse" />
      
      <style jsx>{`
        @keyframes explode-heart {
          0% { opacity: 0; transform: scale(0) rotate(-15deg); }
          20% { opacity: 1; transform: scale(1.3) rotate(5deg); }
          35% { transform: scale(0.95) rotate(-3deg); }
          50% { transform: scale(1.1) rotate(2deg); }
          65% { opacity: 1; transform: scale(1) rotate(0deg); }
          100% { opacity: 0; transform: scale(1.2) rotate(0deg); }
        }
        .animate-explode-heart {
          animation: explode-heart 1s cubic-bezier(0.17, 0.89, 0.32, 1.28) forwards;
        }
        
        @keyframes mini-heart {
          0% { opacity: 0; transform: translate(0, 0) scale(0); }
          30% { opacity: 1; transform: translate(calc(var(--tx) * 0.5), calc(var(--ty) * 0.5)) scale(1.2); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
        }
        .animate-mini-heart {
          animation: mini-heart 0.8s ease-out forwards;
        }
        
        @keyframes glow-pulse {
          0% { transform: scale(0); opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { transform: scale(3); opacity: 0; }
        }
        .animate-glow-pulse {
          animation: glow-pulse 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
