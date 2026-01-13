'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Avatar, Badge } from '@/components/ui';
import { FollowButton } from './FollowButton';
import { getSuggestedUsers } from '@/actions/social';
import type { SuggestedUser } from '@/types/social';

interface SuggestedUsersProps {
  limit?: number;
  className?: string;
}

export function SuggestedUsers({ limit = 5, className = '' }: SuggestedUsersProps) {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const suggestions = await getSuggestedUsers(limit);
        setUsers(suggestions);
      } catch (error) {
        console.error('Erro ao carregar sugestões:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSuggestions();
  }, [limit]);

  // Callback quando o status de follow muda
  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    if (isFollowing) {
      // Remover da lista quando o usuário começa a seguir
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <h3 className="font-semibold text-gray-900 mb-4">Sugestões para você</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (users.length === 0) {
    return null; // Não mostrar nada se não houver sugestões
  }

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">Sugestões para você</h3>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`}>
              <Avatar
                name={user.full_name || 'Usuário'}
                src={user.avatar_url || undefined}
                size="sm"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${user.id}`}
                className="font-medium text-gray-900 hover:text-indigo-600 transition-colors text-sm truncate block"
              >
                {user.full_name || 'Usuário'}
              </Link>
              <div className="flex items-center gap-2">
                {user.is_creator && (
                  <Badge variant="primary" size="sm">
                    Criador
                  </Badge>
                )}
                {!user.is_creator && user.reason === 'popular' && (
                  <span className="text-xs text-gray-500">
                    {user.followers_count} seguidores
                  </span>
                )}
              </div>
            </div>
            <FollowButton
              userId={user.id}
              initialIsFollowing={false}
              variant="compact"
              onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
