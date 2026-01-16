'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { getEventById, updateEvent } from '@/actions/events-admin';

type EventType = 'virtual' | 'presencial' | 'hibrido';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditEventPage({ params }: PageProps) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'virtual' as EventType,
    starts_at: '',
    ends_at: '',
    location: '',
    meeting_url: '',
    max_participants: '',
    image_url: '',
    is_active: true,
  });

  // Resolver params e carregar dados
  useEffect(() => {
    async function loadEvent() {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);

      const result = await getEventById(resolvedParams.id);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.data) {
        // Formatar datas para input datetime-local
        const formatDateTime = (dateStr: string | null) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          return date.toISOString().slice(0, 16);
        };

        setFormData({
          title: result.data.title,
          description: result.data.description || '',
          type: result.data.type,
          starts_at: formatDateTime(result.data.starts_at),
          ends_at: formatDateTime(result.data.ends_at),
          location: result.data.location || '',
          meeting_url: result.data.meeting_url || '',
          max_participants: result.data.max_participants?.toString() || '',
          image_url: result.data.image_url || '',
          is_active: result.data.is_active,
        });
      }

      setIsLoading(false);
    }

    loadEvent();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.starts_at) {
      setError('Título e data de início são obrigatórios');
      return;
    }

    if (!eventId) return;

    setIsSaving(true);

    const result = await updateEvent(eventId, {
      title: formData.title,
      description: formData.description || null,
      type: formData.type,
      starts_at: formData.starts_at,
      ends_at: formData.ends_at || null,
      location: formData.location || null,
      meeting_url: formData.meeting_url || null,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
    });

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    router.push('/admin/eventos');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/admin/eventos">
          <Button variant="outline">Voltar</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Evento</h1>
          <p className="text-gray-500 text-sm mt-1">Atualize os dados do evento</p>
        </div>
        <Link href="/admin/eventos">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Evento */}
        <Card className="p-5">
          <h2 className="font-bold text-gray-900 mb-4">Tipo de Evento</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'virtual', label: 'Virtual', icon: '💻', desc: 'Online via vídeo' },
              { value: 'presencial', label: 'Presencial', icon: '📍', desc: 'Encontro físico' },
              { value: 'hibrido', label: 'Híbrido', icon: '🔄', desc: 'Online e presencial' },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.value as EventType })}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  formData.type === type.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <p className="font-medium text-gray-900 mt-1">{type.label}</p>
                <p className="text-xs text-gray-500">{type.desc}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Informações Básicas */}
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Informações Básicas</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Live de Treino Funcional"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o evento..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da Imagem de Capa
            </label>
            <Input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </Card>

        {/* Data e Hora */}
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Data e Hora</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início *</label>
              <Input
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
              <Input
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Local / Link */}
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Local</h2>

          {(formData.type === 'presencial' || formData.type === 'hibrido') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Rua, número, cidade..."
              />
            </div>
          )}

          {(formData.type === 'virtual' || formData.type === 'hibrido') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link da Reunião (Zoom, Meet, etc.)
              </label>
              <Input
                type="url"
                value={formData.meeting_url}
                onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                placeholder="https://zoom.us/..."
              />
            </div>
          )}
        </Card>

        {/* Configurações */}
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Configurações</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número Máximo de Participantes
            </label>
            <Input
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
              onFocus={(e) => e.target.select()}
              placeholder="Deixe vazio para ilimitado"
              min="1"
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
          <Link href="/admin/eventos" className="flex-1">
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
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
