'use server';

import { logger, sanitizeError } from '@/lib';

// Logger contextualizado para o módulo de youtube
const youtubeLogger = logger.withContext('[YouTube]');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE || '@nextleveldj1';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
  viewCount?: number;
}

interface YouTubeSearchResponse {
  items?: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      thumbnails: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
      };
      publishedAt: string;
    };
  }>;
  error?: { message: string };
}

interface YouTubeChannelResponse {
  items?: Array<{
    id: string;
  }>;
}

interface YouTubeVideoStatsResponse {
  items?: Array<{
    id: string;
    statistics: {
      viewCount: string;
    };
  }>;
}

/**
 * Busca o Channel ID a partir do handle (@username)
 */
async function getChannelIdFromHandle(handle: string): Promise<string | null> {
  const params = new URLSearchParams({
    part: 'id',
    forHandle: handle.replace('@', ''),
    key: YOUTUBE_API_KEY!,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
  const data: YouTubeChannelResponse = await res.json();

  return data.items?.[0]?.id || null;
}

/**
 * Busca vídeos do canal do YouTube
 */
export async function searchYouTubeVideos(query?: string): Promise<{
  videos?: YouTubeVideo[];
  error?: string;
}> {
  if (!YOUTUBE_API_KEY) {
    return { error: 'Chave da API do YouTube não configurada' };
  }

  try {
    // Primeiro, buscar o Channel ID a partir do handle
    const channelId = await getChannelIdFromHandle(CHANNEL_HANDLE);

    if (!channelId) {
      return { error: 'Canal não encontrado' };
    }

    // Buscar vídeos do canal
    // Se houver busca, ordenar por views; senão, por data
    const params = new URLSearchParams({
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      maxResults: '20',
      order: query && query.trim() ? 'viewCount' : 'date',
      key: YOUTUBE_API_KEY,
    });

    if (query && query.trim()) {
      params.set('q', query.trim());
    }

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data: YouTubeSearchResponse = await res.json();

    if (data.error) {
      youtubeLogger.error('Erro na API do YouTube', { error: sanitizeError(data.error) });
      return { error: data.error.message };
    }

    // Extrair IDs dos vídeos para buscar estatísticas
    const videoIds = (data.items || []).map((item) => item.id.videoId).join(',');

    // Buscar estatísticas dos vídeos
    let viewCounts: Record<string, number> = {};
    if (videoIds) {
      const statsParams = new URLSearchParams({
        part: 'statistics',
        id: videoIds,
        key: YOUTUBE_API_KEY,
      });

      const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${statsParams}`);
      const statsData: YouTubeVideoStatsResponse = await statsRes.json();

      if (statsData.items) {
        viewCounts = statsData.items.reduce(
          (acc, item) => {
            acc[item.id] = parseInt(item.statistics.viewCount, 10);
            return acc;
          },
          {} as Record<string, number>
        );
      }
    }

    let videos: YouTubeVideo[] = (data.items || []).map((item) => {
      // SEMPRE usar URL direta do YouTube (mais confiavel que a API)
      const thumbnailUrl = `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`;

      return {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: thumbnailUrl,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        viewCount: viewCounts[item.id.videoId] || 0,
      };
    });

    // Filtrar vídeos que tenham o termo de busca no título
    // (a API do YouTube retorna por relevância, mas pode incluir vídeos sem o termo no título)
    if (query && query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      videos = videos.filter((video) =>
        video.title.toLowerCase().includes(searchTerm)
      );
    }

    return { videos };
  } catch (error) {
    youtubeLogger.error('Erro ao buscar vídeos', { error: sanitizeError(error) });
    return { error: 'Erro ao buscar vídeos do YouTube' };
  }
}
