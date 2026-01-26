'use server';

import { createClient } from '@/lib/supabase/server';

export interface LandingPageStat {
  signup_source: string;
  signup_source_id: string | null;
  signup_source_name: string | null;
  total_signups: number;
  signups_24h: number;
  signups_7d: number;
  first_signup: string;
  last_signup: string;
}

/**
 * Buscar estatísticas de inscritos por landing page
 */
export async function getLandingPageStats(): Promise<{
  data: LandingPageStat[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('landing_page_stats')
      .select('*')
      .order('total_signups', { ascending: false });

    if (error) {
      console.error('[getLandingPageStats] Erro:', error);
      return { data: null, error: 'Erro ao buscar estatísticas' };
    }

    return { data: data as LandingPageStat[], error: null };
  } catch (err) {
    console.error('[getLandingPageStats] Erro inesperado:', err);
    return { data: null, error: 'Erro inesperado' };
  }
}

/**
 * Buscar total de inscritos por período
 */
export async function getSignupsByPeriod(): Promise<{
  total: number;
  last24h: number;
  last7d: number;
  fromLandings: number;
  organic: number;
}> {
  try {
    const supabase = await createClient();

    // Total de usuários
    const { count: total } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Últimas 24h
    const { count: last24h } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Últimos 7 dias
    const { count: last7d } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // De landing pages
    const { count: fromLandings } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('signup_source', 'is', null);

    return {
      total: total || 0,
      last24h: last24h || 0,
      last7d: last7d || 0,
      fromLandings: fromLandings || 0,
      organic: (total || 0) - (fromLandings || 0),
    };
  } catch {
    return { total: 0, last24h: 0, last7d: 0, fromLandings: 0, organic: 0 };
  }
}
