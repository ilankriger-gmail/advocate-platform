'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { createEvent } from '@/actions/events-admin';

type EventType = 'virtual' | 'presencial' | 'hibrido';

export default function NovoEventoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.starts_at) {
      setError('Titulo e data de inicio sao obrigatorios');
      return;
    }

    setIsLoading(true);

    const result = await createEvent({
      title: formData.title,
      description: formData.description || null,
      type: formData.type,
      starts_at: formData.starts_at,
      ends_at: formData.ends_at || null,
      location: formData.location || null,
      meeting_url: formData.meeting_url || null,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      image_url: formData.image_url || null,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.push('/admin/eventos');
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Criar Novo Evento</h1>
        <p className="text-gray-500 text-sm mt-1">Preencha os campos para criar um novo evento</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Evento */}
        <Card className="p-5">
          <h2 className="font-bold text-gray-900 mb-4">Tipo de Evento</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'virtual', label: 'Virtual', icon: '💻', desc: 'Online via video' },
              { value: 'presencial', label: 'Presencial', icon: '📍', desc: 'Encontro fisico' },
              { value: 'hibrido', label: 'Hibrido', icon: '🔄', desc: 'Online e presencial' },
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

        {/* Informacoes Basicas */}
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Informacoes Basicas</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Live de Treino Funcional"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
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
        </Card>

        {/* Data e Hora */}
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Data e Hora</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio *</label>
              <Input
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Termino</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereco</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Rua, numero, cidade..."
              />
            </div>
          )}

          {(formData.type === 'virtual' || formData.type === 'hibrido') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link da Reuniao (Zoom, Meet, etc.)
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

        {/* Configuracoes */}
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Configuracoes</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numero Maximo de Participantes
            </label>
            <Input
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
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
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Criando...' : 'Criar Evento'}
          </Button>
        </div>
      </form>
    </div>
  );
}
