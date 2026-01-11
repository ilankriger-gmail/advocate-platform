'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { searchYouTubeVideos } from '@/actions/youtube';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

interface YouTubeVideoPickerProps {
  onSelect: (url: string) => void;
}

export function YouTubeVideoPicker({ onSelect }: YouTubeVideoPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadVideos = async (query?: string) => {
    setIsLoading(true);
    setError(null);

    const result = await searchYouTubeVideos(query);

    if (result.error) {
      setError(result.error);
      setVideos([]);
    } else {
      setVideos(result.videos || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && videos.length === 0) {
      loadVideos();
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadVideos(searchQuery);
  };

  const handleSelect = (video: YouTubeVideo) => {
    onSelect(video.url);
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="shrink-0"
      >
        <svg className="w-5 h-5 mr-1 text-red-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        Buscar
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Videos do Canal
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar videos..."
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '...' : 'Buscar'}
                </Button>
              </form>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Nenhum video encontrado
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => handleSelect(video)}
                      className="text-left group hover:ring-2 hover:ring-indigo-500 rounded-lg overflow-hidden transition-all"
                    >
                      <div className="relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600">
                          {video.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(video.publishedAt)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Clique em um video para selecionar
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
