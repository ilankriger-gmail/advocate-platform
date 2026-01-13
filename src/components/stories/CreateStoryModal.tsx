'use client';

import { useState } from 'react';
import { X, ImageIcon, Youtube, Instagram, LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import MediaUploader from '@/components/posts/MediaUploader';
import { YouTubeVideoPicker, SelectedYouTubeVideo } from '@/components/youtube/YouTubeVideoPicker';
import InstagramInput from '@/components/posts/InstagramInput';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { ContentPicker } from './ContentPicker';
import { createStory } from '@/actions/stories';
import { LinkedContent } from '@/types/story';

interface CreateStoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type MediaTab = 'images' | 'youtube' | 'instagram' | 'content';

const tabs: { id: MediaTab; label: string; icon: React.ReactNode }[] = [
  { id: 'images', label: 'Imagens', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
  { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
  { id: 'content', label: 'Conteúdo', icon: <LinkIcon className="w-4 h-4" /> },
];

export function CreateStoryModal({ onClose, onSuccess }: CreateStoryModalProps) {
  // Estado do form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');

  // Estado de mídia
  const [mediaTab, setMediaTab] = useState<MediaTab>('images');
  const [images, setImages] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedYoutubeVideo, setSelectedYoutubeVideo] = useState<SelectedYouTubeVideo | null>(null);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedContent, setLinkedContent] = useState<LinkedContent | null>(null);

  // Estado do form
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validação - deve ter alguma mídia ou conteúdo vinculado
  const hasImages = images.length > 0;
  const hasYoutube = youtubeUrl.trim() !== '';
  const hasInstagram = instagramUrl.trim() !== '';
  const hasLinkedContent = linkedContent !== null;
  const hasMedia = hasImages || hasYoutube || hasInstagram || hasLinkedContent;

  // Limpar outras mídias ao trocar de tab
  const handleTabChange = (tab: MediaTab) => {
    setMediaTab(tab);
    // Limpar mídias das outras tabs
    if (tab !== 'images') setImages([]);
    if (tab !== 'youtube') {
      setYoutubeUrl('');
      setSelectedYoutubeVideo(null);
    }
    if (tab !== 'instagram') setInstagramUrl('');
    if (tab !== 'content') setLinkedContent(null);
    setError(null);
  };

  // Handler para seleção de vídeo do YouTube
  const handleYoutubeSelect = (video: SelectedYouTubeVideo) => {
    setYoutubeUrl(video.url);
    setSelectedYoutubeVideo(video);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMedia) {
      setError('Adicione pelo menos uma mídia (imagem, YouTube, Instagram ou conteúdo)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Determinar tipo de mídia
      let mediaType: 'image' | 'carousel' | 'youtube' | 'instagram' = 'image';
      if (hasYoutube) {
        mediaType = 'youtube';
      } else if (hasInstagram) {
        mediaType = 'instagram';
      } else if (images.length > 1) {
        mediaType = 'carousel';
      }

      // Se tem conteúdo vinculado mas não tem mídia, usar imagem do conteúdo
      let finalImages = hasImages ? images : undefined;
      if (hasLinkedContent && !hasImages && !hasYoutube && !hasInstagram) {
        // Usar imagem do conteúdo vinculado se disponível
        if (linkedContent?.image) {
          finalImages = [linkedContent.image];
          mediaType = 'image';
        }
      }

      const result = await createStory({
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        media_url: finalImages,
        media_type: mediaType,
        youtube_url: hasYoutube ? youtubeUrl : undefined,
        instagram_url: hasInstagram ? instagramUrl : undefined,
        caption: caption.trim() || undefined,
        linked_content_type: linkedContent?.type,
        linked_content_id: linkedContent?.id,
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
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-lg font-semibold">Criar Story</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Título opcional */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Título <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dê um título ao seu story"
              maxLength={100}
              disabled={submitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-60"
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/100 caracteres
            </p>
          </div>

          {/* Conteúdo rico opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conteúdo <span className="text-gray-400">(opcional)</span>
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Escreva o conteúdo do seu story..."
              disabled={submitting}
              disableLinks={false}
            />
          </div>

          {/* Tabs de mídia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mídia <span className="text-red-500">*</span>
            </label>

            {/* Tab buttons */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  disabled={submitting}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mediaTab === tab.id
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  } disabled:opacity-60`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="min-h-[200px]">
              {mediaTab === 'images' && (
                <MediaUploader
                  images={images}
                  onChange={setImages}
                  maxImages={10}
                  disabled={submitting}
                />
              )}

              {mediaTab === 'youtube' && (
                <div className="space-y-4">
                  <YouTubeVideoPicker onSelect={handleYoutubeSelect} />

                  {/* Preview do vídeo selecionado */}
                  {selectedYoutubeVideo && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-600 font-medium mb-2">Vídeo selecionado:</p>
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedYoutubeVideo.thumbnail}
                          alt={selectedYoutubeVideo.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                          {selectedYoutubeVideo.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setYoutubeUrl('');
                            setSelectedYoutubeVideo(null);
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mediaTab === 'instagram' && (
                <InstagramInput
                  value={instagramUrl}
                  onChange={setInstagramUrl}
                  disabled={submitting}
                />
              )}

              {mediaTab === 'content' && (
                <ContentPicker
                  onSelect={setLinkedContent}
                  selectedContent={linkedContent}
                />
              )}
            </div>
          </div>

          {/* Caption opcional */}
          <div>
            <label
              htmlFor="caption"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Legenda curta <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Uma breve legenda para exibir sobre a mídia..."
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
              disabled={submitting || !hasMedia}
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
