'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// CONTEXTO
// ============================================

interface HeartsToastContextValue {
  showHearts: (amount: number, message?: string) => void;
}

const HeartsToastContext = createContext<HeartsToastContextValue | null>(null);

export function useHeartsToast() {
  const context = useContext(HeartsToastContext);
  if (!context) {
    throw new Error('useHeartsToast must be used within a HeartsToastProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

interface HeartsNotification {
  id: string;
  amount: number;
  message?: string;
}

export function HeartsToastProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<HeartsNotification[]>([]);

  const showHearts = useCallback((amount: number, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const notification = { id, amount, message };
    
    setNotifications((prev) => [...prev, notification]);

    // Auto remove after animation
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 2500);
  }, []);

  return (
    <HeartsToastContext.Provider value={{ showHearts }}>
      {children}
      <HeartsToastContainer notifications={notifications} />
    </HeartsToastContext.Provider>
  );
}

// ============================================
// CONTAINER
// ============================================

function HeartsToastContainer({ notifications }: { notifications: HeartsNotification[] }) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <HeartsToastItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

// ============================================
// ITEM COM ANIMAÇÃO
// ============================================

function HeartsToastItem({ notification }: { notification: HeartsNotification }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl transition-all duration-500',
        'bg-gradient-to-r from-pink-500 to-red-500 text-white',
        visible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-4 scale-90'
      )}
      style={{
        animation: visible ? 'heartsToastBounce 0.5s ease-out, heartsToastFade 2.5s ease-in-out' : undefined
      }}
    >
      {/* Coração animado */}
      <div className="relative">
        <span 
          className="text-2xl"
          style={{ animation: 'heartPulse 0.3s ease-in-out 3' }}
        >
          ❤️
        </span>
        {/* Partículas de coração */}
        <FloatingHearts />
      </div>
      
      {/* Texto */}
      <div className="flex flex-col">
        <span className="font-bold text-lg">
          +{notification.amount} {notification.amount === 1 ? 'coração' : 'corações'}
        </span>
        {notification.message && (
          <span className="text-sm text-white/80">{notification.message}</span>
        )}
      </div>
    </div>
  );
}

// ============================================
// CORAÇÕES FLUTUANTES
// ============================================

function FloatingHearts() {
  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className="absolute text-sm opacity-0"
          style={{
            animation: `floatHeart 1s ease-out ${i * 0.1}s forwards`,
            left: `${-10 + i * 5}px`,
          }}
        >
          ❤️
        </span>
      ))}
    </div>
  );
}

// ============================================
// ESTILOS GLOBAIS (adicionar ao globals.css)
// ============================================

export const heartsToastStyles = `
@keyframes heartsToastBounce {
  0% { transform: translateY(-20px) scale(0.8); }
  50% { transform: translateY(5px) scale(1.05); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes heartsToastFade {
  0%, 70% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-10px); }
}

@keyframes heartPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

@keyframes floatHeart {
  0% { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
  100% { 
    opacity: 0; 
    transform: translateY(-30px) scale(0.5) rotate(20deg); 
  }
}
`;
