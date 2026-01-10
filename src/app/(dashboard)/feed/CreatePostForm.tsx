'use client';

import { useState } from 'react';
import { Card, Button, Textarea, Input, Select } from '@/components/ui';
import { useToastHelpers } from '@/components/ui/Toast';
import { usePosts } from '@/hooks';

export function CreatePostForm() {
  const { create, isPending, error } = usePosts();
  const toast = useToastHelpers();
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    media_url: '',
    type: 'community' as 'creator' | 'community',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await create({
      title: formData.title,
      content: formData.content,
      media_url: formData.media_url ? [formData.media_url] : undefined,
      type: formData.type,
    });

    if (result.success) {
      // Mostrar toast baseado no status de moderação
      if (result.moderationStatus === 'blocked') {
        toast.error(
          'Publicação não permitida',
          result.message || 'Conteúdo viola nossas diretrizes.'
        );
      } else if (result.contentCategory === 'help_request') {
        toast.info(
          'Pedido de Ajuda',
          'Sua publicação aparecerá na aba "Pedidos de Ajuda" do feed.'
        );
        setFormData({ title: '', content: '', media_url: '', type: 'community' });
        setIsExpanded(false);
      } else if (result.moderationStatus === 'pending_review') {
        toast.info(
          'Em revisão',
          result.message || 'Sua publicação será analisada e publicada em breve.'
        );
        setFormData({ title: '', content: '', media_url: '', type: 'community' });
        setIsExpanded(false);
      } else {
        toast.success('Publicado!', 'Sua publicação foi criada com sucesso.');
        setFormData({ title: '', content: '', media_url: '', type: 'community' });
        setIsExpanded(false);
      }
    } else if (result.error) {
      toast.error('Erro', result.error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isExpanded) {
    return (
      <Card
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-gray-500">Criar um novo post...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Criar Post</h3>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Input
          label="Título"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Título do seu post"
          required
        />

        <Textarea
          label="Conteúdo"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={4}
          placeholder="O que você quer compartilhar?"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Post"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={[
              { value: 'community', label: 'Comunidade' },
              { value: 'creator', label: 'Criador' },
            ]}
          />

          <Input
            label="URL da Mídia"
            name="media_url"
            value={formData.media_url}
            onChange={handleChange}
            placeholder="https://..."
            hint="Opcional"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExpanded(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isPending || !formData.title || !formData.content}
          >
            {isPending ? 'Publicando...' : 'Publicar'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
