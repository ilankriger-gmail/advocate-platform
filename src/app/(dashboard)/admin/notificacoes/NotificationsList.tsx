'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactElement } from 'react';
import type { NotificationLogWithLead } from '@/lib/supabase/types';

interface NotificationsListProps {
  notifications: NotificationLogWithLead[];
  channelFilter: string;
  statusFilter: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  opened: { label: 'Aberto', color: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500' },
};

const channelLabels: Record<string, { label: string; icon: ReactElement }> = {
  email: {
    label: 'Email',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      </svg>
    ),
  },
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationsList({
  notifications,
  channelFilter,
  statusFilter,
}: NotificationsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/admin/notificações?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Filtros */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          {/* Filtro de Canal */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Canal:</span>
            <select
              value={channelFilter}
              onChange={(e) => handleFilterChange('channel', e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="sent">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="opened">Aberto</option>
              <option value="failed">Falhou</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>Nenhuma notificacao encontrada</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const channel = channelLabels[notification.channel];
            const status = statusLabels[notification.status] || statusLabels.pending;
            const lead = notification.nps_leads;
            const metadata = notification.metadata as Record<string, unknown> | null;

            return (
              <div key={notification.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* Icone do Canal */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    notification.channel === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {channel?.icon}
                  </div>

                  {/* Informacoes */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {lead?.name || 'Lead desconhecido'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {channel?.label}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 truncate">
                      {lead?.email || '-'}
                    </p>

                    {/* Metadados */}
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>Criado: {formatDate(notification.created_at)}</span>
                      {notification.sent_at && (
                        <span>Enviado: {formatDate(notification.sent_at)}</span>
                      )}
                      {typeof metadata?.opened_at === 'string' && (
                        <span className="text-green-600">
                          Aberto: {formatDate(metadata.opened_at)}
                        </span>
                      )}
                      {typeof metadata?.read_at === 'string' && (
                        <span className="text-green-600">
                          Lido: {formatDate(metadata.read_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ID Externo */}
                  {notification.external_id && (
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-gray-400 font-mono truncate max-w-[120px]">
                        {notification.external_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
