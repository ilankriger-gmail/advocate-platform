'use server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE || '@nextleveldj1';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

interface YouTubeSearchResponse {
  items?: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      thumbnails: { medium: { url: string } };
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
    const params = new URLSearchParams({
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      maxResults: '20',
      order: 'date',
      key: YOUTUBE_API_KEY,
    });

    if (query && query.trim()) {
      params.set('q', query.trim());
    }

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data: YouTubeSearchResponse = await res.json();

    if (data.error) {
      console.error('YouTube API error:', data.error);
      return { error: data.error.message };
    }

    const videos: YouTubeVideo[] = (data.items || []).map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    return { videos };
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    return { error: 'Erro ao buscar vídeos do YouTube' };
  }
}
