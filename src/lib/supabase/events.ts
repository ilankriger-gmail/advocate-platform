/**
 * Queries para Eventos
 */

import { createClient } from './server';
import type { Event, EventWithRegistration, EventRegistration, EventRegistrationWithEvent } from './types';

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

  if (error || !events || events.length === 0) return [];

  // Extrair IDs de todos os eventos
  const eventIds = events.map(e => e.id);

  // Buscar contagem de registros para todos os eventos em uma única query
  const { data: registrationCounts } = await supabase
    .from('event_registrations')
    .select('event_id')
    .in('event_id', eventIds)
    .neq('status', 'cancelled');

  // Contar registros por evento
  const countsMap = new Map<string, number>();
  if (registrationCounts) {
    registrationCounts.forEach(r => {
      countsMap.set(r.event_id, (countsMap.get(r.event_id) || 0) + 1);
    });
  }

  // Buscar registros do usuário em todos os eventos em uma única query
  let userRegistrationsMap = new Map<string, EventRegistration>();
  if (user) {
    const { data: userRegistrations } = await supabase
      .from('event_registrations')
      .select('*')
      .in('event_id', eventIds)
      .eq('user_id', user.id);

    if (userRegistrations) {
      userRegistrations.forEach(r => {
        userRegistrationsMap.set(r.event_id, r);
      });
    }
  }

  // Combinar dados
  const eventsWithRegistration = events.map(event => {
    const userRegistration = userRegistrationsMap.get(event.id) || null;
    return {
      ...event,
      registrations_count: countsMap.get(event.id) || 0,
      is_registered: !!userRegistration && userRegistration.status !== 'cancelled',
      user_registration: userRegistration,
    } as EventWithRegistration;
  });

  return eventsWithRegistration;
}

/**
 * Buscar evento por ID
 */
export async function getEventById(eventId: string): Promise<EventWithRegistration | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Paralelizar todas as queries usando Promise.all
  const [eventResult, countResult, userRegistrationResult] = await Promise.all([
    // Query 1: Buscar o evento
    supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single(),

    // Query 2: Buscar contagem de registros
    supabase
      .from('event_registrations')
      .select('id', { count: 'exact' })
      .eq('event_id', eventId)
      .neq('status', 'cancelled'),

    // Query 3: Buscar registro do usuário (se existir)
    user
      ? supabase
          .from('event_registrations')
          .select('*')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (eventResult.error || !eventResult.data) return null;

  return {
    ...eventResult.data,
    registrations_count: countResult.count || 0,
    is_registered: !!userRegistrationResult.data && userRegistrationResult.data.status !== 'cancelled',
    user_registration: userRegistrationResult.data,
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

  return registrations.map((reg: EventRegistrationWithEvent) => ({
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
