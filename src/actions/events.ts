'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
<<<<<<< HEAD
import { ActionResponse } from '@/types/action';
import type { Event } from '@/lib/supabase/types';
=======
import { ActionResponse } from '@/types';
>>>>>>> auto-claude/029-consolidate-duplicated-actionresponse-type-into-sh

/**
 * Inscrever-se em um evento
 */
export async function registerForEvent(eventId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se o evento existe e esta ativo
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      return { error: 'Evento nao encontrado' };
    }

    // Verificar se o evento ja passou
    if (new Date(event.end_time) < new Date()) {
      return { error: 'Este evento ja foi encerrado' };
    }

    // Verificar nivel do usuario
    const { data: userProfile } = await supabase
      .from('users')
      .select('advocate_level')
      .eq('id', user.id)
      .single();

    if (userProfile && event.required_level > (userProfile.advocate_level || 1)) {
      return { error: `Nivel minimo requerido: ${event.required_level}` };
    }

    // Verificar se ja esta inscrito
    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (existingReg && existingReg.status !== 'cancelled') {
      return { error: 'Voce ja esta inscrito neste evento' };
    }

    // Verificar vagas disponiveis
    if (event.max_participants) {
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact' })
        .eq('event_id', eventId)
        .neq('status', 'cancelled');

      if ((count || 0) >= event.max_participants) {
        return { error: 'Nao ha mais vagas disponiveis' };
      }
    }

    // Criar inscricao ou reativar inscricao cancelada
    if (existingReg) {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'registered', registration_time: new Date().toISOString() })
        .eq('id', existingReg.id);

      if (error) {
        return { error: 'Erro ao reativar inscricao' };
      }
    } else {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered',
        });

      if (error) {
        return { error: 'Erro ao realizar inscricao' };
      }
    }

    revalidatePath('/eventos');
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Cancelar inscricao em um evento
 */
export async function cancelEventRegistration(eventId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'cancelled' })
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      return { error: 'Erro ao cancelar inscricao' };
    }

    revalidatePath('/eventos');
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Confirmar presenca em evento (check-in)
 */
export async function checkInEvent(eventId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    const { error } = await supabase
      .from('event_registrations')
      .update({
        status: 'attended',
        check_in_time: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      return { error: 'Erro ao realizar check-in' };
    }

    revalidatePath('/eventos');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Enviar feedback de evento
 */
export async function submitEventFeedback(
  eventId: string,
  feedback: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    if (!feedback.trim()) {
      return { error: 'Feedback nao pode ser vazio' };
    }

    const { error } = await supabase
      .from('event_registrations')
      .update({ feedback: feedback.trim() })
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      return { error: 'Erro ao enviar feedback' };
    }

    revalidatePath('/eventos');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

// ============ ADMIN ACTIONS ============

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
}): Promise<ActionResponse<Event>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
    }

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
      console.error('Error creating event:', error);
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
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
    }

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
    description: string;
    location: string;
    start_time: string;
    end_time: string;
    max_participants: number;
    required_level: number;
    is_virtual: boolean;
    meeting_url: string;
    image_url: string;
    is_active: boolean;
  }>
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { error: 'Acesso nao autorizado' };
    }

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
 * Confirmar inscricao de participante (admin)
 */
export async function confirmEventRegistration(
  eventId: string,
  userId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { error: 'Acesso nao autorizado' };
    }

    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'confirmed' })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      return { error: 'Erro ao confirmar inscricao' };
    }

    revalidatePath('/admin/eventos');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}