'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { updatePost } from '@/actions/posts';
import MediaUploader from '@/components/posts/MediaUploader';
import YouTubeInput from '@/components/posts/YouTubeInput';
import InstagramInput from '@/components/posts/InstagramInput';
import type { MediaType } from '@/types/post';
import { createClient } from '@/lib/supabase/client';

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

export default function EditarPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  // Estado do formulário
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaTab, setMediaTab] = useState<MediaTab>('none');
  const [images, setImages] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  // Carregar dados do post
  useEffect(() => {
    async function loadPost() {
      try {
        const supabase = createClient();

        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Verificar se é criador
        const { data: userData } = await supabase
          .from('users')
          .select('is_creator')
          .eq('id', user.id)
          .single();

        setIsCreator(userData?.is_creator ?? false);

        // Buscar post
        const { data: post, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .eq('user_id', user.id) // Apenas posts do próprio usuário
          .single();

        if (postError || !post) {
          setError('Post não encontrado ou você não tem permissão para editá-lo');
          setLoading(false);
          return;
        }

        // Preencher formulário
        setTitle(post.title);
        setContent(post.content || '');

        // Determinar tipo de mídia
        if (post.youtube_url) {
          setMediaTab('youtube');
          setYoutubeUrl(post.youtube_url);
        } else if (post.instagram_url) {
          setMediaTab('instagram');
          setInstagramUrl(post.instagram_url);
        } else if (post.media_url && post.media_url.length > 0) {
          setMediaTab('images');
          setImages(post.media_url);
        } else {
          setMediaTab('none');
        }

        setLoading(false);
      } catch {
        setError('Erro ao carregar post');
        setLoading(false);
      }
    }

    loadPost();
  }, [postId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    if (!content.trim() || content === '<p></p>') {
      setError('Conteúdo é obrigatório');
      return;
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

      const result = await updatePost({
        id: postId,
        title: title.trim(),
        content,
        media_type: mediaType,
        media_url: mediaUrl,
        youtube_url: youtubeUrlFinal,
        instagram_url: instagramUrlFinal,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/perfil');
        router.refresh();
      }
    });
  };

  const mediaTabs: { id: MediaTab; label: string; icon: string; creatorOnly?: boolean }[] = [
    { id: 'none', label: 'Sem mídia', icon: '📝' },
    { id: 'images', label: 'Imagens', icon: '🖼️' },
    { id: 'youtube', label: 'YouTube', icon: '▶️', creatorOnly: true },
    { id: 'instagram', label: 'Instagram', icon: '📸', creatorOnly: true },
  ];

  const filteredTabs = mediaTabs.filter(tab => !tab.creatorOnly || isCreator);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
        <Link
          href="/perfil"
          className="mt-4 inline-block text-purple-600 hover:text-purple-800"
        >
          ← Voltar ao perfil
        </Link>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Editar Post</h1>
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
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
