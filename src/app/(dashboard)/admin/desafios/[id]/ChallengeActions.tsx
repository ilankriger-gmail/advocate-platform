'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { toggleChallengeActive } from '@/actions/challenges-admin';

interface ChallengeActionsProps {
  challenge: {
    id: string;
    is_active: boolean;
  };
}

export function ChallengeActions({ challenge }: ChallengeActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const result = await toggleChallengeActive(challenge.id, !challenge.is_active);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleToggle}
        disabled={isLoading}
        variant="outline"
        className={challenge.is_active ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}
      >
        {isLoading ? 'Processando...' : challenge.is_active ? 'Desativar' : 'Ativar'}
      </Button>
    </div>
  );
}
