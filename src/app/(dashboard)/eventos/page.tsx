import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/config/site';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui';
import { EventCard } from '@/components/events/EventCard';
import { EventRegistrationWithEvent } from '@/lib/supabase/types';


export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'seo_eventos_title',
    'seo_eventos_description',
  ]);

  return {
    title: settings.seo_eventos_title,
    description: settings.seo_eventos_description,
    openGraph: {
      title: settings.seo_eventos_title,
      description: settings.seo_eventos_description,
    },
  };
}

export default async function EventosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Paralelizar todas as queries para melhor performance
  const [
    { data: events },
    { data: registrations },
    { data: profile },
    { data: pastRegistrations }
  ] = await Promise.all([
    // Buscar eventos ativos
    supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true }),
    // Buscar inscricoes do usuário
    supabase
      .from('event_registrations')
      .select('event_id, status')
      .eq('user_id', user.id)
      .neq('status', 'cancelled'),
    // Buscar perfil do usuário para verificar nivel
    supabase
      .from('users')
      .select('advocate_level')
      .eq('id', user.id)
      .single(),
    // Buscar eventos passados que o usuário participou
    supabase
      .from('event_registrations')
      .select('*, events(*)')
      .eq('user_id', user.id)
      .eq('status', 'attended')
      .order('registration_time', { ascending: false })
      .limit(5)
  ]);

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

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Eventos"
        description="Participe de eventos exclusivos da comunidade"
      />

      {/* Acontecendo agora */}
      {happeningNow.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" />
            Acontecendo Agora
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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

      {/* Próximos eventos */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            Próximos Eventos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            Eventos que Você Participou
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {pastRegistrations.map((reg: EventRegistrationWithEvent) => (
              <Card key={reg.id} className="p-3 sm:p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                      {reg.events?.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {reg.events?.start_time ? new Date(reg.events.start_time).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'Data não disponível'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sem eventos - Em breve */}
      {(!events || events.length === 0) && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1">
          <div className="relative bg-white rounded-xl p-8 sm:p-12">
            {/* Elementos decorativos */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full blur-2xl opacity-50 translate-y-1/2 -translate-x-1/2" />

            <div className="relative text-center">
              {/* Ícone animado */}
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
                <span className="text-4xl sm:text-5xl animate-bounce">🎉</span>
              </div>

              {/* Badge "Em Breve" */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Em Breve
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Eventos Incríveis Chegando!
              </h2>

              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Estamos preparando eventos exclusivos para a comunidade.
                Lives, encontros, desafios em grupo e muito mais!
              </p>

              {/* Features dos eventos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="flex flex-col items-center p-4 rounded-xl bg-gray-50">
                  <span className="text-2xl mb-2">🎬</span>
                  <span className="text-sm text-gray-600 font-medium">Lives Exclusivas</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-gray-50">
                  <span className="text-2xl mb-2">🤝</span>
                  <span className="text-sm text-gray-600 font-medium">Encontros</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-gray-50">
                  <span className="text-2xl mb-2">🏆</span>
                  <span className="text-sm text-gray-600 font-medium">Competições</span>
                </div>
              </div>

              <p className="text-sm text-gray-400 mt-6">
                Fique ligado! Você será notificado quando novos eventos estiverem disponíveis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
