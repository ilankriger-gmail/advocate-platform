'use client';

import { useState, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import { CheckCircle, XCircle, ExternalLink, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface Integration {
  name: string;
  description: string;
  configured: boolean;
  required: boolean;
  docs: string;
  variables: string[];
}

interface IntegrationsData {
  integrations: Record<string, Integration>;
  stats: {
    total: number;
    configured: number;
    required: number;
    requiredConfigured: number;
  };
}

/**
 * Componente para exibir e gerenciar integrações/APIs
 */
export function IntegrationSettings() {
  const [data, setData] = useState<IntegrationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/integrations');
      if (!response.ok) throw new Error('Erro ao carregar integrações');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-500">Verificando integrações...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <p className="text-red-700">{error || 'Erro ao carregar integrações'}</p>
        <button
          onClick={fetchIntegrations}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </Card>
    );
  }

  const { integrations, stats } = data;

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <p className="text-2xl font-bold text-indigo-700">{stats.configured}/{stats.total}</p>
          <p className="text-xs text-indigo-600">Integrações Ativas</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <p className="text-2xl font-bold text-green-700">{stats.requiredConfigured}/{stats.required}</p>
          <p className="text-xs text-green-600">Obrigatórias</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <p className="text-2xl font-bold text-amber-700">{stats.total - stats.configured}</p>
          <p className="text-xs text-amber-600">Não Configuradas</p>
        </Card>
        <Card className="p-4">
          <button
            onClick={fetchIntegrations}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Atualizar Status</span>
          </button>
        </Card>
      </div>

      {/* Aviso sobre variáveis de ambiente */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Como configurar as integrações?</p>
            <p className="text-xs text-blue-600 mt-1">
              As variáveis de ambiente são configuradas no painel da <strong>Vercel</strong> (Settings → Environment Variables)
              ou no arquivo <code className="bg-blue-100 px-1 rounded">.env.local</code> em desenvolvimento.
              Após alterar, faça um novo deploy para aplicar.
            </p>
          </div>
        </div>
      </Card>

      {/* Lista de Integrações */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Status das Integrações</h3>

        <div className="grid gap-3">
          {Object.entries(integrations).map(([key, integration]) => (
            <IntegrationCard key={key} integration={integration} />
          ))}
        </div>
      </div>

      {/* Referência rápida de variáveis */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Referência Rápida - Variáveis de Ambiente</h3>
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
{`# === OBRIGATÓRIAS ===
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com

# === RECOMENDADAS ===
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# === EMAIL (Resend) ===
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@seu-dominio.com
RESEND_WEBHOOK_SECRET=whsec_...

# === WHATSAPP (Meta) ===
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_APP_SECRET=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=token_aleatorio

# === YOUTUBE ===
YOUTUBE_API_KEY=AIza...
YOUTUBE_CHANNEL_HANDLE=@seu_canal

# === CACHE/RATE LIMIT ===
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# === MODERAÇÃO ===
SIGHTENGINE_API_USER=...
SIGHTENGINE_API_SECRET=...

# === CRON JOBS ===
CRON_SECRET=token_secreto_64_chars`}
          </pre>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Copie este template e preencha com suas chaves. Nunca compartilhe suas chaves secretas.
        </p>
      </Card>
    </div>
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const [showVariables, setShowVariables] = useState(false);

  return (
    <Card className={`p-4 ${integration.configured ? 'border-green-200' : integration.required ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className={`p-2 rounded-lg ${integration.configured ? 'bg-green-100' : 'bg-gray-100'}`}>
          {integration.configured ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-gray-900">{integration.name}</h4>
            {integration.required && (
              <Badge className="bg-red-100 text-red-700 text-xs">Obrigatória</Badge>
            )}
            <Badge className={integration.configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
              {integration.configured ? 'Configurada' : 'Não configurada'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">{integration.description}</p>

          {/* Variáveis */}
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="text-xs text-indigo-600 hover:text-indigo-800 mt-2"
          >
            {showVariables ? 'Ocultar variáveis' : 'Ver variáveis necessárias'}
          </button>

          {showVariables && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
              {integration.variables.map(v => (
                <div key={v}>{v}</div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <a
          href={integration.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 flex-shrink-0"
        >
          <span>Docs</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </Card>
  );
}
