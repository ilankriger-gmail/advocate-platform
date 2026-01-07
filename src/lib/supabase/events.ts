/**
 * Queries para Eventos
 */

import { createClient } from './server';
import type { Event, EventWithRegistration, EventRegistration } from './types';

/**
 * Buscar todos os eventos ativos
 */
export async function getActiveEvents(): Promise<EventWithRegistration[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .gte('end_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (error || !events) return [];

  // Buscar contagem de registros e status do usuário
  const eventsWithRegistration = await Promise.all(
    events.map(async (event) => {
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact' })
        .eq('event_id', event.id)
        .neq('status', 'cancelled');

      let userRegistration = null;
      if (user) {
        const { data } = await supabase
          .from('event_registrations')
          .select('*')
          .eq('event_id', event.id)
          .eq('user_id', user.id)
          .single();
        userRegistration = data;
      }

      return {
        ...event,
        registrations_count: count || 0,
        is_registered: !!userRegistration && userRegistration.status !== 'cancelled',
        user_registration: userRegistration,
      } as EventWithRegistration;
    })
  );

  return eventsWithRegistration;
}

/**
 * Buscar evento por ID
 */
export async function getEventById(eventId: string): Promise<EventWithRegistration | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !event) return null;

  const { count } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact' })
    .eq('event_id', eventId)
    .neq('status', 'cancelled');

  let userRegistration = null;
  if (user) {
    const { data } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();
    userRegistration = data;
  }

  return {
    ...event,
    registrations_count: count || 0,
    is_registered: !!userRegistration && userRegistration.status !== 'cancelled',
    user_registration: userRegistration,
  } as EventWithRegistration;
}

/**
 * Buscar eventos do usuário (inscrições)
 */
export async function getUserEvents(): Promise<EventWithRegistration[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('*, events(*)')
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .order('registration_time', { ascending: false });

  if (!registrations) return [];

  return registrations.map((reg: any) => ({
    ...reg.events,
    registrations_count: 0,
    is_registered: true,
    user_registration: {
      id: reg.id,
      event_id: reg.event_id,
      user_id: reg.user_id,
      registration_time: reg.registration_time,
      status: reg.status,
      check_in_time: reg.check_in_time,
      feedback: reg.feedback,
    },
  })) as EventWithRegistration[];
}

/**
 * Buscar próximos eventos (limite)
 */
export async function getUpcomingEvents(limit = 5): Promise<Event[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(limit);

  if (error) return [];

  return data || [];
}

/**
 * Buscar participantes de um evento
 */
export async function getEventParticipants(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_registrations')
    .select('*, users(id, full_name, avatar_url)')
    .eq('event_id', eventId)
    .neq('status', 'cancelled')
    .order('registration_time', { ascending: true });

  if (error) return [];

  return data || [];
}

/**
 * Verificar disponibilidade de vagas
 */
export async function checkEventAvailability(eventId: string): Promise<{ available: boolean; spots_left: number | null }> {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select('max_participants')
    .eq('id', eventId)
    .single();

  if (!event || event.max_participants === null) {
    return { available: true, spots_left: null };
  }

  const { count } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact' })
    .eq('event_id', eventId)
    .neq('status', 'cancelled');

  const spotsLeft = event.max_participants - (count || 0);

  return {
    available: spotsLeft > 0,
    spots_left: spotsLeft,
  };
}
