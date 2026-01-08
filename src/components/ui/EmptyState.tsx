import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tipos de ícones pré-definidos para estados vazios
 *
 * @typedef {'posts' | 'campaigns' | 'rewards' | 'users' | 'search'} EmptyStateIconType
 *
 * - `posts`: Ícone de posts/conteúdo para listas de publicações vazias
 * - `campaigns`: Ícone de megafone para listas de campanhas vazias
 * - `rewards`: Ícone de presente/prêmio para listas de recompensas vazias
 * - `users`: Ícone de grupo de pessoas para listas de usuários vazias
 * - `search`: Ícone de lupa para resultados de busca vazios
 */
export type EmptyStateIconType = 'posts' | 'campaigns' | 'rewards' | 'users' | 'search';

/**
 * Propriedades do componente EmptyState
 *
 * @interface EmptyStateProps
 *
 * @example
 * // EmptyState básico sem ícone
 * <EmptyState
 *   title="Nenhum item encontrado"
 *   description="Não há itens para exibir no momento."
 * />
 *
 * @example
 * // EmptyState com ícone pré-definido
 * <EmptyState
 *   icon={<EmptyStateIcon type="posts" />}
 *   title="Nenhum post ainda"
 *   description="Comece criando seu primeiro post para aparecer aqui."
 * />
 *
 * @example
 * // EmptyState com ícone customizado
 * <EmptyState
 *   icon={<FolderIcon className="w-12 h-12" />}
 *   title="Pasta vazia"
 *   description="Esta pasta não contém nenhum arquivo."
 * />
 *
 * @example
 * // EmptyState com ação (botão)
 * <EmptyState
 *   icon={<EmptyStateIcon type="campaigns" />}
 *   title="Nenhuma campanha ativa"
 *   description="Crie sua primeira campanha para começar a engajar seus advocates."
 *   action={
 *     <Button variant="primary">
 *       Criar campanha
 *     </Button>
 *   }
 * />
 *
 * @example
 * // EmptyState de busca sem resultados
 * <EmptyState
 *   icon={<EmptyStateIcon type="search" />}
 *   title="Nenhum resultado encontrado"
 *   description="Tente usar palavras-chave diferentes ou verifique a ortografia."
 *   className="py-20"
 * />
 */
export interface EmptyStateProps {
  /**
   * Ícone exibido no topo do estado vazio (use EmptyStateIcon para ícones pré-definidos)
   */
  icon?: ReactNode;

  /**
   * Título principal do estado vazio
   */
  title: string;

  /**
   * Descrição adicional explicando o estado vazio ou sugerindo próximos passos
   */
  description?: string;

  /**
   * Elemento de ação (geralmente um botão) para resolver o estado vazio
   */
  action?: ReactNode;

  /**
   * Classes CSS adicionais para customização
   */
  className?: string;
}

/**
 * Componente para exibir estados vazios com mensagem, ícone opcional e ação
 *
 * Usado quando listas, tabelas ou seções não possuem conteúdo para exibir.
 * Fornece feedback visual claro ao usuário e opcionalmente sugere uma ação.
 *
 * @param {EmptyStateProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente EmptyState renderizado
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * Propriedades do componente EmptyStateIcon
 *
 * @interface EmptyStateIconProps
 *
 * @example
 * // Ícone de posts
 * <EmptyStateIcon type="posts" />
 *
 * @example
 * // Ícone de campanhas
 * <EmptyStateIcon type="campaigns" />
 *
 * @example
 * // Ícone de recompensas
 * <EmptyStateIcon type="rewards" />
 *
 * @example
 * // Ícone de usuários
 * <EmptyStateIcon type="users" />
 *
 * @example
 * // Ícone de busca
 * <EmptyStateIcon type="search" />
 *
 * @example
 * // Uso completo com EmptyState
 * <EmptyState
 *   icon={<EmptyStateIcon type="rewards" />}
 *   title="Nenhuma recompensa disponível"
 *   description="Adicione recompensas para incentivar seus advocates."
 * />
 */
export interface EmptyStateIconProps {
  /**
   * Tipo de ícone pré-definido a ser exibido
   */
  type: EmptyStateIconType;
}

/**
 * Componente que fornece ícones pré-definidos para estados vazios comuns
 *
 * Fornece ícones SVG otimizados e consistentes para diferentes tipos de
 * estados vazios na aplicação (posts, campanhas, recompensas, usuários, busca).
 *
 * @param {EmptyStateIconProps} props - Propriedades do componente
 * @returns {JSX.Element} Ícone SVG renderizado
 */
export function EmptyStateIcon({ type }: EmptyStateIconProps) {
  const icons = {
    posts: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    campaigns: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    rewards: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    users: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    search: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  };

  return icons[type];
}
