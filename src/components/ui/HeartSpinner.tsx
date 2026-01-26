/**
 * Componente de spinner com coração animado
 * Usado para indicar carregamento com a identidade visual da Arena Te Amo
 */

import { cn } from '@/lib/utils';

export type HeartSpinnerSize = 'sm' | 'md' | 'lg';

export interface HeartSpinnerProps {
  size?: HeartSpinnerSize;
  className?: string;
  label?: string;
}

export function HeartSpinner({ size = 'md', className, label }: HeartSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-lg',
    md: 'w-10 h-10 text-2xl',
    lg: 'w-16 h-16 text-4xl',
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn('animate-heartbeat', sizeClasses[size])}>
        ❤️
      </div>
      {label && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {label}
        </span>
      )}
      <style jsx>{`
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.2);
          }
          50% {
            transform: scale(1);
          }
          75% {
            transform: scale(1.1);
          }
        }
        .animate-heartbeat {
          animation: heartbeat 1s ease-in-out infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

/**
 * Loading overlay com corações
 */
export function HeartLoadingOverlay({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <span className="text-3xl animate-bounce" style={{ animationDelay: '0ms' }}>❤️</span>
          <span className="text-3xl animate-bounce" style={{ animationDelay: '150ms' }}>❤️</span>
          <span className="text-3xl animate-bounce" style={{ animationDelay: '300ms' }}>❤️</span>
        </div>
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
}
