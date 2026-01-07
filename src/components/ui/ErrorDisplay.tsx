/**
 * Componente para exibir mensagens de erro de forma amigável
 *
 * Este componente:
 * - Exibe mensagens de erro padronizadas do sistema de erros centralizado
 * - Mostra links para troubleshooting quando disponível
 * - Suporta diferentes níveis de severidade (error, warning, info)
 * - Permite ações customizadas (botões de retry, voltar, etc.)
 */

import { type ReactNode } from 'react';
import { type AppError, type ErrorSeverity } from '@/lib/errors';

export interface ErrorDisplayProps {
  /** Erro do sistema centralizado de erros */
  error?: AppError;
  /** Título customizado (sobrescreve error.message) */
  title?: string;
  /** Mensagem customizada (sobrescreve error.message) */
  message?: string;
  /** Severidade do erro (sobrescreve error.severity) */
  severity?: ErrorSeverity;
  /** Detalhes técnicos adicionais para desenvolvedores */
  technicalDetails?: string;
  /** Exibir detalhes técnicos (útil em desenvolvimento) */
  showTechnicalDetails?: boolean;
  /** Código do erro (sobrescreve error.code) */
  errorCode?: string;
  /** Botões de ação customizados */
  actions?: ReactNode;
  /** Ocultar link de troubleshooting */
  hideTroubleshootingLink?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

// Ícones SVG para cada severidade
function ErrorIcon({ severity }: { severity: ErrorSeverity }) {
  const icons = {
    error: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return icons[severity];
}

// Mapa de estilos por severidade
const severityStyles = {
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    message: 'text-red-800',
    code: 'bg-red-100 text-red-800',
    link: 'text-red-700 hover:text-red-900',
    technical: 'bg-red-100 text-red-800 border-red-200',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    message: 'text-yellow-800',
    code: 'bg-yellow-100 text-yellow-800',
    link: 'text-yellow-700 hover:text-yellow-900',
    technical: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    message: 'text-blue-800',
    code: 'bg-blue-100 text-blue-800',
    link: 'text-blue-700 hover:text-blue-900',
    technical: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

export function ErrorDisplay({
  error,
  title,
  message,
  severity,
  technicalDetails,
  showTechnicalDetails = false,
  errorCode,
  actions,
  hideTroubleshootingLink = false,
  className = '',
}: ErrorDisplayProps) {
  // Determinar valores finais com fallbacks
  const finalSeverity = severity || error?.severity || 'error';
  const finalTitle = title || (finalSeverity === 'error' ? 'Erro' : finalSeverity === 'warning' ? 'Atenção' : 'Informação');
  const finalMessage = message || error?.message || 'Ocorreu um erro inesperado.';
  const finalCode = errorCode || error?.code;
  const finalTechnicalMessage = technicalDetails || error?.technicalMessage;
  const finalTroubleshootingUrl = error?.troubleshootingUrl;

  const styles = severityStyles[finalSeverity];

  return (
    <div
      className={`
        border rounded-xl p-4 shadow-soft
        ${styles.container}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="alert"
    >
      <div className="flex gap-3">
        {/* Ícone */}
        <div className={`shrink-0 ${styles.icon}`}>
          <ErrorIcon severity={finalSeverity} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Título e código */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold text-sm ${styles.title}`}>
              {finalTitle}
            </h3>
            {finalCode && (
              <span
                className={`
                  inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium
                  ${styles.code}
                `.trim().replace(/\s+/g, ' ')}
              >
                {finalCode}
              </span>
            )}
          </div>

          {/* Mensagem principal */}
          <p className={`text-sm ${styles.message} mb-3`}>
            {finalMessage}
          </p>

          {/* Detalhes técnicos (apenas em desenvolvimento) */}
          {showTechnicalDetails && finalTechnicalMessage && (
            <details className="mb-3">
              <summary className={`text-xs font-medium cursor-pointer ${styles.title} mb-2`}>
                Detalhes técnicos
              </summary>
              <div
                className={`
                  text-xs font-mono p-2 rounded border
                  ${styles.technical}
                `.trim().replace(/\s+/g, ' ')}
              >
                {finalTechnicalMessage}
              </div>
            </details>
          )}

          {/* Link para troubleshooting */}
          {!hideTroubleshootingLink && finalTroubleshootingUrl && (
            <div className="mb-3">
              <a
                href={finalTroubleshootingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  inline-flex items-center gap-1 text-sm font-medium underline
                  ${styles.link}
                `.trim().replace(/\s+/g, ' ')}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Ver guia de solução
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}

          {/* Ações customizadas */}
          {actions && (
            <div className="flex gap-2 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente simplificado para exibir apenas uma mensagem de erro
 */
export function ErrorMessage({
  message,
  className = ''
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={`text-sm text-red-600 ${className}`.trim()}>
      {message}
    </p>
  );
}

/**
 * Componente para exibir erro inline (menor, sem ícone)
 */
export function InlineError({
  message,
  className = ''
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`
        text-xs text-red-600 bg-red-50 border border-red-200
        rounded-lg px-2 py-1.5
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {message}
    </div>
  );
}
