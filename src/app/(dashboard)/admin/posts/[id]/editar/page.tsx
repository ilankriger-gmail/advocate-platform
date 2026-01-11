'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { getPostById, updatePost } from '@/actions/posts';

type PostType = 'testimony' | 'result' | 'tip';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: PageProps) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'testimony' as PostType,
    media_url: [] as string[],
    youtube_url: '',
    instagram_url: '',
  });

  // Resolver params e carregar dados
  useEffect(() => {
    async function loadPost() {
      const resolvedParams = await params;
      setPostId(resolvedParams.id);

      const result = await getPostById(resolvedParams.id);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.data) {
        setFormData({
          title: result.data.title || '',
          content: result.data.content || '',
          type: (result.data.type as PostType) || 'testimony',
          media_url: result.data.media_url || [],
          youtube_url: result.data.youtube_url || '',
          instagram_url: result.data.instagram_url || '',
        });
      }

      setIsLoading(false);
    }

    loadPost();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() && !formData.content.trim()) {
      setError('Titulo ou conteudo sao obrigatorios');
      return;
    }

    if (!postId) return;

    setIsSaving(true);

    const result = await updatePost({
      id: postId,
      title: formData.title || undefined,
      content: formData.content || undefined,
      media_url: formData.media_url.length > 0 ? formData.media_url : undefined,
      youtube_url: formData.youtube_url || undefined,
      instagram_url: formData.instagram_url || undefined,
    });

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    router.push('/admin/posts');
  };

  const getTypeBadge = (type: PostType) => {
    switch (type) {
      case 'testimony':
        return { label: 'Depoimento', color: 'bg-pink-100 text-pink-700' };
      case 'result':
        return { label: 'Resultado', color: 'bg-green-100 text-green-700' };
      case 'tip':
        return { label: 'Dica', color: 'bg-blue-100 text-blue-700' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-700' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !formData.title && !formData.content) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/admin/posts">
          <Button variant="outline">Voltar</Button>
        </Link>
      </Card>
    );
  }

  const typeBadge = getTypeBadge(formData.type);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Post</h1>
          <p className="text-gray-500 text-sm mt-1">Atualize o conteudo do post</p>
        </div>
        <Link href="/admin/posts">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo do Post (somente leitura) */}
        <Card className="p-5">
          <h2 className="font-bold text-gray-900 mb-4">Tipo do Post</h2>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${typeBadge.color}`}>
            {typeBadge.label}
          </div>
          <p className="text-xs text-gray-500 mt-2">O tipo do post nao pode ser alterado</p>
        </Card>

        {/* Conteudo */}
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Conteudo</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titulo do post (opcional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conteudo</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Escreva o conteudo do post..."
              rows={6}
            />
          </div>
        </Card>

        {/* Midias (somente visualizacao) */}
        {formData.media_url && formData.media_url.length > 0 && (
          <Card className="p-5">
            <h2 className="font-bold text-gray-900 mb-4">Imagens</h2>
            <div className="grid grid-cols-2 gap-2">
              {formData.media_url.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Para alterar imagens, crie um novo post</p>
          </Card>
        )}

        {/* Links de Midia */}
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Links de Midia</h2>
          <p className="text-xs text-gray-500">Apenas criadores podem usar embeds</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
            <Input
              type="url"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
            <Input
              type="url"
              value={formData.instagram_url}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              placeholder="https://instagram.com/p/..."
            />
          </div>
        </Card>

        {/* Erro */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Botoes */}
        <div className="flex gap-3">
          <Link href="/admin/posts" className="flex-1">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              className="w-full"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alteracoes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
