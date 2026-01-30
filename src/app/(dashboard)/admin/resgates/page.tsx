import { createAdminClient } from '@/lib/supabase/server';
import ResgatesClient from './ResgatesClient';

export const dynamic = 'force-dynamic';

export default async function AdminResgatesPage() {
  const supabase = createAdminClient();

  // Buscar todos os resgates (sem limite)
  const { data: allClaims } = await supabase
    .from('reward_claims')
    .select(`
      *,
      rewards:reward_id (
        id,
        name,
        description,
        coins_required,
        type,
        image_url
      )
    `)
    .order('created_at', { ascending: false });

  // Buscar dados de usuários
  const userIds = [...new Set(allClaims?.map(c => c.user_id) || [])];
  
  const [
    { data: users },
    { data: profiles },
    { data: userCoins },
    { data: userChallenges },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, email, avatar_url, phone')
      .in('id', userIds.length ? userIds : ['_none_']),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds.length ? userIds : ['_none_']),
    supabase
      .from('user_coins')
      .select('user_id, balance')
      .in('user_id', userIds.length ? userIds : ['_none_']),
    supabase
      .from('challenge_participants')
      .select(`
        id, user_id, status, video_proof_url, social_media_url, instagram_proof_url,
        coins_earned, ai_is_valid, ai_reason,
        challenges:challenge_id (title, type, icon)
      `)
      .in('user_id', userIds.length ? userIds : ['_none_'])
      .order('created_at', { ascending: false }),
  ]);

  return (
    <ResgatesClient
      claims={(allClaims || []) as any}
      users={(users || []) as any}
      profiles={(profiles || []) as any}
      userCoins={(userCoins || []) as any}
      challenges={(userChallenges || []) as any}
    />
  );
}
