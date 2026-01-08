'use client';

import { useEffect, useRef } from 'react';

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

export default function InstagramEmbed({ url }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const postCode = extractInstagramCode(url);

  useEffect(() => {
    // Carregar script do Instagram se ainda não foi carregado
    if (typeof window !== 'undefined' && postCode) {
      // Verificar se o script já existe
      const existingScript = document.querySelector('script[src*="instagram.com/embed.js"]');

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      } else {
        // Se já existe, processar embeds pendentes
        // @ts-expect-error Instagram global
        if (window.instgrm) {
          // @ts-expect-error Instagram global
          window.instgrm.Embeds.process();
        }
      }
    }
  }, [postCode]);

  if (!postCode) {
    return (
      <div className="w-full p-6 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        <p>URL do Instagram inválida</p>
      </div>
    );
  }

  // URL canônica do post
  const embedUrl = `https://www.instagram.com/p/${postCode}/`;

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={embedUrl}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '540px',
          minWidth: '326px',
          padding: 0,
          width: 'calc(100% - 2px)',
        }}
      >
        <div style={{ padding: '16px' }}>
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800"
          >
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
