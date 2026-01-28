'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { DEFAULT_CONFIG } from './mocobot-types';
import type { MocoBotConfig, BotStats, RecentAction } from './mocobot-types';

export type { MocoBotConfig, BotStats, RecentAction };

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_creator')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
    redirect('/admin/login');
  }
  return user;
}

export async function getMocoBotConfig(): Promise<MocoBotConfig> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'mocobot_config')
      .single();

    if (data?.value) {
      return { ...DEFAULT_CONFIG, ...data.value };
    }
  } catch {
    // Table might not exist or no row yet
  }
  return DEFAULT_CONFIG;
}

export async function saveMocoBotConfig(config: MocoBotConfig): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdmin();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: 'mocobot_config', value: config, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('[MocoBotConfig] Save error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/mocobot');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function processQueueNow(): Promise<{ success: boolean; result?: Record<string, number>; error?: string }> {
  try {
    await verifyAdmin();
    const { processScheduledActions } = await import('@/actions/mocobot');
    const result = await processScheduledActions();
    revalidatePath('/admin/mocobot');
    return { success: true, result };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getMocoBotStats(): Promise<BotStats> {
  const defaults: BotStats = { totalToday: 0, pending: 0, completedToday: 0, failedToday: 0, byType: { likes: 0, comments: 0, replies: 0 } };

  try {
    const supabase = createAdminClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: actions, error } = await supabase
      .from('scheduled_bot_actions')
      .select('action_type, status, created_at, executed_at')
      .or(`created_at.gte.${todayISO},status.eq.pending`);

    if (error || !actions) return defaults;

    const todayActions = actions.filter(a => a.created_at >= todayISO);
    const pending = actions.filter(a => a.status === 'pending');
    const completed = todayActions.filter(a => a.status === 'completed');
    const failed = todayActions.filter(a => a.status === 'failed');

    return {
      totalToday: todayActions.length,
      pending: pending.length,
      completedToday: completed.length,
      failedToday: failed.length,
      byType: {
        likes: todayActions.filter(a => a.action_type === 'like').length,
        comments: todayActions.filter(a => a.action_type === 'comment').length,
        replies: todayActions.filter(a => a.action_type === 'reply').length,
      },
    };
  } catch {
    return defaults;
  }
}

export async function getRecentActions(): Promise<RecentAction[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('scheduled_bot_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
