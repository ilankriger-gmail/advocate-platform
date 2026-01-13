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

    // Determinar filtro baseado no tipo de feed
    // Para help_request, filtrar por content_category
    // Para creator/community, filtrar por type
    // Para following/all, não há filtro simples (complexo demais para realtime)
    const getFilter = () => {
      if (type === 'all' || type === 'following') return undefined;
      if (type === 'help_request') return `content_category=eq.help_request`;
      return `type=eq.${type}`;
    };

    // Configurar subscription para novos posts
    const channel = supabase
      .channel('feed-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: getFilter(),
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
          const updatedPost = payload.new as { id: string; status: string; type: string; content_category?: string };
          const oldPost = payload.old as { status: string };

          // Verificar se o post corresponde ao tipo de feed atual
          // Para 'following', não temos como verificar aqui sem buscar os follows do usuário
          const matchesFeed = type === 'all'
            || type === 'following' // Aceitar todos para 'following' (simplificação)
            || (type === 'help_request' && updatedPost.content_category === 'help_request')
            || (type !== 'help_request' && updatedPost.type === type);

          if (
            oldPost.status !== 'approved' &&
            updatedPost.status === 'approved' &&
            matchesFeed &&
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
