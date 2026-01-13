'use client';

import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { deleteStoryAdmin } from '@/actions/stories-admin';

interface StoryAdminCardProps {
  story: {
    id: string;
    user_id: string;
    title: string | null;
    caption: string | null;
    media_url: string[];
    media_type: string | null;
    youtube_url: string | null;
    instagram_url: string | null;
    linked_content_type: string | null;
    linked_content_id: string | null;
    created_at: string;
  };
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    instagram_username: string | null;
  } | null;
  viewCount: number;
}

export function StoryAdminCard({ story, author, viewCount }: StoryAdminCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este story? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteStoryAdmin(story.id);

    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
      return;
    }

    setIsDeleted(true);
  };

  if (isDeleted) {
    return null;
  }

  // Determinar thumbnail
  const getThumbnail = () => {
    if (story.media_url && story.media_url.length > 0) {
      return story.media_url[0];
    }
    if (story.youtube_url) {
      // Extrair ID do YouTube e gerar thumbnail
      const videoId = story.youtube_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)?.[1];
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }
    return null;
  };

  const thumbnail = getThumbnail();
  const createdAt = new Date(story.created_at);
  const timeAgo = getTimeAgo(createdAt);

  // Badge de tipo
  const getTypeBadge = () => {
    switch (story.media_type) {
      case 'youtube':
        return <Badge className="bg-red-100 text-red-700 text-xs">▶️ YouTube</Badge>;
      case 'instagram':
        return <Badge className="bg-purple-100 text-purple-700 text-xs">📷 Instagram</Badge>;
      case 'carousel':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">🎠 {story.media_url.length} fotos</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 text-xs">🖼️ Imagem</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] max-h-[200px] bg-gray-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={story.title || 'Story'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500">
            <span className="text-4xl">📱</span>
          </div>
        )}

        {/* Overlay com views */}
        <div className="absolute top-2 right-2">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <span className="text-white text-xs">👁️</span>
            <span className="text-white text-xs font-medium">{viewCount}</span>
          </div>
        </div>

        {/* Badge de tipo */}
        <div className="absolute top-2 left-2">
          {getTypeBadge()}
        </div>

        {/* Conteúdo vinculado */}
        {story.linked_content_type && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-green-500 text-white text-xs">
              🔗 {story.linked_content_type === 'challenge' && 'Desafio'}
              {story.linked_content_type === 'reward' && 'Prêmio'}
              {story.linked_content_type === 'ranking' && 'Ranking'}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Autor */}
        <div className="flex items-center gap-2">
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.full_name || 'Autor'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {author?.full_name?.[0] || '?'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {author?.full_name || 'Usuário'}
            </p>
            {author?.instagram_username && (
              <p className="text-xs text-gray-500 truncate">
                @{author.instagram_username}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-400">{timeAgo}</span>
        </div>

        {/* Título/Caption */}
        {(story.title || story.caption) && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {story.title || story.caption}
          </p>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Excluindo...' : '🗑️ Excluir'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}min`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
}
