'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { saveTrophyMessage } from '@/actions/challenges';

interface TrophyMessageFormProps {
  participationId: string;
}

export function TrophyMessageForm({ participationId }: TrophyMessageFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    const result = await saveTrophyMessage(participationId, message.trim());
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-2.5 border-2 border-dashed border-amber-300 rounded-xl text-sm text-amber-600 hover:bg-amber-50 transition-colors font-medium"
      >
        ✍️ Deixar sua mensagem de campeão
      </button>
    );
  }

  return (
    <div className="space-y-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escreva sua mensagem de campeão! Ex: 'Foi difícil mas consegui! Nunca desista!'"
        rows={2}
        maxLength={200}
        className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{message.length}/200</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setIsOpen(false); setMessage(''); }}
            disabled={isLoading}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isLoading || !message.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
          >
            {isLoading ? '...' : '✍️ Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
