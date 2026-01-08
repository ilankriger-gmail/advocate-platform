'use client';

import { useState, useCallback } from 'react';
import YouTubeEmbed, { isValidYouTubeUrl } from './YouTubeEmbed';

interface YouTubeInputProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function YouTubeInput({ value, onChange, disabled = false }: YouTubeInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setInputValue(url);
    setError(null);

    if (url === '') {
      onChange('');
      return;
    }

    if (isValidYouTubeUrl(url)) {
      onChange(url);
    } else {
      setError('URL do YouTube inválida');
    }
  }, [onChange]);

  const handleClear = useCallback(() => {
    setInputValue('');
    setError(null);
    onChange('');
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <input
            type="url"
            value={inputValue}
            onChange={handleChange}
            placeholder="Cole a URL do vídeo do YouTube"
            disabled={disabled}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              error ? 'border-red-300' : 'border-gray-300'
            } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
          />
        </div>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-gray-500 hover:text-red-500 transition-colors"
            title="Remover vídeo"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {value && isValidYouTubeUrl(value) && (
        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-2">Preview:</p>
          <YouTubeEmbed url={value} />
        </div>
      )}

      <p className="text-xs text-gray-400">
        Formatos aceitos: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...
      </p>
    </div>
  );
}
