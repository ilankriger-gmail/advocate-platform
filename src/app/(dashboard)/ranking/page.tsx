'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Skeleton } from '@/components/ui';
import {
  CategorySelector,
  LeaderboardList,
  UserRankCard,
} from '@/components/leaderboard';
import {
  fetchRelativeLeaderboard,
  fetchUserRank,
} from '@/actions/leaderboard';
import type {
  LeaderboardEntry,
  UserRanking,
  LeaderboardCategory,
} from '@/lib/supabase/types';

/**
 * Página de Rankings - exibe ranking relativo (usuários próximos)
 * Mostra 5 acima + usuário atual + 5 abaixo
 */
export default function RankingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Estado do filtro de categoria
  const [category, setCategory] = useState<LeaderboardCategory>('combined');

  // Estados dos dados
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRanking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingUserRank, setLoadingUserRank] = useState(false);

  // Verificar autenticação e carregar dados iniciais
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  // Carregar dados do leaderboard quando a categoria mudar
  useEffect(() => {
    if (loading) return;

    async function loadLeaderboard() {
      setLoadingLeaderboard(true);
      setError(null);

      const result = await fetchRelativeLeaderboard(category);

      if (result.error) {
        setError(result.error);
        setLeaderboardData([]);
      } else {
        setLeaderboardData(result.data || []);
      }

      setLoadingLeaderboard(false);
    }

    loadLeaderboard();
  }, [category, loading]);

  // Carregar ranking do usuário quando categoria mudar
  useEffect(() => {
    if (loading || !userId) return;

    async function loadUserRank() {
      setLoadingUserRank(true);

      const result = await fetchUserRank(category);

      if (result.error) {
        setUserRank(null);
      } else {
        setUserRank(result.data || null);
      }

      setLoadingUserRank(false);
    }

    loadUserRank();
  }, [category, loading, userId]);

  // Loading inicial
  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Rankings"
        description="Veja sua posição e os participantes próximos a você"
      />

      {/* Seletor de Categoria */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Escolha uma categoria
        </h2>
        <CategorySelector
          activeCategory={category}
          onCategoryChange={setCategory}
        />
      </div>

      {/* Ranking do Usuário */}
      {loadingUserRank ? (
        <Skeleton className="h-32 w-full" />
      ) : userRank ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sua Posição
          </h2>
          <UserRankCard ranking={userRank} />
        </div>
      ) : null}

      {/* Erro */}
      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900">Erro ao carregar ranking</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de Ranking Relativo */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Participantes Próximos
          </h2>
          {!loadingLeaderboard && leaderboardData.length > 0 && (
            <div className="text-sm text-gray-500">
              {leaderboardData.length} participantes
            </div>
          )}
        </div>

        <LeaderboardList
          entries={leaderboardData}
          currentUserId={userId}
          isLoading={loadingLeaderboard}
        />
      </div>

      {/* Informação adicional */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              Como subir no ranking?
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Complete desafios para ganhar moedas e pontos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Mantenha-se ativo e engajado na comunidade</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Alcance novos tiers (Bronze → Silver → Gold → Diamond)</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Legenda de Tiers */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Entenda os Tiers
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold">
              🥉
            </div>
            <div>
              <p className="font-medium text-gray-900">Bronze</p>
              <p className="text-xs text-gray-500">0 - 99 pontos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
              🥈
            </div>
            <div>
              <p className="font-medium text-gray-900">Silver</p>
              <p className="text-xs text-gray-500">100 - 499 pontos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">
              🥇
            </div>
            <div>
              <p className="font-medium text-gray-900">Gold</p>
              <p className="text-xs text-gray-500">500 - 999 pontos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
              💎
            </div>
            <div>
              <p className="font-medium text-gray-900">Diamond</p>
              <p className="text-xs text-gray-500">1000+ pontos</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
