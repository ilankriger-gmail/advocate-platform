'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Button, Input, Textarea, DateRangePicker } from '@/components/ui';
import { updateChallenge, getChallengeForEdit, updateChallengeThumbnail, getChallengePrizes, saveChallengePrizes } from '@/actions/challenges-admin';
import { AIDescriptionGenerator } from '@/components/admin/AIDescriptionGenerator';
import { YouTubeVideoPicker, SelectedYouTubeVideo } from '@/components/youtube/YouTubeVideoPicker';
import { PrizeSection } from '@/components/admin/challenges';
import type { PrizeInput } from '@/lib/supabase/types';

type ChallengeType = 'fisico' | 'engajamento' | 'participe' | 'atos_amor';
type GoalType = 'repetitions' | 'time';

export default function EditarDesafioPage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIconCategory, setSelectedIconCategory] = useState('Fitness');
  const [selectedVideo, setSelectedVideo] = useState<SelectedYouTubeVideo | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isSavingThumbnail, setIsSavingThumbnail] = useState(false);
  const [prizes, setPrizes] = useState<PrizeInput[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'fisico' as ChallengeType,
    icon: '💪',
    coins_reward: 10,
    prize_amount: '',
    num_winners: '',
    instagram_embed_url: '',
    goal_type: 'repetitions' as GoalType,
    goal_value: '',
    record_video_url: '',
    hashtag: '',
    profile_to_tag: '',
    starts_at: '',
    ends_at: '',
    noEndDate: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadChallenge() {
      if (!challengeId) {
        setError('ID do desafio não fornecido');
        setIsLoadingData(false);
        return;
      }

      try {
        const result = await getChallengeForEdit(challengeId);

        if (!isMounted) return;

        if (result.error || !result.data) {
          setError(result.error || 'Desafio não encontrado');
          setIsLoadingData(false);
          return;
        }

        const challenge = result.data;

        setFormData({
          title: challenge.title || '',
          description: challenge.description || '',
          type: challenge.type as ChallengeType,
          icon: challenge.icon || '💪',
          coins_reward: challenge.coins_reward || 10,
          prize_amount: challenge.prize_amount ? String(challenge.prize_amount) : '',
          num_winners: challenge.num_winners ? String(challenge.num_winners) : '',
          instagram_embed_url: challenge.instagram_embed_url || '',
          goal_type: (challenge.goal_type as GoalType) || 'repetitions',
          goal_value: challenge.goal_value ? String(challenge.goal_value) : '',
          record_video_url: challenge.record_video_url || '',
          hashtag: challenge.hashtag || '',
          profile_to_tag: challenge.profile_to_tag || '',
          starts_at: challenge.starts_at ? challenge.starts_at.slice(0, 16) : '',
          ends_at: challenge.ends_at ? challenge.ends_at.slice(0, 16) : '',
          noEndDate: !challenge.ends_at,
        });

        if (challenge.record_video_url) {
          const videoId = challenge.record_video_url.match(/[?&]v=([^&]+)/)?.[1];
          if (videoId) {
            setSelectedVideo({
              url: challenge.record_video_url,
              title: 'Vídeo atual',
              thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            });
          }
        }

        setThumbnailUrl(challenge.thumbnail_url || '');

        const prizesResult = await getChallengePrizes(challengeId);
        if (prizesResult.data && isMounted) {
          setPrizes(prizesResult.data.map(p => ({
            type: p.type,
            name: p.name,
            description: p.description || undefined,
            value: p.value || undefined,
            quantity: p.quantity,
            image_url: p.image_url || undefined,
          })));
        }

        setIsLoadingData(false);
      } catch {
        if (isMounted) {
          setError('Erro ao carregar desafio');
          setIsLoadingData(false);
        }
      }
    }

    loadChallenge();

    return () => {
      isMounted = false;
    };
  }, [challengeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await updateChallenge(challengeId, {
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
      starts_at: formData.starts_at || null,
      ends_at: formData.noEndDate ? null : (formData.ends_at || null),
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    const prizesResult = await saveChallengePrizes(challengeId, prizes);
    if (prizesResult.error) {
      console.error('Erro ao salvar prêmios:', prizesResult.error);
      setError('Erro ao salvar prêmios: ' + prizesResult.error);
      setIsLoading(false);
      return;
    }

    router.push('/admin/desafios');
    router.refresh();
  };

  const handleSaveThumbnail = async () => {
    if (!thumbnailUrl.trim()) return;

    setIsSavingThumbnail(true);
    try {
      const result = await updateChallengeThumbnail(challengeId, thumbnailUrl.trim());
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError('Erro ao salvar thumbnail');
    }
    setIsSavingThumbnail(false);
  };

  const handleRemoveThumbnail = async () => {
    setIsSavingThumbnail(true);
    try {
      const result = await updateChallengeThumbnail(challengeId, null);
      if (result.error) {
        setError(result.error);
      } else {
        setThumbnailUrl('');
      }
    } catch {
      setError('Erro ao remover thumbnail');
    }
    setIsSavingThumbnail(false);
  };

  const iconCategories: Record<string, string[]> = {
    'Fitness': ['💪', '🏋️', '🏋️‍♀️', '🏃', '🏃‍♀️', '🚴', '🚴‍♀️', '🧘', '🧘‍♀️', '🤸', '🤸‍♀️', '⚡', '🔥', '💯', '🏅', '🥇', '🥈', '🥉', '🎖️', '🦾', '💓', '🫀'],
    'Amor': ['💝', '❤️', '💕', '💗', '💖', '🫶', '🤝', '🙏', '👴', '👵', '🐕', '🐈', '🌳', '🩸', '🤲', '💞', '💘', '🥰', '😇', '👼', '🕊️', '🌹', '💐', '🎀'],
    'Esportes': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🥏', '🏓', '🏸', '🥅', '⛳', '🏒', '🥍', '🏑', '🥎', '🏏', '🎯'],
    'Água': ['🏊', '🏊‍♀️', '🤽', '🤽‍♀️', '🚣', '🚣‍♀️', '🏄', '🏄‍♀️', '🤿', '🛶', '⛵', '🚤', '🌊', '🐠', '🐬', '🐳', '🦈'],
    'Lutas': ['🥊', '🤼', '🤼‍♀️', '🥋', '🎿', '⛷️', '🏂', '⛸️', '🧗', '🧗‍♀️', '🏇', '🎳', '🛹', '🛼', '🤺'],
    'Aventura': ['🚶', '🚶‍♀️', '🥾', '⛰️', '🏕️', '🌲', '🌊', '☀️', '🌙', '🏔️', '🌋', '🏜️', '🗻', '🌄', '🌅', '🌠', '🏞️', '🎪'],
    'Comida': ['🍎', '🍊', '🍋', '🍌', '🥑', '🥦', '🥕', '🥗', '🍳', '🥚', '🍞', '🥛', '🧃', '💧', '🍵', '🥤', '🍽️'],
    'Animais': ['🐕', '🐈', '🐦', '🐠', '🐢', '🐰', '🦁', '🐻', '🦊', '🦋', '🐝', '🦅', '🦉', '🐴', '🦒', '🐘', '🦏'],
    'Prêmios': ['🏆', '🎁', '💰', '💵', '💎', '👑', '🎉', '🎊', '🎈', '🎀', '🎗️', '🏅', '🥇', '🎫', '🎟️', '💳'],
    'Geral': ['🎯', '⭐', '✨', '📸', '🎬', '💬', '👏', '🙌', '👍', '✅', '❤️‍🔥', '🔔', '📣', '📢', '🎤', '📱', '💻', '🎮'],
  };

  if (isLoadingData) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Carregando desafio...</p>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-red-500 text-6xl mb-4">!</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Erro</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push('/admin/desafios')}>
          Voltar para Desafios
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Desafio</h1>
        <p className="text-gray-500 text-sm mt-1">Altere os campos para atualizar o desafio</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5">
          <h2 className="font-bold text-gray-900 mb-4">Tipo de Desafio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: 'fisico', label: 'Físico', icon: '💪', desc: 'Exercícios e metas' },
              { value: 'atos_amor', label: 'Atos de Amor', icon: '💝', desc: 'Boas ações' },
              { value: 'engajamento', label: 'Engajamento', icon: '💬', desc: 'Comentar/curtir' },
              { value: 'participe', label: 'Participe', icon: '🎁', desc: 'Sorteios' },
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

        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Informações Básicas</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>

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

            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
              {iconCategories[selectedIconCategory].map((icon, idx) => (
                <button
                  key={`${icon}-${idx}`}
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

            <p className="text-sm text-gray-500 mt-2">
              Selecionado: <span className="text-2xl">{formData.icon}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Desafio de Flexões"
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
              Recompensa em Corações *
            </label>
            <Input
              type="number"
              value={formData.coins_reward}
              onChange={(e) => setFormData({ ...formData, coins_reward: parseInt(e.target.value) || 0 })}
              onFocus={(e) => e.target.select()}
              placeholder="10"
              min="0"
              required
            />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Imagem do Desafio (opcional)</h2>
          <p className="text-sm text-gray-500">
            Cole a URL de uma imagem para usar como thumbnail do desafio.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
            <div className="flex gap-2">
              <Input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveThumbnail}
                disabled={isSavingThumbnail || !thumbnailUrl.trim()}
              >
                {isSavingThumbnail ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          {thumbnailUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Preview:</p>
              <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={thumbnailUrl}
                  alt="Preview da thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveThumbnail}
                disabled={isSavingThumbnail}
                className="text-red-600 hover:text-red-700"
              >
                Remover Imagem
              </Button>
            </div>
          )}
        </Card>

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

        <PrizeSection
          prizes={prizes}
          onChange={setPrizes}
          disabled={isLoading}
        />

        {formData.type === 'fisico' && (
          <Card className="p-5 space-y-4">
            <h2 className="font-bold text-gray-900">Configurações do Desafio Físico</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Meta</label>
                <select
                  value={formData.goal_type}
                  onChange={(e) => setFormData({ ...formData, goal_type: e.target.value as GoalType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="repetitions">Repetições</option>
                  <option value="time">Tempo (segundos)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Meta</label>
                <Input
                  type="number"
                  value={formData.goal_value}
                  onChange={(e) => setFormData({ ...formData, goal_value: e.target.value })}
                  onFocus={(e) => e.target.select()}
                  placeholder={formData.goal_type === 'time' ? '60' : '50'}
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link do Vídeo no YouTube *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Obrigatório - Este vídeo será exibido para os participantes
              </p>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={formData.record_video_url}
                  onChange={(e) => setFormData({ ...formData, record_video_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                  className="flex-1"
                  required
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
                      Vídeo selecionado
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link do Vídeo no Instagram (opcional)
              </label>
              <Input
                type="url"
                value={formData.instagram_embed_url}
                onChange={(e) => setFormData({ ...formData, instagram_embed_url: e.target.value })}
                placeholder="https://instagram.com/reel/..."
              />
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

        <Card className="p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Período de Validade</h2>

          {/* Data de Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Início
            </label>
            <Input
              type="datetime-local"
              value={formData.starts_at ? formData.starts_at.slice(0, 16) : ''}
              onChange={(e) => setFormData({
                ...formData,
                starts_at: e.target.value ? new Date(e.target.value).toISOString() : '',
              })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Deixe em branco para iniciar imediatamente
            </p>
          </div>

          {/* Data de Fim com checkbox */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.noEndDate}
                onChange={(e) => setFormData({
                  ...formData,
                  noEndDate: e.target.checked,
                  ends_at: e.target.checked ? '' : formData.ends_at,
                })}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Sem data de término</span>
                <p className="text-xs text-gray-500">O desafio fica ativo até você encerrar manualmente</p>
              </div>
            </label>

            {!formData.noEndDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Término
                </label>
                <Input
                  type="datetime-local"
                  value={formData.ends_at ? formData.ends_at.slice(0, 16) : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    ends_at: e.target.value ? new Date(e.target.value).toISOString() : '',
                  })}
                  min={formData.starts_at ? formData.starts_at.slice(0, 16) : undefined}
                />
              </div>
            )}
          </div>

          {formData.noEndDate && (
            <div className="p-3 bg-amber-50 rounded-lg text-amber-700 text-sm flex items-center gap-2">
              <span className="text-lg">⏳</span>
              Este desafio pode acabar a qualquer momento. Você controla quando encerrar.
            </div>
          )}
        </Card>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

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
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
