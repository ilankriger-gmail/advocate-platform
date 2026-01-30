'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface EngagementTask {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  hearts_reward: number;
  is_active: boolean;
  is_repeatable: boolean;
  max_per_day: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
  hearts_earned: number;
}

/**
 * Buscar todas as tarefas ativas
 */
export async function getActiveTasks(): Promise<EngagementTask[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('engagement_tasks')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar tarefas:', error);
    return [];
  }

  return data || [];
}

/**
 * Buscar todas as tarefas (admin)
 */
export async function getAllTasks(): Promise<EngagementTask[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('engagement_tasks')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar tarefas:', error);
    return [];
  }

  return data || [];
}

/**
 * Completar uma tarefa e ganhar corações
 */
export async function completeTask(taskSlug: string): Promise<{
  success: boolean;
  heartsEarned?: number;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  // Buscar tarefa
  const { data: task, error: taskError } = await supabase
    .from('engagement_tasks')
    .select('*')
    .eq('slug', taskSlug)
    .eq('is_active', true)
    .single();

  if (taskError || !task) {
    return { success: false, error: 'Tarefa não encontrada' };
  }

  // Verificar se já completou (para tarefas não repetíveis)
  if (!task.is_repeatable) {
    const { data: existing } = await supabase
      .from('user_task_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', task.id)
      .single();

    if (existing) {
      return { success: false, error: 'Tarefa já completada' };
    }
  }

  // Verificar limite diário se aplicável
  if (task.is_repeatable && task.max_per_day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count } = await supabase
      .from('user_task_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('task_id', task.id)
      .gte('completed_at', today.toISOString());

    if (count && count >= task.max_per_day) {
      return { success: false, error: 'Limite diário atingido' };
    }
  }

  // Registrar conclusão
  const { error: completionError } = await supabase
    .from('user_task_completions')
    .insert({
      user_id: user.id,
      task_id: task.id,
      hearts_earned: task.hearts_reward,
    });

  if (completionError) {
    console.error('Erro ao completar tarefa:', completionError);
    return { success: false, error: 'Erro ao registrar conclusão' };
  }

  // Adicionar corações ao usuário via RPC atômico (add_user_coins)
  const { error: updateError } = await supabase.rpc('add_user_coins', {
    p_user_id: user.id,
    p_amount: task.hearts_reward,
    p_type: `task_${taskSlug}`,
    p_description: `❤️ ${task.name}`,
  });

  if (updateError) {
    console.error('Erro ao adicionar corações:', updateError);
  }

  revalidatePath('/perfil');
  revalidatePath('/dashboard');

  return { success: true, heartsEarned: task.hearts_reward };
}

/**
 * Verificar e completar tarefas de perfil automaticamente
 * Usa giveHearts (sistema real de corações) em vez do engagement task system
 */
export async function checkAndCompleteProfileTasks(profileData: {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_handle?: string;
  twitter_handle?: string;
  website_url?: string;
}, previousData?: typeof profileData): Promise<number> {
  const { giveHearts } = await import('@/lib/hearts');
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  let totalHearts = 0;

  type HeartAction = 'COMPLETE_PROFILE' | 'ADD_AVATAR' | 'ADD_BIO';
  
  const fieldToAction: Record<string, { action: HeartAction; description: string }> = {
    full_name: { action: 'COMPLETE_PROFILE', description: 'completou o nome do perfil' },
    bio: { action: 'ADD_BIO', description: 'adicionou bio ao perfil' },
    avatar_url: { action: 'ADD_AVATAR', description: 'adicionou foto de perfil' },
  };

  for (const [field, config] of Object.entries(fieldToAction)) {
    const newValue = profileData[field as keyof typeof profileData];
    const oldValue = previousData?.[field as keyof typeof profileData];

    // Se o campo foi preenchido (não estava antes ou mudou de vazio para preenchido)
    if (newValue && (!oldValue || oldValue !== newValue)) {
      const result = await giveHearts(user.id, config.action, {
        referenceType: `profile_${field}`,
        description: config.description,
      });
      if (result.success) {
        totalHearts += result.hearts;
      }
    }
  }

  return totalHearts;
}

/**
 * Buscar tarefas completadas do usuário
 */
export async function getUserCompletedTasks(): Promise<{
  completions: TaskCompletion[];
  totalHearts: number;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { completions: [], totalHearts: 0 };
  }

  const { data, error } = await supabase
    .from('user_task_completions')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar completions:', error);
    return { completions: [], totalHearts: 0 };
  }

  const completions = data || [];
  const totalHearts = completions.reduce((sum, c) => sum + c.hearts_earned, 0);

  return { completions, totalHearts };
}

/**
 * Atualizar tarefa (admin)
 */
export async function updateTask(taskId: string, updates: Partial<EngagementTask>): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  // Verificar se é admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') {
    return { success: false, error: 'Acesso negado' };
  }

  const { error } = await supabase
    .from('engagement_tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    console.error('Erro ao atualizar tarefa:', error);
    return { success: false, error: 'Erro ao atualizar' };
  }

  revalidatePath('/admin/engajamento');
  return { success: true };
}

/**
 * Criar nova tarefa (admin)
 */
export async function createTask(task: {
  slug: string;
  name: string;
  description?: string;
  category: string;
  hearts_reward: number;
  is_repeatable?: boolean;
  max_per_day?: number;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  // Verificar se é admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') {
    return { success: false, error: 'Acesso negado' };
  }

  const { error } = await supabase
    .from('engagement_tasks')
    .insert({
      ...task,
      is_active: true,
    });

  if (error) {
    console.error('Erro ao criar tarefa:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/engajamento');
  return { success: true };
}

/**
 * Estatísticas de engajamento (admin)
 */
export async function getEngagementStats(): Promise<{
  totalTasks: number;
  activeTasks: number;
  totalCompletions: number;
  heartsDistributed: number;
  topTasks: { name: string; completions: number }[];
}> {
  const supabase = await createClient();

  // Total de tarefas
  const { count: totalTasks } = await supabase
    .from('engagement_tasks')
    .select('id', { count: 'exact', head: true });

  // Tarefas ativas
  const { count: activeTasks } = await supabase
    .from('engagement_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  // Total de completions
  const { count: totalCompletions } = await supabase
    .from('user_task_completions')
    .select('id', { count: 'exact', head: true });

  // Total de corações distribuídos
  const { data: heartsData } = await supabase
    .from('user_task_completions')
    .select('hearts_earned');
  
  const heartsDistributed = heartsData?.reduce((sum, c) => sum + c.hearts_earned, 0) || 0;

  // Top tarefas
  const { data: topTasksData } = await supabase
    .from('user_task_completions')
    .select('task_id, engagement_tasks(name)')
    .limit(100);

  const taskCounts: Record<string, { name: string; count: number }> = {};
  if (topTasksData) {
    for (const c of topTasksData) {
      const taskData = c as { task_id: string; engagement_tasks: { name: string } | { name: string }[] | null };
      const engTask = taskData.engagement_tasks;
      const name = Array.isArray(engTask) ? engTask[0]?.name : engTask?.name || 'Unknown';
      if (!taskCounts[taskData.task_id]) {
        taskCounts[taskData.task_id] = { name, count: 0 };
      }
      taskCounts[taskData.task_id].count++;
    }
  }

  const topTasks = Object.values(taskCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(t => ({ name: t.name, completions: t.count }));

  return {
    totalTasks: totalTasks || 0,
    activeTasks: activeTasks || 0,
    totalCompletions: totalCompletions || 0,
    heartsDistributed,
    topTasks,
  };
}
