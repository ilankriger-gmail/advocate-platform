import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'creator' && !profile?.is_creator) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Fetch pause settings
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['community_paused', 'community_pause_message', 'community_pause_reopen_date']);

    const settings: Record<string, string> = {};
    data?.forEach(s => { settings[s.key] = s.value; });

    return NextResponse.json({
      paused: settings.community_paused === 'true',
      message: settings.community_pause_message || '',
      reopenDate: settings.community_pause_reopen_date || '',
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
