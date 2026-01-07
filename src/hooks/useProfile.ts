'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/actions/profile';
import type { UpdateProfileData } from '@/types/profile';

export function useProfile() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = useCallback(async (data: UpdateProfileData) => {
    setError(null);
    const result = await updateProfile(data);

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
    update: handleUpdate,
  };
}
