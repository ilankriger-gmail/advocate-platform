'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/types/action';

/**
 * Marcar onboarding como completo para o usuário atual
 * Opcionalmente salvar telefone
 */
export async function completeOnboarding(phone?: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const updateData: Record<string, unknown> = {
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    // Salvar telefone se fornecido
    if (phone && phone.trim()) {
      updateData.phone = phone.trim();
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao completar onboarding:', error);
      return { error: 'Erro ao salvar progresso do onboarding' };
    }

    revalidatePath('/');
    revalidatePath('/desafios');
    revalidatePath('/feed');

    return { success: true };
  } catch (err) {
    console.error('Erro inesperado no onboarding:', err);
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Verificar se usuário completou o onboarding
 */
export async function checkOnboardingStatus(): Promise<boolean | null> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao verificar onboarding:', error);
      return null;
    }

    return data?.onboarding_completed ?? false;
  } catch {
    return null;
  }
}
