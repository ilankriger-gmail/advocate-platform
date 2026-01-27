'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';
import { ChallengeToggleButton } from './ChallengeToggleButton';

interface CollapsibleTypeSectionProps {
  type: string;
  config: {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
  };
  challenges: any[];
  defaultOpen?: boolean;
}

export function CollapsibleTypeSection({ type, config, challenges, defaultOpen = false }: CollapsibleTypeSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
  };

  return (
    <section className="space-y-2">
      {/* Header do tipo - clicável */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-3 rounded-lg border ${config.bgColor} hover:opacity-90 transition-all`}
      >
        <span className="text-2xl">{config.icon}</span>
        <h2 className={`text-lg font-bold ${config.color} flex-1 text-left`}>
          {config.label}
        </h2>
        <Badge className={config.bgColor + ' ' + config.color + ' border'}>
          {challenges.length}
        </Badge>
        <svg 
          className={`w-5 h-5 ${config.color} transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Lista de desafios - colapsável */}
      {isOpen && (
        <div className="space-y-2 pl-2">
          {challenges.map((challenge: any) => (
            <div 
              key={challenge.id}
              className={`flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-all ${!challenge.is_active ? 'opacity-60' : ''}`}
            >
              {/* Ícone */}
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{challenge.icon}</span>
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{challenge.title}</h3>
                  {!challenge.is_active && (
                    <Badge className="bg-gray-100 text-gray-500 text-xs">Oculto</Badge>
                  )}
                  {challenge.ends_at === null && challenge.is_active && (
                    <Badge className="bg-amber-100 text-amber-700 text-xs">Sem prazo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span>❤️ +{challenge.coins_reward}</span>
                  {challenge.starts_at && (
                    <span>📅 {formatDate(challenge.starts_at)}{challenge.ends_at ? ` - ${formatDate(challenge.ends_at)}` : ''}</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-gray-900">{challenge.totalParticipants}</p>
                  <p className="text-xs text-gray-500">Partic.</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-yellow-600">{challenge.pendingCount}</p>
                  <p className="text-xs text-gray-500">Pend.</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-green-600">{challenge.approvedCount}</p>
                  <p className="text-xs text-gray-500">Aprov.</p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2">
                <Link href={`/admin/desafios/${challenge.id}`}>
                  <Button size="sm" className="bg-gray-900 hover:bg-gray-800">
                    Gerenciar
                  </Button>
                </Link>
                <Link href={`/admin/desafios/${challenge.id}/editar`}>
                  <Button size="sm" variant="outline">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                </Link>
                <ChallengeToggleButton
                  challengeId={challenge.id}
                  challengeName={challenge.title}
                  isActive={challenge.is_active}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
