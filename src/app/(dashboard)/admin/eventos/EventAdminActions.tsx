'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { toggleEventActive } from '@/actions/events-admin';

interface EventAdminActionsProps {
  event: {
    id: string;
    is_active: boolean;
  };
}

export function EventAdminActions({ event }: EventAdminActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const result = await toggleEventActive(event.id, !event.is_active);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="flex gap-2">
      <Link href={`/admin/eventos/${event.id}/editar`}>
        <Button
          size="sm"
          variant="outline"
          className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
        >
          Editar
        </Button>
      </Link>
      <Button
        onClick={handleToggle}
        disabled={isLoading}
        size="sm"
        variant="outline"
        className={event.is_active ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}
      >
        {isLoading ? '...' : event.is_active ? 'Desativar' : 'Ativar'}
      </Button>
    </div>
  );
}
