import { cn } from '@/lib/utils';

/**
 * Propriedades do componente Skeleton
 *
 * @interface SkeletonProps
 *
 * @example
 * // Skeleton básico (linha)
 * <Skeleton className="h-4 w-full" />
 *
 * @example
 * // Skeleton circular (para avatar)
 * <Skeleton className="h-10 w-10 rounded-full" />
 *
 * @example
 * // Skeleton retangular (para imagem)
 * <Skeleton className="h-48 w-full rounded-lg" />
 *
 * @example
 * // Skeleton com tamanho específico
 * <Skeleton className="h-6 w-32" />
 *
 * @example
 * // Múltiplos Skeletons para simular texto
 * <div className="space-y-2">
 *   <Skeleton className="h-4 w-full" />
 *   <Skeleton className="h-4 w-full" />
 *   <Skeleton className="h-4 w-3/4" />
 * </div>
 */
export interface SkeletonProps {
  /**
   * Classes CSS adicionais para customizar tamanho, largura e formato
   */
  className?: string;
}

/**
 * Componente base para criar placeholders animados durante carregamento
 *
 * Usado para indicar que o conteúdo está sendo carregado, proporcionando
 * melhor feedback visual ao usuário. É altamente customizável via className.
 *
 * @param {SkeletonProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente Skeleton renderizado
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
    />
  );
}

/**
 * Propriedades do componente SkeletonText
 *
 * @interface SkeletonTextProps
 *
 * @example
 * // SkeletonText básico (3 linhas padrão)
 * <SkeletonText />
 *
 * @example
 * // SkeletonText com 5 linhas
 * <SkeletonText lines={5} />
 *
 * @example
 * // SkeletonText com 2 linhas
 * <SkeletonText lines={2} />
 *
 * @example
 * // SkeletonText com espaçamento customizado
 * <SkeletonText lines={4} className="space-y-3" />
 *
 * @example
 * // Múltiplos blocos de texto com espaçamento
 * <div className="space-y-6">
 *   <SkeletonText lines={2} />
 *   <SkeletonText lines={3} />
 * </div>
 */
export interface SkeletonTextProps {
  /**
   * Número de linhas de texto a serem renderizadas.
   * A última linha terá 75% da largura para simular fim de parágrafo.
   * @default 3
   */
  lines?: number;

  /**
   * Classes CSS adicionais para customizar espaçamento entre linhas
   */
  className?: string;
}

/**
 * Componente para simular múltiplas linhas de texto durante carregamento
 *
 * Renderiza um conjunto de linhas de Skeleton com larguras variadas para
 * simular um bloco de texto real. A última linha é automaticamente mais curta.
 *
 * @param {SkeletonTextProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente SkeletonText renderizado
 */
export function SkeletonText({
  lines = 3,
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Tamanhos disponíveis para o SkeletonAvatar
 *
 * @typedef {'sm' | 'md' | 'lg'} SkeletonAvatarSize
 *
 * - `sm`: Pequeno - 32x32px (w-8 h-8)
 * - `md`: Médio - 40x40px (w-10 h-10)
 * - `lg`: Grande - 48x48px (w-12 h-12)
 */
export type SkeletonAvatarSize = 'sm' | 'md' | 'lg';

/**
 * Propriedades do componente SkeletonAvatar
 *
 * @interface SkeletonAvatarProps
 *
 * @example
 * // SkeletonAvatar médio (padrão)
 * <SkeletonAvatar />
 *
 * @example
 * // SkeletonAvatar pequeno
 * <SkeletonAvatar size="sm" />
 *
 * @example
 * // SkeletonAvatar grande
 * <SkeletonAvatar size="lg" />
 *
 * @example
 * // SkeletonAvatar com margem customizada
 * <SkeletonAvatar className="mr-3" />
 *
 * @example
 * // Múltiplos avatares em grupo (simulando AvatarGroup)
 * <div className="flex -space-x-2">
 *   <SkeletonAvatar size="sm" />
 *   <SkeletonAvatar size="sm" />
 *   <SkeletonAvatar size="sm" />
 * </div>
 */
export interface SkeletonAvatarProps {
  /**
   * Tamanho do avatar skeleton
   * @default 'md'
   */
  size?: SkeletonAvatarSize;

  /**
   * Classes CSS adicionais para customização
   */
  className?: string;
}

/**
 * Componente para simular um avatar circular durante carregamento
 *
 * Usado para indicar que uma imagem de perfil ou avatar está sendo carregada.
 * Renderiza um círculo animado com tamanho configurável.
 *
 * @param {SkeletonAvatarProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente SkeletonAvatar renderizado
 */
export function SkeletonAvatar({
  size = 'md',
  className,
}: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />
  );
}

/**
 * Propriedades do componente SkeletonCard
 *
 * @interface SkeletonCardProps
 *
 * @example
 * // SkeletonCard básico
 * <SkeletonCard />
 *
 * @example
 * // SkeletonCard com margem customizada
 * <SkeletonCard className="mb-4" />
 *
 * @example
 * // Lista de SkeletonCards
 * <div className="space-y-4">
 *   <SkeletonCard />
 *   <SkeletonCard />
 *   <SkeletonCard />
 * </div>
 *
 * @example
 * // Grid de SkeletonCards
 * <div className="grid grid-cols-2 gap-4">
 *   <SkeletonCard />
 *   <SkeletonCard />
 * </div>
 *
 * @example
 * // SkeletonCard com background customizado
 * <SkeletonCard className="bg-gray-50" />
 */
export interface SkeletonCardProps {
  /**
   * Classes CSS adicionais para customização do container
   */
  className?: string;
}

/**
 * Componente pré-estruturado para simular um card genérico durante carregamento
 *
 * Renderiza um card completo com avatar, cabeçalho (título e subtítulo),
 * conteúdo de texto e botões de ação. Útil para listas de cards genéricos.
 *
 * @param {SkeletonCardProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente SkeletonCard renderizado
 */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('bg-white rounded-xl p-4 shadow-sm', className)}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonAvatar />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-4 mt-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

