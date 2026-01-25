import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Button, Badge } from '@/components/ui';
import { EventAdminActions } from './EventAdminActions';


export const dynamic = 'force-dynamic';
export default async function AdminEventosPage() {
  const supabase = await createClient();

  // Buscar eventos com contagem de inscritos
  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      event_registrations (
        id,
        status
      )
    `)
    .order('starts_at', { ascending: false });

  // Processar dados
  const now = new Date();
  const processedEvents = (events || []).map((e) => {
    const registrations = e.event_registrations || [];
    const startsAt = new Date(e.starts_at);
    const endsAt = e.ends_at ? new Date(e.ends_at) : null;

    let status = 'upcoming';
    if (startsAt <= now && (!endsAt || endsAt >= now)) {
      status = 'live';
    } else if (endsAt && endsAt < now) {
      status = 'past';
    }

    return {
      ...e,
      totalRegistrations: registrations.length,
      confirmedCount: registrations.filter((r: { status: string }) => r.status === 'confirmed').length,
      status,
    };
  });

  const upcomingEvents = processedEvents.filter((e) => e.status === 'upcoming');
  const liveEvents = processedEvents.filter((e) => e.status === 'live');
  const pastEvents = processedEvents.filter((e) => e.status === 'past');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Eventos</h1>
          <p className="text-gray-500 text-sm mt-1">Crie e gerencie eventos para sua comunidade</p>
        </div>
        <Link href="/admin/eventos/novo">
          <Button>+ Novo Evento</Button>
        </Link>
      </div>

      {/* Eventos Ao Vivo */}
      {liveEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Ao Vivo Agora ({liveEvents.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveEvents.map((event) => (
              <EventAdminCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Próximos Eventos */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Próximos Eventos ({upcomingEvents.length})
        </h2>

        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <EventAdminCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Nenhum evento programado</p>
          </Card>
        )}
      </div>

      {/* Eventos Passados */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            Eventos Passados ({pastEvents.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastEvents.slice(0, 4).map((event) => (
              <EventAdminCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface EventAdminCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    meeting_url: string | null;
    is_active: boolean;
    max_participants: number | null;
    totalRegistrations: number;
    confirmedCount: number;
    status: string;
  };
}

function EventAdminCard({ event }: EventAdminCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeBadge = () => {
    switch (event.type) {
      case 'virtual':
        return <Badge className="bg-blue-100 text-blue-700">Virtual</Badge>;
      case 'presencial':
        return <Badge className="bg-green-100 text-green-700">Presencial</Badge>;
      case 'hibrido':
        return <Badge className="bg-purple-100 text-purple-700">Hibrido</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (event.status) {
      case 'live':
        return <Badge className="bg-red-500 text-white">Ao Vivo</Badge>;
      case 'upcoming':
        return <Badge className="bg-green-100 text-green-700">Programado</Badge>;
      case 'past':
        return <Badge className="bg-gray-100 text-gray-600">Encerrado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {getTypeBadge()}
            {getStatusBadge()}
            {!event.is_active && <Badge className="bg-yellow-100 text-yellow-700">Inativo</Badge>}
          </div>
          <h3 className="font-bold text-gray-900">{event.title}</h3>
        </div>
      </div>

      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
        {event.description || 'Sem descrição'}
      </p>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(event.starts_at)}
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            <strong>{event.totalRegistrations}</strong> inscritos
          </span>
          {event.max_participants && (
            <span className="text-gray-400">
              / {event.max_participants} vagas
            </span>
          )}
        </div>

        <EventAdminActions event={event} />
      </div>
    </Card>
  );
}
