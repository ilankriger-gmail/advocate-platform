'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createPost,
  approvePost,
  rejectPost,
  likePost,
  commentPost,
  deletePost,
} from '@/actions/posts';
import type { CreatePostData } from '@/types/post';

export function usePosts() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async (data: CreatePostData) => {
    setError(null);
    const result = await createPost(data);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true, data: result.data };
  }, [router]);

  const handleApprove = useCallback(async (postId: string) => {
    setError(null);
    const result = await approvePost(postId);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true };
  }, [router]);

  const handleReject = useCallback(async (postId: string, reason: string) => {
    setError(null);
    const result = await rejectPost(postId, reason);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true };
  }, [router]);

  const handleLike = useCallback(async (postId: string) => {
    setError(null);
    const result = await likePost(postId);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true };
  }, [router]);

  const handleComment = useCallback(async (postId: string, content: string) => {
    setError(null);
    const result = await commentPost(postId, content);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true, data: result.data };
  }, [router]);

  const handleDelete = useCallback(async (postId: string) => {
    setError(null);
    const result = await deletePost(postId);

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
    create: handleCreate,
    approve: handleApprove,
    reject: handleReject,
    like: handleLike,
    comment: handleComment,
    delete: handleDelete,
  };
}
