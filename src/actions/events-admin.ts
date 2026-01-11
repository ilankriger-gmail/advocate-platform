'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from './types';
import { verifyAdminOrCreator, getAuthenticatedUser } from './utils';

/**
 * Buscar evento por ID (admin)
 */
export async function getEventById(eventId: string): Promise<ActionResponse> {
  try {
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      return { error: 'Evento não encontrado' };
    }

    return { success: true, data };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Criar evento (admin)
 */
export async function createEvent(data: {
  title: string;
  description?: string | null;
  type: 'virtual' | 'presencial' | 'hibrido';
  location?: string | null;
  starts_at: string;
  ends_at?: string | null;
  max_participants?: number | null;
  meeting_url?: string | null;
  image_url?: string | null;
}): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title: data.title,
        description: data.description || null,
        type: data.type,
        location: data.location || null,
        starts_at: data.starts_at,
        ends_at: data.ends_at || null,
        max_participants: data.max_participants || null,
        meeting_url: data.meeting_url || null,
        image_url: data.image_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return { error: 'Erro ao criar evento' };
    }

    revalidatePath('/eventos');
    revalidatePath('/admin/eventos');
    return { success: true, data: event };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Ativar/Desativar evento (admin)
 */
export async function toggleEventActive(
  eventId: string,
  isActive: boolean
): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('events')
      .update({ is_active: isActive })
      .eq('id', eventId);

    if (error) {
      return { error: 'Erro ao atualizar evento' };
    }

    revalidatePath('/eventos');
    revalidatePath('/admin/eventos');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Atualizar evento (admin)
 */
export async function updateEvent(
  eventId: string,
  data: Partial<{
    title: string;
    description: string | null;
    type: 'virtual' | 'presencial' | 'hibrido';
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    max_participants: number | null;
    meeting_url: string | null;
    image_url: string | null;
    is_active: boolean;
  }>
): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('events')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (error) {
      return { error: 'Erro ao atualizar evento' };
    }

    revalidatePath('/eventos');
    revalidatePath('/admin/eventos');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Confirmar inscrição de participante (admin)
 */
export async function confirmEventRegistration(
  eventId: string,
  userId: string
): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'confirmed' })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      return { error: 'Erro ao confirmar inscrição' };
    }

    revalidatePath('/admin/eventos');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}
