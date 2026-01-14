'use client';

import { useEffect, useRef, useState } from 'react';

interface InstagramEmbedProps {
  url: string;
}

// Extrair código do post do Instagram de várias formas de URL
function extractInstagramCode(url: string): string | null {
  const patterns = [
    /instagram\.com\/p\/([^/?]+)/,
    /instagram\.com\/reel\/([^/?]+)/,
    /instagram\.com\/tv\/([^/?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Detectar tipo de conteúdo pela URL
function getContentType(url: string): 'reel' | 'post' | 'tv' {
  if (url.includes('/reel/')) return 'reel';
  if (url.includes('/tv/')) return 'tv';
  return 'post';
}

export default function InstagramEmbed({ url }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const postCode = extractInstagramCode(url);
  const contentType = getContentType(url);

  useEffect(() => {
    if (!showEmbed || !postCode) return;

    // Carregar script do Instagram
    const loadScript = () => {
      const existingScript = document.querySelector('script[src*="instagram.com/embed.js"]');

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = () => {
          // @ts-expect-error Instagram global
          if (window.instgrm) {
            // @ts-expect-error Instagram global
            window.instgrm.Embeds.process();
          }
          setIsLoaded(true);
        };
        document.body.appendChild(script);
      } else {
        // Script já existe, processar embeds
        setTimeout(() => {
          // @ts-expect-error Instagram global
          if (window.instgrm) {
            // @ts-expect-error Instagram global
            window.instgrm.Embeds.process();
          }
          setIsLoaded(true);
        }, 100);
      }
    };

    loadScript();
  }, [showEmbed, postCode]);

  if (!postCode) {
    return (
      <div className="w-full p-6 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        <p>URL do Instagram inválida</p>
      </div>
    );
  }

  // URL canônica do post
  const embedUrl = contentType === 'reel'
    ? `https://www.instagram.com/reel/${postCode}/`
    : `https://www.instagram.com/p/${postCode}/`;

  // Thumbnail placeholder antes de carregar
  if (!showEmbed) {
    return (
      <button
        onClick={() => setShowEmbed(true)}
        className="w-full max-w-[540px] mx-auto aspect-square bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex flex-col items-center justify-center gap-4 hover:opacity-90 transition-opacity group"
      >
        {/* Ícone do Instagram */}
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
            <defs>
              <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFDC80" />
                <stop offset="50%" stopColor="#F56040" />
                <stop offset="100%" stopColor="#833AB4" />
              </linearGradient>
            </defs>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
        <div className="text-white text-center">
          <p className="font-semibold text-lg">
            {contentType === 'reel' ? 'Ver Reel' : 'Ver Post'}
          </p>
          <p className="text-sm opacity-80">Clique para carregar</p>
        </div>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      {!isLoaded && (
        <div className="w-full max-w-[540px] aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      )}
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={embedUrl}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '12px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '540px',
          minWidth: '326px',
          padding: 0,
          width: 'calc(100% - 2px)',
          display: isLoaded ? 'block' : 'none',
        }}
      >
        <div style={{ padding: '16px' }}>
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Ver no Instagram
          </a>
        </div>
      </blockquote>
    </div>
  );
}

// Validar se é uma URL válida do Instagram
export function isValidInstagramUrl(url: string): boolean {
  return extractInstagramCode(url) !== null;
}
