import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui';
import { EventCard } from '@/components/events/EventCard';
import { EventRegistrationWithEvent } from '@/lib/supabase/types';

export default async function EventosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar eventos ativos
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .gte('end_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  // Buscar inscricoes do usuario
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('event_id, status')
    .eq('user_id', user.id)
    .neq('status', 'cancelled');

  // Buscar perfil do usuario para verificar nivel
  const { data: profile } = await supabase
    .from('users')
    .select('advocate_level')
    .eq('id', user.id)
    .single();

  const userLevel = profile?.advocate_level || 1;

  // Mapa de inscricoes
  const registrationMap = new Map(
    (registrations || []).map(r => [r.event_id, r.status])
  );

  // Separar eventos por categoria
  const upcomingEvents = (events || []).filter(
    e => new Date(e.start_time) > new Date()
  );
  const happeningNow = (events || []).filter(e => {
    const now = new Date();
    return new Date(e.start_time) <= now && new Date(e.end_time) >= now;
  });

  // Buscar eventos passados que o usuario participou
  const { data: pastRegistrations } = await supabase
    .from('event_registrations')
    .select('*, events(*)')
    .eq('user_id', user.id)
    .eq('status', 'attended')
    .order('registration_time', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Eventos"
        description="Participe de eventos exclusivos da comunidade"
      />

      {/* Acontecendo agora */}
      {happeningNow.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            Acontecendo Agora
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {happeningNow.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                userLevel={userLevel}
                registrationStatus={registrationMap.get(event.id)}
                isLive
              />
            ))}
          </div>
        </div>
      )}

      {/* Proximos eventos */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            Proximos Eventos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                userLevel={userLevel}
                registrationStatus={registrationMap.get(event.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Eventos que participou */}
      {pastRegistrations && pastRegistrations.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            Eventos que Voce Participou
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastRegistrations.map((reg: EventRegistrationWithEvent) => (
              <Card key={reg.id} className="p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {reg.events?.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(reg.events?.start_time).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sem eventos */}
      {(!events || events.length === 0) && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Nenhum evento disponivel
          </h2>
          <p className="text-gray-500">
            Novos eventos serao anunciados em breve!
          </p>
        </Card>
      )}
    </div>
  );
}
