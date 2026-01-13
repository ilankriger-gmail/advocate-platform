import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/config/site';
import { PageHeader } from '@/components/layout/PageHeader';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'seo_ranking_title',
    'seo_ranking_description',
  ]);

  return {
    title: settings.seo_ranking_title || 'Ranking',
    description: settings.seo_ranking_description || 'Veja sua posição no ranking da comunidade',
  };
}

export default async function RankingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Ranking"
        description="Veja sua posição na comunidade"
      />

      {/* Em breve */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-1">
        <div className="relative bg-white rounded-xl p-8 sm:p-12">
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full blur-2xl opacity-50 translate-y-1/2 -translate-x-1/2" />

          <div className="relative text-center">
            {/* Ícone animado */}
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 mb-6">
              <span className="text-4xl sm:text-5xl animate-bounce">🏆</span>
            </div>

            {/* Badge "Em Breve" */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Em Breve
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Sistema de Ranking Chegando!
            </h2>

            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Estamos preparando um sistema de ranking incrível para você competir
              com outros membros da comunidade e ganhar recompensas exclusivas!
            </p>

            {/* Features do ranking */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="flex flex-col items-center p-4 rounded-xl bg-gray-50">
                <span className="text-2xl mb-2">🥇</span>
                <span className="text-sm text-gray-600 font-medium">Top 10 Semanal</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-gray-50">
                <span className="text-2xl mb-2">💎</span>
                <span className="text-sm text-gray-600 font-medium">Níveis de Tier</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-gray-50">
                <span className="text-2xl mb-2">🎁</span>
                <span className="text-sm text-gray-600 font-medium">Prêmios Especiais</span>
              </div>
            </div>

            <p className="text-sm text-gray-400 mt-6">
              Continue completando desafios! Seus pontos já estão sendo contabilizados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
