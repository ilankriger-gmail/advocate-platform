'use server';

import { createClient } from '@/lib/supabase/server';

export interface CommunityStats {
  membersCount: number;
  challengesCompleted: number;
  eventsCount: number;
}

/**
 * Busca estatísticas da comunidade para exibir no hero section
 * Retorna contagem de membros, desafios completados e eventos
 */
export async function getCommunityStats(): Promise<CommunityStats> {
  const supabase = await createClient();

  // Executar queries em paralelo para performance
  const [membersResult, challengesResult, eventsResult] = await Promise.all([
    // Contagem de usuários ativos
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true }),

    // Contagem de participações em desafios aprovadas
    supabase
      .from('challenge_participations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),

    // Contagem de eventos
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true }),
  ]);

  return {
    membersCount: membersResult.count ?? 0,
    challengesCompleted: challengesResult.count ?? 0,
    eventsCount: eventsResult.count ?? 0,
  };
}
