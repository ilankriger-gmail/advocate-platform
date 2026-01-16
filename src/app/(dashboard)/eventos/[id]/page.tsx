import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/config/site';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Badge, Button } from '@/components/ui';
import { EventActions } from './EventActions';
import { EventJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const [supabase, settings] = await Promise.all([
    createClient(),
    getSiteSettings(['seo_evento_title_template', 'seo_evento_description_template']),
  ]);

  const { data: event } = await supabase
    .from('events')
    .select('title, description, image_url')
    .eq('id', id)
    .single();

  if (!event) {
    return { title: 'Evento não encontrado' };
  }

  const eventDescription = event.description?.slice(0, 160) || '';

  // Aplicar templates
  const title = settings.seo_evento_title_template
    .replace('{{titulo}}', event.title)
    .replace('{{descricao}}', eventDescription);

  const description = settings.seo_evento_description_template
    .replace('{{titulo}}', event.title)
    .replace('{{descricao}}', eventDescription) || eventDescription;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: event.image_url ? [{ url: event.image_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: event.image_url ? [event.image_url] : [],
    },
  };
}

export default async function EventoDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar evento
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Buscar inscrição do usuário
  const { data: registration } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', id)
    .eq('user_id', user.id)
    .single();

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('users')
    .select('advocate_level')
    .eq('id', user.id)
    .single();

  // Buscar contagem de participantes
  const { count: participantsCount } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact' })
    .eq('event_id', id)
    .neq('status', 'cancelled');

  const userLevel = profile?.advocate_level || 1;
  const canRegister = userLevel >= event.required_level;
  const isRegistered = registration && registration.status !== 'cancelled';
  const isFull = event.max_participants && (participantsCount || 0) >= event.max_participants;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLive = () => {
    const now = new Date();
    return new Date(event.start_time) <= now && new Date(event.end_time) >= now;
  };

  const isPast = new Date(event.end_time) < new Date();

  const baseUrl = 'https://comunidade.omocodoteamo.com.br';

  return (
    <div className="space-y-6">
      {/* Structured Data */}
      <EventJsonLd
        name={event.title}
        description={event.description}
        startDate={event.start_time}
        endDate={event.end_time}
        location={event.location}
        image={event.image_url}
        url={`${baseUrl}/eventos/${id}`}
        organizer="Arena Te Amo"
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: baseUrl },
          { name: 'Eventos', url: `${baseUrl}/eventos` },
          { name: event.title, url: `${baseUrl}/eventos/${id}` },
        ]}
      />

      <PageHeader
        title=""
        breadcrumbs={[
          { label: 'Eventos', href: '/eventos' },
          { label: event.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteudo principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header com imagem */}
          <Card className="overflow-hidden">
            <div className="relative h-64 bg-gradient-to-br from-indigo-500 to-purple-600">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-24 h-24 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {isLive() && (
                  <Badge className="bg-green-500 text-white animate-pulse">
                    AO VIVO
                  </Badge>
                )}
                {isPast && (
                  <Badge className="bg-gray-500 text-white">
                    Encerrado
                  </Badge>
                )}
                {event.is_virtual ? (
                  <Badge className="bg-blue-500 text-white">Virtual</Badge>
                ) : (
                  <Badge className="bg-orange-500 text-white">Presencial</Badge>
                )}
              </div>
            </div>

            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {event.title}
              </h1>

              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          </Card>

          {/* Informações do evento */}
          <Card className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Informações</h2>

            <div className="space-y-4">
              {/* Data início */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Início</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(event.start_time)}
                  </p>
                </div>
              </div>

              {/* Data fim */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Término</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(event.end_time)}
                  </p>
                </div>
              </div>

              {/* Local */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Local</p>
                    <p className="font-medium text-gray-900">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Participantes */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Participantes</p>
                  <p className="font-medium text-gray-900">
                    {participantsCount || 0}
                    {event.max_participants && ` / ${event.max_participants}`}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Card de inscrição */}
          <Card className="p-6 sticky top-4">
            {isPast ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-600 font-medium">
                  Este evento já foi encerrado
                </p>
              </div>
            ) : (
              <>
                {/* Status */}
                {isRegistered && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Você está inscrito!</span>
                    </div>
                  </div>
                )}

                {/* Nivel requerido */}
                {event.required_level > 1 && !canRegister && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-medium">
                        Nível {event.required_level} necessário
                      </span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      Seu nível atual: {userLevel}
                    </p>
                  </div>
                )}

                {/* Lotado */}
                {isFull && !isRegistered && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-medium">Evento lotado</span>
                    </div>
                  </div>
                )}

                {/* Acoes */}
                <EventActions
                  eventId={event.id}
                  isRegistered={!!isRegistered}
                  canRegister={canRegister && !isFull}
                  isLive={isLive()}
                  meetingUrl={event.meeting_url}
                />
              </>
            )}
          </Card>

          {/* Link para voltar */}
          <Link
            href="/eventos"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para eventos
          </Link>
        </div>
      </div>
    </div>
  );
}
