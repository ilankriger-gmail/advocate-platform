'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { FeedType } from '@/actions/feed';

interface UseRealtimeFeedOptions {
  type: FeedType;
  enabled?: boolean;
}

/**
 * Hook para escutar novos posts em tempo real via Supabase Realtime
 * Retorna contador de novos posts e função para resetar
 */
export function useRealtimeFeed({ type, enabled = true }: UseRealtimeFeedOptions) {
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [lastPostId, setLastPostId] = useState<string | null>(null);

  const resetCount = useCallback(() => {
    setNewPostsCount(0);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    // Configurar subscription para novos posts
    const channel = supabase
      .channel('feed-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: type !== 'all' ? `type=eq.${type}` : undefined,
        },
        (payload) => {
          // Verificar se é um post aprovado
          const newPost = payload.new as { id: string; status: string };

          if (newPost.status === 'approved' && newPost.id !== lastPostId) {
            setNewPostsCount((prev) => prev + 1);
            setLastPostId(newPost.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          // Post foi aprovado
          const updatedPost = payload.new as { id: string; status: string; type: string };
          const oldPost = payload.old as { status: string };

          if (
            oldPost.status !== 'approved' &&
            updatedPost.status === 'approved' &&
            (type === 'all' || updatedPost.type === type) &&
            updatedPost.id !== lastPostId
          ) {
            setNewPostsCount((prev) => prev + 1);
            setLastPostId(updatedPost.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, enabled, lastPostId]);

  return {
    newPostsCount,
    hasNewPosts: newPostsCount > 0,
    resetCount,
  };
}

/**
 * Hook para escutar atualizações de votos em tempo real
 */
export function useRealtimeVotes(postId: string, initialScore: number) {
  const [voteScore, setVoteScore] = useState(initialScore);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`post-votes-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_votes',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          // Refetch do score quando há mudança nos votos
          supabase
            .from('posts')
            .select('vote_score')
            .eq('id', postId)
            .single()
            .then(({ data }) => {
              if (data) {
                setVoteScore(data.vote_score || 0);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return voteScore;
}
