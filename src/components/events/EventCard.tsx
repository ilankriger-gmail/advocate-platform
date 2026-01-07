'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Badge, Button } from '@/components/ui';
import { registerForEvent, cancelEventRegistration } from '@/actions/events';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string | null;
  start_time: string;
  end_time: string;
  max_participants: number | null;
  required_level: number;
  is_virtual: boolean;
  meeting_url: string | null;
  image_url: string | null;
}

interface EventCardProps {
  event: Event;
  userLevel: number;
  registrationStatus?: string;
  isLive?: boolean;
}

export function EventCard({
  event,
  userLevel,
  registrationStatus,
  isLive = false,
}: EventCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(registrationStatus);

  const canRegister = userLevel >= event.required_level;
  const isRegistered = status && status !== 'cancelled';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRegister = async () => {
    setIsLoading(true);
    const result = await registerForEvent(event.id);
    if (result.success) {
      setStatus('registered');
    }
    setIsLoading(false);
  };

  const handleCancel = async () => {
    setIsLoading(true);
    const result = await cancelEventRegistration(event.id);
    if (result.success) {
      setStatus('cancelled');
    }
    setIsLoading(false);
  };

  return (
    <Card className={`overflow-hidden ${isLive ? 'ring-2 ring-green-500' : ''}`}>
      {/* Imagem ou placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-indigo-500 to-purple-600">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isLive && (
            <Badge className="bg-green-500 text-white animate-pulse">
              AO VIVO
            </Badge>
          )}
          {event.is_virtual ? (
            <Badge className="bg-blue-500 text-white">Virtual</Badge>
          ) : (
            <Badge className="bg-orange-500 text-white">Presencial</Badge>
          )}
        </div>

        {/* Status inscricao */}
        {isRegistered && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-600 text-white">
              Inscrito
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Titulo */}
        <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
          {event.title}
        </h3>

        {/* Data e hora */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(event.start_time)}</span>
          <span className="text-gray-300">|</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatTime(event.start_time)}</span>
        </div>

        {/* Local */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Nivel requerido */}
        {event.required_level > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className={canRegister ? 'text-gray-600' : 'text-red-600'}>
              Nivel {event.required_level} necessario
            </span>
          </div>
        )}

        {/* Descricao */}
        <p className="text-sm text-gray-500 line-clamp-2">
          {event.description}
        </p>

        {/* Acoes */}
        <div className="pt-2 flex gap-2">
          {isRegistered ? (
            <>
              {isLive && event.meeting_url && (
                <a
                  href={event.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-4 bg-green-600 text-white text-center text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Entrar Agora
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Cancelando...' : 'Cancelar'}
              </Button>
            </>
          ) : canRegister ? (
            <Button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Inscrevendo...' : 'Inscrever-se'}
            </Button>
          ) : (
            <div className="w-full py-2 px-4 bg-gray-100 text-gray-500 text-center text-sm rounded-lg">
              Nivel insuficiente
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