/**
 * Propriedades do componente SkeletonPost
 *
 * @interface SkeletonPostProps
 *
 * @example
 * // SkeletonPost básico
 * <SkeletonPost />
 *
 * @example
 * // SkeletonPost com margem customizada
 * <SkeletonPost className="mb-6" />
 *
 * @example
 * // Feed de SkeletonPosts
 * <div className="space-y-6">
 *   <SkeletonPost />
 *   <SkeletonPost />
 *   <SkeletonPost />
 * </div>
 *
 * @example
 * // SkeletonPost com padding customizado
 * <SkeletonPost className="p-6" />
 *
 * @example
 * // SkeletonPost sem sombra
 * <SkeletonPost className="shadow-none border" />
 */
export interface SkeletonPostProps {
  /**
   * Classes CSS adicionais para customização do container
   */
  className?: string;
}

/**
 * Componente pré-estruturado para simular um post/publicação durante carregamento
 *
 * Renderiza um post completo com avatar grande, cabeçalho (nome do autor e data),
 * título, descrição de texto, imagem em destaque e botões de interação (curtir,
 * comentar, compartilhar). Ideal para feeds de posts e redes sociais.
 *
 * @param {SkeletonPostProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente SkeletonPost renderizado
 */
export function SkeletonPost({ className }: SkeletonPostProps) {
  return (
    <div className={cn('bg-white rounded-xl p-4 shadow-sm', className)}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonAvatar size="lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-5 w-3/4 mb-3" />
      <SkeletonText lines={2} className="mb-4" />
      <Skeleton className="h-48 w-full rounded-lg mb-4" />
      <div className="flex gap-6">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
      </div>
    </div>
  );
}

/**
 * Propriedades do componente SkeletonTable
 *
 * @interface SkeletonTableProps
 *
 * @example
 * // SkeletonTable padrão (5 linhas, 4 colunas)
 * <SkeletonTable />
 *
 * @example
 * // SkeletonTable com 3 linhas e 5 colunas
 * <SkeletonTable rows={3} cols={5} />
 *
 * @example
 * // SkeletonTable com 10 linhas e 3 colunas
 * <SkeletonTable rows={10} cols={3} />
 *
 * @example
 * // SkeletonTable com espaçamento customizado
 * <SkeletonTable rows={7} cols={6} className="space-y-4" />
 *
 * @example
 * // SkeletonTable em um Card
 * <Card>
 *   <CardHeader title="Lista de Usuários" />
 *   <CardContent>
 *     <SkeletonTable rows={5} cols={4} />
 *   </CardContent>
 * </Card>
 */
export interface SkeletonTableProps {
  /**
   * Número de linhas da tabela (não inclui o cabeçalho)
   * @default 5
   */
  rows?: number;

  /**
   * Número de colunas da tabela
   * @default 4
   */
  cols?: number;

  /**
   * Classes CSS adicionais para customização do container
   */
  className?: string;
}

/**
 * Componente pré-estruturado para simular uma tabela durante carregamento
 *
 * Renderiza uma estrutura de tabela completa com cabeçalho e linhas de dados.
 * O número de linhas e colunas é totalmente configurável.
 *
 * @param {SkeletonTableProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente SkeletonTable renderizado
 */
export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
