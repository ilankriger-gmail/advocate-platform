'use client';

import { useState, useEffect, useRef } from 'react';
import { LOVE_LEVELS, type LoveLevel } from '@/lib/love-levels';
import { cn } from '@/lib/utils';

interface LoveLevelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (level: LoveLevel) => void;
  userCoins: number;
  currentLevel?: number | null;
}

export function LoveLevelSelector({
  isOpen,
  onClose,
  onSelect,
  userCoins,
  currentLevel,
}: LoveLevelSelectorProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 min-w-[280px] animate-scale-in"
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">Escolha seu amor</span>
        <span className="text-xs text-gray-500">Você tem: {userCoins} ❤️</span>
      </div>

      <div className="space-y-2">
        {LOVE_LEVELS.map((level) => {
          const canAfford = userCoins >= level.cost;
          const isCurrentLevel = currentLevel === level.id;
          const isUpgrade = currentLevel && level.id > currentLevel;

          return (
            <button
              key={level.id}
              onClick={() => canAfford && onSelect(level)}
              disabled={!canAfford || (currentLevel != null && level.id <= currentLevel)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                canAfford && !isCurrentLevel
                  ? 'hover:bg-gray-50 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed',
                isCurrentLevel && 'bg-green-50 border-2 border-green-200',
                level.animation
              )}
            >
              <span className="text-3xl">{level.emoji}</span>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={cn('font-semibold', level.color)}>{level.name}</span>
                  {isCurrentLevel && (
                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                      ✓ Dado
                    </span>
                  )}
                  {isUpgrade && canAfford && (
                    <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                      Upgrade
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{level.description}</span>
              </div>
              <div className="text-right">
                {level.cost > 0 ? (
                  <span className={cn(
                    'text-sm font-bold',
                    canAfford ? 'text-gray-700' : 'text-red-500'
                  )}>
                    {level.cost} ❤️
                  </span>
                ) : (
                  <span className="text-sm text-green-600 font-medium">Grátis</span>
                )}
                <div className="text-xs text-gray-400">
                  Autor: +{level.reward} ❤️
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * Indicador de streak
 */
export function StreakIndicator({
  streak,
  nextReward,
}: {
  streak: number;
  nextReward?: { days: number; hearts: number } | null;
}) {
  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-full text-sm">
      <span className="text-orange-600">🔥</span>
      <span className="font-semibold text-orange-700">{streak} dias</span>
      {nextReward && (
        <span className="text-xs text-orange-500">
          ({nextReward.days - streak} para +{nextReward.hearts}❤️)
        </span>
      )}
    </div>
  );
}

/**
 * Toast de recompensa
 */
export function RewardToast({
  show,
  message,
  hearts,
  onClose,
}: {
  show: boolean;
  message: string;
  hearts: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full shadow-lg flex items-center gap-3">
        <span className="text-2xl">🎉</span>
        <div>
          <div className="font-bold">{message}</div>
          <div className="text-sm opacity-90">+{hearts} corações!</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translate(-50%, 20px) scale(0.8);
          }
          50% {
            transform: translate(-50%, -10px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
