'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { registerWinner, markWinnerPaid } from '@/actions/challenges-admin';

interface WinnerActionsProps {
  challengeId: string;
  prizeAmount?: number | null;
}

export function WinnerActions({ challengeId, prizeAmount }: WinnerActionsProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    instagramUsername: '',
    prizeAmount: prizeAmount?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await registerWinner({
      challengeId,
      instagramUsername: formData.instagramUsername,
      prizeAmount: formData.prizeAmount ? parseFloat(formData.prizeAmount) : undefined,
    });

    if (result.success) {
      setIsModalOpen(false);
      setFormData({ instagramUsername: '', prizeAmount: prizeAmount?.toString() || '' });
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} size="sm">
        + Registrar Ganhador
      </Button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Ganhador</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario do Instagram *
                </label>
                <Input
                  value={formData.instagramUsername}
                  onChange={(e) => setFormData({ ...formData, instagramUsername: e.target.value })}
                  placeholder="@usuario"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Premio (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.prizeAmount}
                  onChange={(e) => setFormData({ ...formData, prizeAmount: e.target.value })}
                  placeholder="100.00"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
