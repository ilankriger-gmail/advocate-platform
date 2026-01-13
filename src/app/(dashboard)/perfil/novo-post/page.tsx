'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createPost } from '@/actions/posts';
import { getCurrentProfile } from '@/actions/profile';
import MediaUploader from '@/components/posts/MediaUploader';
import YouTubeInput from '@/components/posts/YouTubeInput';
import InstagramInput from '@/components/posts/InstagramInput';
import { Button } from '@/components/ui';
import type { MediaType } from '@/types/post';

// Carregar editor dinamicamente para evitar problemas de SSR
const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[180px] bg-gray-100 rounded-lg animate-pulse" />
    ),
  }
);

type MediaTab = 'none' | 'images' | 'youtube' | 'instagram';

export default function NovoPostPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estado do formulário
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaTab, setMediaTab] = useState<MediaTab>('none');
  const [images, setImages] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHelpRequestAlert, setShowHelpRequestAlert] = useState(false);

  // Buscar status de criador do servidor
  const [isCreator, setIsCreator] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    async function checkCreatorStatus() {
      const profile = await getCurrentProfile();
      if (profile) {
        setIsCreator(profile.is_creator);
      }
      setIsLoadingProfile(false);
    }
    checkCreatorStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Título e conteúdo são opcionais para posts com YouTube ou Instagram
    const hasEmbed = mediaTab === 'youtube' || mediaTab === 'instagram';

    if (!hasEmbed) {
      if (!title.trim()) {
        setError('Título é obrigatório');
        return;
      }

      if (!content.trim() || content === '<p></p>') {
        setError('Conteúdo é obrigatório');
        return;
      }
    }

    startTransition(async () => {
      let mediaType: MediaType = 'none';
      let mediaUrl: string[] | undefined;
      let youtubeUrlFinal: string | undefined;
      let instagramUrlFinal: string | undefined;

      switch (mediaTab) {
        case 'images':
          if (images.length === 1) {
            mediaType = 'image';
          } else if (images.length > 1) {
            mediaType = 'carousel';
          }
          mediaUrl = images.length > 0 ? images : undefined;
          break;
        case 'youtube':
          if (youtubeUrl) {
            mediaType = 'youtube';
            youtubeUrlFinal = youtubeUrl;
          }
          break;
        case 'instagram':
          if (instagramUrl) {
            mediaType = 'instagram';
            instagramUrlFinal = instagramUrl;
          }
          break;
      }

      const result = await createPost({
        title: title.trim(),
        content,
        type: 'community',
        media_type: mediaType,
        media_url: mediaUrl,
        youtube_url: youtubeUrlFinal,
        instagram_url: instagramUrlFinal,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.contentCategory === 'help_request') {
        // Mostrar alerta especial para pedido de ajuda
        setShowHelpRequestAlert(true);
      } else {
        router.push('/');
        router.refresh();
      }
    });
  };

  // Tela de sucesso para pedido de ajuda
  if (showHelpRequestAlert) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-blue-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-blue-900 mb-2">
              Pedido de Ajuda Publicado!
            </h1>

            <p className="text-blue-700 mb-6 max-w-md">
              Identificamos que sua publicação é um pedido de ajuda. Ela aparecerá na <strong>Comunidade</strong> e também tem uma aba especial dedicada.
            </p>

            <div className="bg-white/70 border border-blue-200 rounded-xl p-4 mb-6 w-full max-w-md">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Aba Especial: Pedidos de Ajuda</p>
                  <p className="text-sm text-blue-700">
                    Existe uma aba dedicada para conectar quem precisa de ajuda com quem pode ajudar!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <Link href="/?tab=ajuda" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Ver Pedidos de Ajuda
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  Ir para Comunidade
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mediaTabs: { id: MediaTab; label: string; icon: string; creatorOnly?: boolean }[] = [
    { id: 'none', label: 'Sem mídia', icon: '📝' },
    { id: 'images', label: 'Imagens', icon: '🖼️' },
    { id: 'youtube', label: 'YouTube', icon: '▶️', creatorOnly: true },
    { id: 'instagram', label: 'Instagram', icon: '📸', creatorOnly: true },
  ];

  const filteredTabs = mediaTabs.filter(tab => !tab.creatorOnly || isCreator);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/perfil"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Criar Novo Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Título *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título do seu post"
            maxLength={100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/100 caracteres</p>
        </div>

        {/* Conteúdo (Rich Text) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conteúdo *
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Escreva o conteúdo do seu post..."
            disableLinks={!isCreator}
          />
        </div>

        {/* Seletor de Mídia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mídia
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMediaTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mediaTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Conteúdo da aba selecionada */}
          {mediaTab === 'images' && (
            <MediaUploader
              images={images}
              onChange={setImages}
              maxImages={5}
            />
          )}

          {mediaTab === 'youtube' && (
            <YouTubeInput
              value={youtubeUrl}
              onChange={setYoutubeUrl}
            />
          )}

          {mediaTab === 'instagram' && (
            <InstagramInput
              value={instagramUrl}
              onChange={setInstagramUrl}
            />
          )}
        </div>

        {/* Erro */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Info de moderação */}
        {!isLoadingProfile && (
          <div className={`p-4 border rounded-lg text-sm ${
            isCreator
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <p>
              {isCreator ? (
                <><strong>Criador:</strong> Seu post será publicado automaticamente.</>
              ) : (
                <><strong>Nota:</strong> Seu post será enviado para moderação antes de ser publicado.</>
              )}
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/perfil"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
