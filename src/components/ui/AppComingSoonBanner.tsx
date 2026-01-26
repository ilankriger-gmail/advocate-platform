'use client';

import { useState } from 'react';
import { Smartphone, X } from 'lucide-react';

export function AppComingSoonBanner() {
  const [dismissed, setDismissed] = useState(false);

  // Check if already dismissed in this session
  if (typeof window !== 'undefined') {
    const wasDismissed = sessionStorage.getItem('app-banner-dismissed');
    if (wasDismissed && !dismissed) {
      return null;
    }
  }

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app-banner-dismissed', 'true');
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm">
        <Smartphone className="w-5 h-5 flex-shrink-0" />
        <p className="font-medium">
          📱 <strong>App iOS e Android em breve!</strong>
        </p>
        <button
          onClick={handleDismiss}
          className="absolute right-4 p-1 text-white/70 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
