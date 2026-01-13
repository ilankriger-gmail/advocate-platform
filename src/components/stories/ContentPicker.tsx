'use client';

import { useState, useEffect } from 'react';
import { Button, Skeleton } from '@/components/ui';
import { LinkedContentType, LinkedContent } from '@/types/story';
import { createClient } from '@/lib/supabase/client';

interface ContentPickerProps {
  onSelect: (content: LinkedContent) => void;
  selectedContent?: LinkedContent | null;
}

type ContentTab = 'challenges' | 'rewards' | 'ranking';

interface Challenge {
  id: string;
  title: string;
  thumbnail_url: string | null;
  icon: string;
  coins_reward: number;
}

interface Reward {
  id: string;
  name: string;
  image_url: string | null;
  coins_required: number;
}

export function ContentPicker({ onSelect, selectedContent }: ContentPickerProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>('challenges');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  const loadContent = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      if (activeTab === 'challenges') {
        const { data } = await supabase
          .from('challenges')
          .select('id, title, thumbnail_url, icon, coins_reward')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);
        setChallenges(data || []);
      } else if (activeTab === 'rewards') {
        const { data } = await supabase
          .from('rewards')
          .select('id, name, image_url, coins_required')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);
        setRewards(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChallenge = (challenge: Challenge) => {
    onSelect({
      type: 'challenge',
      id: challenge.id,
      title: challenge.title,
      image: challenge.thumbnail_url || undefined,
      subtitle: `${challenge.coins_reward} coins`,
    });
  };

  const handleSelectReward = (reward: Reward) => {
    onSelect({
      type: 'reward',
      id: reward.id,
      title: reward.name,
      image: reward.image_url || undefined,
      subtitle: `${reward.coins_required} coins`,
    });
  };

  const handleSelectRanking = () => {
    onSelect({
      type: 'ranking',
      id: 'ranking',
      title: 'Ranking',
      subtitle: 'Ver posições',
    });
  };

  const tabs: { key: ContentTab; label: string; icon: string }[] = [
    { key: 'challenges', label: 'Desafios', icon: '🏆' },
    { key: 'rewards', label: 'Prêmios', icon: '🎁' },
    { key: 'ranking', label: 'Ranking', icon: '📊' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Vincule um conteúdo da plataforma ao seu story
      </p>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : activeTab === 'challenges' ? (
          <div className="grid grid-cols-2 gap-3">
            {challenges.length === 0 ? (
              <p className="col-span-2 text-center text-gray-500 py-8">
                Nenhum desafio ativo encontrado
              </p>
            ) : (
              challenges.map((challenge) => (
                <button
                  key={challenge.id}
                  onClick={() => handleSelectChallenge(challenge)}
                  className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                    selectedContent?.id === challenge.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{challenge.icon}</span>
                    <span className="text-xs text-purple-600 font-medium">
                      {challenge.coins_reward} coins
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {challenge.title}
                  </p>
                </button>
              ))
            )}
          </div>
        ) : activeTab === 'rewards' ? (
          <div className="grid grid-cols-2 gap-3">
            {rewards.length === 0 ? (
              <p className="col-span-2 text-center text-gray-500 py-8">
                Nenhum prêmio ativo encontrado
              </p>
            ) : (
              rewards.map((reward) => (
                <button
                  key={reward.id}
                  onClick={() => handleSelectReward(reward)}
                  className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                    selectedContent?.id === reward.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {reward.image_url && (
                    <img
                      src={reward.image_url}
                      alt={reward.name}
                      className="w-full h-16 object-cover rounded mb-2"
                    />
                  )}
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {reward.name}
                  </p>
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    {reward.coins_required} coins
                  </p>
                </button>
              ))
            )}
          </div>
        ) : (
          /* Ranking */
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏅</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Vincular ao Ranking
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Adicione um link para a página de ranking no seu story
            </p>
            <Button
              variant={selectedContent?.type === 'ranking' ? 'primary' : 'outline'}
              onClick={handleSelectRanking}
            >
              {selectedContent?.type === 'ranking' ? 'Selecionado' : 'Selecionar Ranking'}
            </Button>
          </div>
        )}
      </div>

      {/* Selected preview */}
      {selectedContent && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-600 font-medium mb-1">Selecionado:</p>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {selectedContent.type === 'challenge' ? '🏆' :
               selectedContent.type === 'reward' ? '🎁' : '📊'}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedContent.title}</p>
              {selectedContent.subtitle && (
                <p className="text-xs text-gray-500">{selectedContent.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
