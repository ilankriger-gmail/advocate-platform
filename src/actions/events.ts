'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from './types';

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
