'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  registerForEvent,
  cancelEventRegistration,
  checkInEvent,
  submitEventFeedback,
} from '@/actions/events';

export function useEvents() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRegister = useCallback(async (eventId: string) => {
    setError(null);
    const result = await registerForEvent(eventId);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true };
  }, [router]);

  return {
    isPending,
    error,
    register: handleRegister,
  };
}
