'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2, Link2, Image as ImageIcon, Tag } from 'lucide-react';

export function NewCampaignButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    original_url: '',
    image_card: '',
    image_square: '',
    image_horizontal: '',
    image_vertical: '',
    cta_text: 'Ajudar agora',
    tags: '',
    priority: 0,
  });

  // Tentar extrair dados da URL
  const scrapeUrl = async () => {
    if (!formData.original_url) return;
    
    setScraping(true);
    setError(null);
    
    try {
      // Faz fetch via API route para evitar CORS
      const res = await fetch('/api/admin/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.original_url }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          name: data.title || prev.name,
          description: data.description || prev.description,
          image_card: data.image || prev.image_card,
          image_square: data.image || prev.image_square,
        }));
      }
    } catch (err) {
      console.error('Erro ao extrair dados:', err);
    }
    
    setScraping(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    
    const { error: insertError } = await supabase.from('ad_campaigns').insert({
      name: formData.name,
      description: formData.description || null,
      original_url: formData.original_url,
      image_card: formData.image_card || null,
      image_square: formData.image_square || null,
      image_horizontal: formData.image_horizontal || null,
      image_vertical: formData.image_vertical || null,
      cta_text: formData.cta_text,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim().toLowerCase()) : [],
      priority: formData.priority,
      is_active: true,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setIsOpen(false);
    setFormData({
      name: '',
      description: '',
      original_url: '',
      image_card: '',
      image_square: '',
      image_horizontal: '',
      image_vertical: '',
      cta_text: 'Ajudar agora',
      tags: '',
      priority: 0,
    });
    router.refresh();
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Nova Campanha
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Nova Campanha</h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL da campanha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Link2 className="w-4 h-4 inline mr-1" />
                URL da Campanha (Link do Bem)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.original_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, original_url: e.target.value }))}
                  placeholder="https://linkdobem.org/campanha..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={scrapeUrl}
                  disabled={scraping || !formData.original_url}
                >
                  {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔍 Extrair'}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                UTM será adicionado automaticamente: ?utm_source=site_teamo_MAIS
              </p>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Campanha
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Ajude o Isaías a ganhar 10 mil"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descrição da campanha..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Imagens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Imagens dos Banners
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Card/Feed (4:3)</label>
                  <input
                    type="url"
                    value={formData.image_card}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_card: e.target.value }))}
                    placeholder="URL da imagem"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Quadrado (1:1)</label>
                  <input
                    type="url"
                    value={formData.image_square}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_square: e.target.value }))}
                    placeholder="URL da imagem"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Horizontal (16:9)</label>
                  <input
                    type="url"
                    value={formData.image_horizontal}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_horizontal: e.target.value }))}
                    placeholder="URL da imagem"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Vertical (9:16)</label>
                  <input
                    type="url"
                    value={formData.image_vertical}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_vertical: e.target.value }))}
                    placeholder="URL da imagem"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              {/* Preview */}
              {formData.image_card && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <img 
                    src={formData.image_card} 
                    alt="Preview" 
                    className="max-h-40 rounded-lg"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>

            {/* CTA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto do Botão (CTA)
              </label>
              <input
                type="text"
                value={formData.cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                placeholder="Ex: Ajudar agora"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags (para matching com conteúdo)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="familia, crianca, saude (separadas por vírgula)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Banners serão exibidos em contextos relacionados a essas tags
              </p>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade (maior = mais exibido)
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                min={0}
                max={100}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Campanha
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
