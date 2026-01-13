'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import MediaUploader from '@/components/posts/MediaUploader';
import { createStory } from '@/actions/stories';

interface CreateStoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStoryModal({ onClose, onSuccess }: CreateStoryModalProps) {
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      setError('Adicione pelo menos uma imagem');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await createStory({
        media_url: images,
        media_type: images.length > 1 ? 'carousel' : 'image',
        caption: caption.trim() || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    } catch {
      setError('Erro ao criar story');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-semibold">Criar Story</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Upload de imagens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagens
            </label>
            <MediaUploader
              images={images}
              onChange={setImages}
              maxImages={10}
              disabled={submitting}
            />
          </div>

          {/* Caption opcional */}
          <div>
            <label
              htmlFor="caption"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Legenda (opcional)
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicione uma legenda..."
              maxLength={200}
              rows={2}
              disabled={submitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none disabled:opacity-60"
            />
            <p className="text-xs text-gray-500 mt-1">
              {caption.length}/200 caracteres
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || images.length === 0}
              className="flex-1"
            >
              {submitting ? 'Publicando...' : 'Publicar Story'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
