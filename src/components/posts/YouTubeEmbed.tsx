'use client';

import { useState } from 'react';

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
  const [showFallback, setShowFallback] = useState(false);
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

  // Mostrar fallback com thumbnail e link
  if (showFallback) {
    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden relative bg-gray-900">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <p className="text-sm mb-3 text-center px-4">
            Este vídeo não pode ser reproduzido aqui
          </p>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Assistir no YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden relative group">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        onError={() => setShowFallback(true)}
      />
      {/* Link de fallback sempre visível no canto */}
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setShowFallback(true)}
        className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 hover:bg-black/90 text-white text-xs rounded transition-colors opacity-0 group-hover:opacity-100"
        title="Abrir no YouTube"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        YouTube
      </a>
    </div>
  );
}

// Validar se é uma URL válida do YouTube
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
