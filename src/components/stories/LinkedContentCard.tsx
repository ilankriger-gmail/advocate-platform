'use client';

import Link from 'next/link';
import { LinkedContentType } from '@/types/story';

interface LinkedContentCardProps {
  type: LinkedContentType;
  id: string;
  title: string;
  image?: string | null;
  subtitle?: string;
}

export function LinkedContentCard({
  type,
  id,
  title,
  image,
  subtitle,
}: LinkedContentCardProps) {
  const getLink = () => {
    switch (type) {
      case 'challenge':
        return '/desafios';
      case 'reward':
        return '/premios';
      case 'ranking':
        return '/ranking';
      default:
        return '/';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'challenge':
        return '🏆';
      case 'reward':
        return '🎁';
      case 'ranking':
        return '📊';
      default:
        return '📌';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'challenge':
        return 'Desafio';
      case 'reward':
        return 'Prêmio';
      case 'ranking':
        return 'Ranking';
      default:
        return 'Conteúdo';
    }
  };

  const getButtonText = () => {
    switch (type) {
      case 'challenge':
        return 'Ver Desafio';
      case 'reward':
        return 'Ver Prêmio';
      case 'ranking':
        return 'Ver Ranking';
      default:
        return 'Ver mais';
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'challenge':
        return 'from-purple-600/90 to-indigo-600/90';
      case 'reward':
        return 'from-amber-500/90 to-orange-500/90';
      case 'ranking':
        return 'from-emerald-500/90 to-teal-500/90';
      default:
        return 'from-gray-600/90 to-gray-700/90';
    }
  };

  return (
    <Link
      href={getLink()}
      className={`block w-full rounded-xl overflow-hidden bg-gradient-to-r ${getGradient()} backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail ou Icon */}
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{getIcon()}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/80 font-medium uppercase tracking-wide">
            {getLabel()}
          </p>
          <p className="text-sm font-semibold text-white truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-white/70 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
