'use client';

interface InstagramEmbedProps {
  url: string;
}

// FUNCIONALIDADE DESABILITADA TEMPORARIAMENTE
export default function InstagramEmbed({ url }: InstagramEmbedProps) {
  return null;
}

// Validar se é uma URL válida do Instagram (mantido para compatibilidade)
export function isValidInstagramUrl(url: string): boolean {
  const patterns = [
    /instagram\.com\/p\/([^/?]+)/,
    /instagram\.com\/reel\/([^/?]+)/,
    /instagram\.com\/tv\/([^/?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return true;
    }
  }

  return false;
}
