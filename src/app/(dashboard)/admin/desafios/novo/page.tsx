'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { createChallenge, saveChallengePrizes } from '@/actions/challenges-admin';
import { AIDescriptionGenerator } from '@/components/admin/AIDescriptionGenerator';
import { YouTubeVideoPicker, SelectedYouTubeVideo } from '@/components/youtube/YouTubeVideoPicker';
import { PrizeSection } from '@/components/admin/challenges';
import type { PrizeInput } from '@/lib/supabase/types';

type ChallengeType = 'fisico' | 'engajamento' | 'participe' | 'atos_amor';
type GoalType = 'repetitions' | 'time';

export default function NovoChallengeDesafioPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIconCategory, setSelectedIconCategory] = useState('Fitness');
  const [selectedVideo, setSelectedVideo] = useState<SelectedYouTubeVideo | null>(null);
  const [prizes, setPrizes] = useState<PrizeInput[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'fisico' as ChallengeType,
    icon: '💪',
    coins_reward: 10,
    // Campos para engajamento/participe
    instagram_embed_url: '',
    prize_amount: '',
    num_winners: '',
    // Campos para fisico
    goal_type: 'repetitions' as GoalType,
    goal_value: '',
    record_video_url: '',
    hashtag: '',
    profile_to_tag: '',
    // Atos de Amor
    action_instructions: '',
    // Datas
    starts_at: '',
    ends_at: '',
    noEndDate: false, // Desafio permanente/sem data de término
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await createChallenge({
      title: formData.title,
      description: formData.description || null,
      type: formData.type,
      icon: formData.icon,
      coins_reward: formData.coins_reward,
      instagram_embed_url: formData.instagram_embed_url || null,
      prize_amount: formData.prize_amount ? parseFloat(formData.prize_amount) : null,
      num_winners: formData.num_winners ? parseInt(formData.num_winners) : null,
      goal_type: formData.type === 'fisico' ? formData.goal_type : null,
      goal_value: formData.goal_value ? parseInt(formData.goal_value) : null,
      record_video_url: formData.record_video_url || null,
      hashtag: formData.hashtag || null,
      profile_to_tag: formData.profile_to_tag || null,
      action_instructions: formData.type === 'atos_amor' ? formData.action_instructions || null : null,
      starts_at: formData.starts_at || null,
      ends_at: formData.noEndDate ? null : (formData.ends_at || null),
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // Salvar prêmios se houver
    if (prizes.length > 0 && result.data?.id) {
      const prizesResult = await saveChallengePrizes(result.data.id, prizes);
      if (prizesResult.error) {
        console.error('Erro ao salvar prêmios:', prizesResult.error);
        // Não bloquear a criação do desafio por erro nos prêmios
      }
    }

    router.push('/admin/desafios');
    router.refresh();
  };

  const iconCategories: Record<string, string[]> = {
    'Fitness': ['💪', '🏋️', '🏃', '🚴', '🧘', '🤸', '⚡', '🔥', '💯', '🏅', '🥇', '🥈', '🥉', '🎖️'],
    'Amor': ['💝', '❤️', '💕', '💗', '💖', '🫶', '🤝', '🙏', '👴', '👵', '🐕', '🐈', '🌳', '🩸'],
    'Esportes': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🥏', '🏓', '🏸', '🥅', '⛳', '🏒'],
    'Água': ['🏊', '🤽', '🚣', '🏄', '🤿', '🛶', '⛵', '🚤'],
    'Lutas': ['🥊', '🤼', '🥋', '🎿', '⛷️', '🏂', '⛸️', '🧗', '🏇', '🎳', '🛹', '🛼'],
    'Aventura': ['🚶', '🥾', '⛰️', '🏕️', '🌲', '🌊', '☀️', '🌙', '🏔️', '🌋'],
    'Geral': ['🎯', '⭐', '🏆', '🎁', '📸', '🎬', '💬', '🎉', '✨', '👏', '🙌', '🍞'],
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Criar Novo Desafio</h1>
        <p className="text-gray-500 text-sm mt-1">Preencha os campos para criar um novo desafio</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Desafio */}
        <Card className="p-5">
          <h2 className="font-bold text-gray-900 mb-4">Tipo de Desafio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: 'fisico', label: 'Fisico', icon: '💪', desc: 'Exercicios e metas' },
              { value: 'atos_amor', label: 'Atos de Amor', icon: '💝', desc: 'Boas acoes e bondade' },
              { value: 'engajamento', label: 'Engajamento', icon: '💬', desc: 'Comentar/curtir posts' },
              { value: 'participe', label: 'Participe', icon: '🎁', desc: 'Sorteios e prêmios' },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.value as ChallengeType })}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Icone</label>

            {/* Abas de categorias */}
            <div className="flex flex-wrap gap-1 mb-3">
              {Object.keys(iconCategories).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedIconCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedIconCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Grid de ícones da categoria selecionada */}
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
              {iconCategories[selectedIconCategory].map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-all ${
                    formData.icon === icon
                      ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110'
                      : 'bg-white hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Ícone selecionado */}
            <p className="text-sm text-gray-500 mt-2">
              Selecionado: <span className="text-2xl">{formData.icon}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Desafio de Flexoes"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <AIDescriptionGenerator
                challengeData={{
                  title: formData.title,
                  type: formData.type,
                  icon: formData.icon,
                  coinsReward: formData.coins_reward,
                  goalType: formData.goal_type,
                  goalValue: formData.goal_value ? parseInt(formData.goal_value) : null,
                  hashtag: formData.hashtag || undefined,
                  profileToTag: formData.profile_to_tag || undefined,
                  prizeAmount: formData.prize_amount ? parseFloat(formData.prize_amount) : null,
                  numWinners: formData.num_winners ? parseInt(formData.num_winners) : null,
                }}
                onDescriptionGenerated={(description) => setFormData({ ...formData, description })}
              />
            </div>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o desafio..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recompensa em Coracoes *
            </label>
            <Input
              type="number"
              value={formData.coins_reward}
              onChange={(e) => setFormData({ ...formData, coins_reward: parseInt(e.target.value) || 0 })}
              min="0"
              required
            />
          </div>
        </Card>

        {/* Configurações do Sorteio - apenas para engajamento/participe */}
        {(formData.type === 'engajamento' || formData.type === 'participe') && (
          <Card className="p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Configurações do Sorteio</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link do Post no Instagram
              </label>
              <Input
                type="url"
                value={formData.instagram_embed_url}
                onChange={(e) => setFormData({ ...formData, instagram_embed_url: e.target.value })}
                placeholder="https://instagram.com/p/..."
              />
            </div>
          </Card>
        )}

        {/* Prêmios do Desafio - disponível para todos os tipos */}
        <PrizeSection
          prizes={prizes}
          onChange={setPrizes}
          disabled={isLoading}
        />

        {/* Campos especificos para Atos de Amor */}
        {formData.type === 'atos_amor' && (
          <Card className="p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Configurações do Ato de Amor</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instruções do Ato de Amor *
              </label>
              <Textarea
                value={formData.action_instructions}
                onChange={(e) => setFormData({ ...formData, action_instructions: e.target.value })}
                placeholder="Descreva o que a pessoa precisa fazer para completar este ato de amor...&#10;&#10;Exemplo:&#10;• Ajude uma pessoa idosa a carregar sacolas&#10;• Grave um vídeo mostrando a ação&#10;• Poste no YouTube com o vídeo público"
                rows={5}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Estas instruções aparecerão para o usuário no momento de participar do desafio.
              </p>
            </div>

            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <p className="text-sm text-rose-700">
                <strong>Como funciona:</strong> O usuário fará o ato de amor, gravará um vídeo,
                postará no YouTube e enviará o link. A IA irá assistir o vídeo e validar
                automaticamente se o ato foi realizado.
              </p>
            </div>
          </Card>
        )}

        {/* Campos especificos para Fisico */}
        {formData.type === 'fisico' && (
          <Card className="p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Configurações do Desafio Fisico</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Meta</label>
                <select
                  value={formData.goal_type}
                  onChange={(e) => setFormData({ ...formData, goal_type: e.target.value as GoalType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="repetitions">Repeticoes</option>
                  <option value="time">Tempo (segundos)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Meta</label>
                <Input
                  type="number"
                  value={formData.goal_value}
                  onChange={(e) => setFormData({ ...formData, goal_value: e.target.value })}
                  placeholder={formData.goal_type === 'time' ? '60' : '50'}
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link do Video de Recorde (opcional)
              </label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={formData.record_video_url}
                  onChange={(e) => setFormData({ ...formData, record_video_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                  className="flex-1"
                />
                <YouTubeVideoPicker
                  onSelect={(video) => {
                    setFormData({ ...formData, record_video_url: video.url });
                    setSelectedVideo(video);
                  }}
                />
              </div>
              {selectedVideo && (
                <div className="mt-2 flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <img
                    src={`https://i.ytimg.com/vi/${selectedVideo.url.match(/[?&]v=([^&]+)/)?.[1]}/mqdefault.jpg`}
                    alt={selectedVideo.title}
                    className="w-24 h-14 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedVideo.title}
                    </p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Video selecionado
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hashtag</label>
                <Input
                  value={formData.hashtag}
                  onChange={(e) => setFormData({ ...formData, hashtag: e.target.value })}
                  placeholder="#DesafioFitness"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil para Marcar</label>
                <Input
                  value={formData.profile_to_tag}
                  onChange={(e) => setFormData({ ...formData, profile_to_tag: e.target.value })}
                  placeholder="@perfil"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Datas */}
        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Periodo de Validade (opcional)</h2>

          {/* Opção de desafio permanente */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.noEndDate}
              onChange={(e) => setFormData({
                ...formData,
                noEndDate: e.target.checked,
                starts_at: e.target.checked ? '' : formData.starts_at,
                ends_at: e.target.checked ? '' : formData.ends_at,
              })}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Desafio permanente</span>
              <p className="text-xs text-gray-500">Sem data de início ou término</p>
            </div>
          </label>

          {!formData.noEndDate && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                <Input
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Término</label>
                <Input
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>
            </div>
          )}

          {formData.noEndDate && (
            <div className="p-3 bg-green-50 rounded-lg text-green-700 text-sm">
              ✓ Este desafio estará sempre ativo, sem limite de datas.
            </div>
          )}
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
            {isLoading ? 'Criando...' : 'Criar Desafio'}
          </Button>
        </div>
      </form>
    </div>
  );
}
