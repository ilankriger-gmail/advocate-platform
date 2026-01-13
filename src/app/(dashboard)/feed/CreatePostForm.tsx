'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Button, Textarea, Input, Select } from '@/components/ui';
import { useToastHelpers } from '@/components/ui/Toast';
import { usePosts } from '@/hooks';

interface CreatePostFormProps {
  onHelpRequestCreated?: () => void;
}

export function CreatePostForm({ onHelpRequestCreated }: CreatePostFormProps) {
  const { create, isPending, error } = usePosts();
  const toast = useToastHelpers();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelpRequestAlert, setShowHelpRequestAlert] = useState(false);
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
        // Mostrar alerta especial para pedido de ajuda
        setFormData({ title: '', content: '', media_url: '', type: 'community' });
        setIsExpanded(false);
        setShowHelpRequestAlert(true);
        // Notificar o componente pai para mudar para a aba de ajuda
        onHelpRequestCreated?.();
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

  // Alerta especial para pedidos de ajuda
  if (showHelpRequestAlert) {
    return (
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-full flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900">Pedido de Ajuda Publicado!</h3>
            <p className="text-blue-700 mt-1">
              Identificamos que sua publicação é um pedido de ajuda. Ela aparecerá na <strong>Comunidade</strong> e também tem uma aba especial dedicada a conectar quem precisa com quem pode ajudar.
            </p>
            <div className="mt-4 p-3 bg-white/60 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confira a aba <strong>&quot;Pedidos de Ajuda&quot;</strong> para ver outros pedidos da comunidade
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowHelpRequestAlert(false);
                  onHelpRequestCreated?.();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ver aba Pedidos de Ajuda
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelpRequestAlert(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

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
