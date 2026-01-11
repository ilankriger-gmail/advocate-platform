import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Arena Te Amo',
    short_name: 'Arena',
    description: 'Comunidade oficial do O Moço do Te Amo - Participe de eventos, desafios e ganhe recompensas!',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#9333ea',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['social', 'entertainment', 'lifestyle'],
    lang: 'pt-BR',
  };
}
