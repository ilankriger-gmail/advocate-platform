'use client';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

// Extrair ID do vídeo de várias formas de URL do YouTube
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export default function YouTubeEmbed({ url, title = 'Vídeo do YouTube' }: YouTubeEmbedProps) {
  const vídeoId = extractYouTubeId(url);

  if (!vídeoId) {
    return (
      <div className="w-full aspect-vídeo bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        <p>URL do YouTube inválida</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-vídeo rounded-lg overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${vídeoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

// Validar se é uma URL válida do YouTube
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
