'use client';

import { useState, useCallback } from 'react';
import InstagramEmbed, { isValidInstagramUrl } from './InstagramEmbed';

interface InstagramInputProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function InstagramInput({ value, onChange, disabled = false }: InstagramInputProps) {
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

    if (isValidInstagramUrl(url)) {
      onChange(url);
    } else {
      setError('URL do Instagram inválida');
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
            <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <input
            type="url"
            value={inputValue}
            onChange={handleChange}
            placeholder="Cole a URL do post do Instagram"
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
            title="Remover post"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {value && isValidInstagramUrl(value) && (
        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-2">Preview:</p>
          <InstagramEmbed url={value} />
        </div>
      )}

      <p className="text-xs text-gray-400">
        Formatos aceitos: instagram.com/p/..., instagram.com/reel/..., instagram.com/tv/...
      </p>
    </div>
  );
}
