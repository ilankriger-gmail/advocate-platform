'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProcessingAnimation } from './ProcessingAnimation';
import { getLeadStatus, type LeadStatusResult } from '@/actions/leads';

interface ObrigadoContentProps {
  siteName: string;
  footerText: string;
}

type PageState = 'processing' | 'approved' | 'pending' | 'timeout' | 'error' | 'no-lead';

const POLL_INTERVAL = 2000; // 2 segundos
const MAX_POLL_TIME = 45000; // 45 segundos (metade do tempo anterior)
const MAX_RETRIES = 3; // Máximo de retries em caso de erro

export function ObrigadoContent({ siteName, footerText }: ObrigadoContentProps) {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');

  const [state, setState] = useState<PageState>(leadId ? 'processing' : 'no-lead');
  const [leadData, setLeadData] = useState<LeadStatusResult | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  // Usar refs para evitar problemas com closures e re-renders
  const pollStartTime = useRef<number>(Date.now());
  const isPolling = useRef<boolean>(false);

  useEffect(() => {
    if (!leadId || state !== 'processing') return;

    let timeoutId: NodeJS.Timeout;

    const checkStatus = async () => {
      // Evitar chamadas duplicadas
      if (isPolling.current) return;
      isPolling.current = true;

      try {
        const result = await getLeadStatus(leadId);

        if (result.error) {
          // Incrementar contador de erros
          setErrorCount((prev) => {
            const newCount = prev + 1;
            if (newCount >= MAX_RETRIES) {
              setState('error');
            }
            return newCount;
          });
          isPolling.current = false;
          return;
        }

        // Reset error count em sucesso
        setErrorCount(0);

        if (result.data) {
          setLeadData(result.data);

          if (result.data.status === 'approved') {
            setState('approved');
            isPolling.current = false;
            return;
          } else if (result.data.status === 'pending' || result.data.status === 'rejected') {
            setState('pending');
            isPolling.current = false;
            return;
          }
          // status === 'processing' - continua polling
        }

        // Verificar timeout
        const elapsedTime = Date.now() - pollStartTime.current;
        if (elapsedTime >= MAX_POLL_TIME) {
          // Timeout - mas se temos dados, mostra estado pendente
          if (leadData) {
            setState('timeout');
          } else {
            setState('pending');
          }
          isPolling.current = false;
          return;
        }

        // Agendar próxima verificação
        isPolling.current = false;
        timeoutId = setTimeout(checkStatus, POLL_INTERVAL);
      } catch {
        // Erro de rede - tentar novamente
        setErrorCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_RETRIES) {
            setState('error');
          }
          return newCount;
        });
        isPolling.current = false;
      }
    };

    // Iniciar polling
    pollStartTime.current = Date.now();
    checkStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      isPolling.current = false;
    };
  }, [leadId, state]); // Removido leadData das dependências para evitar loops

  // Estado: sem leadId (fallback para comportamento antigo)
  if (state === 'no-lead') {
    return <StaticThankYou siteName={siteName} footerText={footerText} />;
  }

  // Estado: processando
  if (state === 'processing') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <ProcessingAnimation />
        <p className="mt-8 text-sm text-gray-400">
          Aguarde um momento, estamos analisando sua inscrição...
        </p>
      </main>
    );
  }

  // Estado: aprovado
  if (state === 'approved' && leadData) {
    const registrationUrl = `https://comunidade.omocodoteamo.com.br/registro?email=${encodeURIComponent(leadData.email || '')}`;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Ícone de sucesso com animação */}
        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 animate-bounce-once">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Mensagem de parabéns */}
        <div className="text-center max-w-md">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Parabens, {leadData.name?.split(' ')[0]}!
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Voce foi aprovado para a comunidade {siteName}!
          </p>
          <p className="text-gray-500 mb-8">
            Crie sua conta agora para ter acesso a conteudos exclusivos,
            desafios e muito mais!
          </p>

          {/* Botão de cadastro - usa <a> para navegação externa */}
          <a
            href={registrationUrl}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-500
                     text-white font-semibold rounded-full hover:from-primary-700 hover:to-accent-600
                     transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Criar minha conta
          </a>

          <p className="mt-6 text-xs text-gray-400">
            Seu email ja esta pre-preenchido no formulario
          </p>
        </div>

        {/* Footer */}
        <p className="mt-12 text-sm text-gray-400">
          {footerText}
        </p>

        <style jsx>{`
          @keyframes bounce-once {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .animate-bounce-once {
            animation: bounce-once 0.6s ease-out;
          }
        `}</style>
      </main>
    );
  }

  // Estado: timeout (análise demorou muito)
  if (state === 'timeout') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Análise em andamento
          </h1>
          <p className="text-gray-600 mb-6">
            Sua inscrição está sendo analisada e pode demorar alguns minutos.
            Você receberá um email quando o resultado estiver pronto.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setState('processing');
                setErrorCount(0);
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Verificar novamente
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors"
            >
              Ir para o site
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Estado: pendente (aguardando análise manual)
  if (state === 'pending') {
    return <StaticThankYou siteName={siteName} footerText={footerText} showRefresh leadId={leadId} onRefresh={() => {
      setState('processing');
      setErrorCount(0);
    }} />;
  }

  // Estado: erro
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Algo deu errado
        </h1>
        <p className="text-gray-600 mb-6">
          Não foi possível verificar sua inscrição. Por favor, tente novamente.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setState('processing');
              setErrorCount(0);
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tentar novamente
          </button>
          <Link
            href="/seja-arena"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors"
          >
            Refazer inscrição
          </Link>
        </div>
      </div>
    </main>
  );
}

// Componente de agradecimento estático (comportamento antigo)
function StaticThankYou({
  siteName,
  footerText,
  showRefresh = false,
  leadId,
  onRefresh
}: {
  siteName: string;
  footerText: string;
  showRefresh?: boolean;
  leadId?: string | null;
  onRefresh?: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Ícone de sucesso */}
      <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Mensagem */}
      <div className="text-center max-w-md">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Obrigado!
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Seu cadastro foi enviado com sucesso.
        </p>
        <p className="text-gray-500 mb-8">
          Nossa equipe irá analisar sua solicitação e em breve entraremos em contato
          para informar se você foi aprovado para a comunidade {siteName}.
        </p>

        {/* Ícones de contato */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            E-mail
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            WhatsApp
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showRefresh && onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Verificar status
            </button>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ir para o site
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 text-sm text-gray-400">
        {footerText}
      </p>
    </main>
  );
}
