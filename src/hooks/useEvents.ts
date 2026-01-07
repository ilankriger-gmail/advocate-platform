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

  return {
    isPending,
    error,
  };
}
