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
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        <p>URL do YouTube inválida</p>
      </div>
    );
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // Mostra thumbnail com botão play que abre no YouTube
  return (
    <a
      href={youtubeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full aspect-video rounded-lg overflow-hidden relative group bg-gray-900"
    >
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
      />
      {/* Botão play centralizado */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 group-hover:scale-110 transition-all shadow-lg">
          <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      {/* Badge YouTube no canto */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-xs rounded">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        Assistir
      </div>
    </a>
  );
}

// Validar se é uma URL válida do YouTube
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
