'use client';

interface NotificationStatsProps {
  stats: {
    totalEmails: number;
    emailsOpened: number;
    emailsDelivered: number;
    totalWhatsApp: number;
    whatsappDelivered: number;
    whatsappRead: number;
    pendingTasks: number;
  };
}

export function NotificationStats({ stats }: NotificationStatsProps) {
  // Calcular taxas
  const emailOpenRate = stats.totalEmails > 0
    ? Math.round((stats.emailsOpened / stats.totalEmails) * 100)
    : 0;

  const whatsappFallbackRate = stats.totalEmails > 0
    ? Math.round((stats.totalWhatsApp / stats.totalEmails) * 100)
    : 0;

  const whatsappReadRate = stats.totalWhatsApp > 0
    ? Math.round((stats.whatsappRead / stats.totalWhatsApp) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Total Emails */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Emails Enviados</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalEmails}</p>
          </div>
        </div>
      </div>

      {/* Taxa de Abertura Email */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Taxa de Abertura</p>
            <p className="text-2xl font-bold text-gray-900">{emailOpenRate}%</p>
            <p className="text-xs text-gray-400">{stats.emailsOpened} de {stats.totalEmails}</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Enviados */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">WhatsApp Fallback</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalWhatsApp}</p>
            <p className="text-xs text-gray-400">{whatsappFallbackRate}% dos emails</p>
          </div>
        </div>
      </div>

      {/* Tarefas Pendentes */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tarefas Pendentes</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
            <p className="text-xs text-gray-400">Aguardando CRON</p>
          </div>
        </div>
      </div>

      {/* Resumo do Sistema Hibrido */}
      <div className="col-span-2 sm:col-span-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold">Sistema de Notificações Hibrido</h3>
            <p className="text-sm text-white/80 mt-1">
              Email enviado 100% | WhatsApp apenas se email nao abrir em 24h
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{emailOpenRate}%</p>
              <p className="text-xs text-white/70">Taxa abertura email</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{100 - emailOpenRate}%</p>
              <p className="text-xs text-white/70">Fallback WhatsApp</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{whatsappReadRate}%</p>
              <p className="text-xs text-white/70">WhatsApp lidos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
