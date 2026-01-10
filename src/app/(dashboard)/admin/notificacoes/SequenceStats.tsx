'use client';

interface SequenceStatsProps {
  stats: {
    totalApproved: number;
    email1Sent: number;
    email2Sent: number;
    whatsappSent: number;
    converted: number;
    conversionRate: number;
    funnel: {
      step: number;
      name: string;
      count: number;
      convertedCount: number;
    }[];
  };
}

export function SequenceStats({ stats }: SequenceStatsProps) {
  // Cores para cada etapa do funil
  const stepColors = [
    { bg: 'bg-pink-100', text: 'text-pink-600', bar: 'bg-pink-500' },
    { bg: 'bg-orange-100', text: 'text-orange-600', bar: 'bg-orange-500' },
    { bg: 'bg-amber-100', text: 'text-amber-600', bar: 'bg-amber-500' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header da Sequência */}
      <div className="bg-gradient-to-r from-pink-500 via-orange-500 to-emerald-500 rounded-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Sequência de Conversão</h3>
            <p className="text-sm text-white/80 mt-1">
              Dia 1: Email 1 → Dia 2: Email 2 → Dia 3: WhatsApp
            </p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.totalApproved}</p>
              <p className="text-xs text-white/70">Leads aprovados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.converted}</p>
              <p className="text-xs text-white/70">Convertidos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.conversionRate}%</p>
              <p className="text-xs text-white/70">Taxa de conversão</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes por etapa */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <span className="text-pink-600 font-bold">1</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email 1 Enviados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.email1Sent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-bold">2</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email 2 Enviados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.email2Sent}</p>
              <p className="text-xs text-gray-400">
                {stats.email1Sent > 0 ? Math.round((stats.email2Sent / stats.email1Sent) * 100) : 0}% do Email 1
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-emerald-600 font-bold">3</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">WhatsApp Enviados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.whatsappSent}</p>
              <p className="text-xs text-gray-400">
                {stats.email2Sent > 0 ? Math.round((stats.whatsappSent / stats.email2Sent) * 100) : 0}% do Email 2
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 p-4 bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-emerald-700">Convertidos</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.converted}</p>
              <p className="text-xs text-emerald-500">
                {stats.conversionRate}% de conversão
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Funil Visual */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Funil de Conversão</h4>
        <div className="space-y-3">
          {stats.funnel.map((step, index) => {
            const color = stepColors[index] || stepColors[0];
            const maxCount = stats.totalApproved || 1;
            const barWidth = Math.max((step.count / maxCount) * 100, 5);
            const percentage = stats.totalApproved > 0
              ? Math.round((step.count / stats.totalApproved) * 100)
              : 0;

            return (
              <div key={step.step} className="flex items-center gap-4">
                <div className={`w-8 h-8 ${color.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className={`${color.text} text-sm font-bold`}>{step.step}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 truncate">
                      {step.name}
                      {step.convertedCount > 0 && (
                        <span className="text-emerald-600 ml-2">
                          ({step.convertedCount} convertidos)
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-gray-900 ml-2">
                      {step.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dicas */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium">Como funciona a sequência:</p>
            <ul className="mt-1 list-disc list-inside space-y-1 text-blue-600">
              <li><strong>Email 1:</strong> Enviado ao aprovar o lead</li>
              <li><strong>Email 2:</strong> Enviado 24h depois se nao converteu</li>
              <li><strong>WhatsApp:</strong> Enviado 24h após Email 2 se ainda não converteu</li>
              <li><strong>Conversão:</strong> Quando o lead cria a conta e faz login</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
