'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ConfirmModal } from '@/components/ui';
import { registerForEvent, cancelEventRegistration } from '@/actions/events';

interface EventActionsProps {
  eventId: string;
  isRegistered: boolean;
  canRegister: boolean;
  isLive: boolean;
  meetingUrl: string | null;
}

export function EventActions({
  eventId,
  isRegistered,
  canRegister,
  isLive,
  meetingUrl,
}: EventActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);
    const result = await registerForEvent(eventId);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    setIsLoading(true);
    const result = await cancelEventRegistration(eventId);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
    setIsCancelModalOpen(false);
  };

  return (
    <>
      {isRegistered ? (
        <div className="space-y-3">
          {isLive && meetingUrl && (
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Entrar no Evento
            </a>
          )}

          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Cancelando...' : 'Cancelar Inscricao'}
          </Button>
        </div>
      ) : !canRegister ? (
        <div className="py-3 px-4 bg-gray-100 text-gray-500 text-center rounded-lg">
          Inscricao indisponivel
        </div>
      ) : (
        <Button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Inscrevendo...' : 'Inscrever-se'}
        </Button>
      )}

      {/* Cancel Registration Confirmation Modal */}
      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancelar inscrição"
        description="Tem certeza que deseja cancelar sua inscrição neste evento?"
        variant="danger"
        confirmText="Cancelar inscrição"
        cancelText="Voltar"
      />
    </>
  );
}
