import { type HTMLAttributes, type ReactNode } from 'react';

/**
 * Variantes de padding disponíveis para o Card
 *
 * @typedef {'none' | 'sm' | 'md' | 'lg'} CardPadding
 *
 * - `none`: Sem padding - útil quando o conteúdo precisa ocupar toda a área do card
 * - `sm`: Padding pequeno (16px) - ideal para cards compactos
 * - `md`: Padding médio (24px) - tamanho padrão recomendado
 * - `lg`: Padding grande (32px) - para cards com mais espaçamento visual
 */
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Propriedades do componente Card
 *
 * @interface CardProps
 * @extends {HTMLAttributes<HTMLDivElement>}
 *
 * @example
 * // Card básico com conteúdo simples
 * <Card>
 *   <p>Conteúdo do card</p>
 * </Card>
 *
 * @example
 * // Card com padding customizado e efeito hover
 * <Card padding="lg" hover>
 *   <h3>Card com hover</h3>
 *   <p>Passe o mouse para ver o efeito de sombra</p>
 * </Card>
 *
 * @example
 * // Card completo com header, content e footer
 * <Card>
 *   <Card.Header
 *     title="Título do Card"
 *     description="Descrição opcional do conteúdo"
 *   />
 *   <Card.Content>
 *     <p>Conteúdo principal do card</p>
 *   </Card.Content>
 *   <Card.Footer>
 *     <Button variant="secondary">Cancelar</Button>
 *     <Button variant="primary">Confirmar</Button>
 *   </Card.Footer>
 * </Card>
 *
 * @example
 * // Card com header customizado e action
 * <Card>
 *   <Card.Header
 *     title="Configurações"
 *     description="Gerencie suas preferências"
 *     action={<Button size="sm">Editar</Button>}
 *   />
 *   <Card.Content>
 *     Conteúdo aqui
 *   </Card.Content>
 * </Card>
 *
 * @example
 * // Card sem padding para imagens ou conteúdo full-width
 * <Card padding="none">
 *   <img src="/image.jpg" alt="Banner" className="w-full" />
 *   <div className="p-6">
 *     <h3>Conteúdo com padding interno</h3>
 *   </div>
 * </Card>
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Define o espaçamento interno do card.
   * Use 'none' para conteúdo que deve ocupar toda a área (como imagens).
   * @default 'md'
   */
  padding?: CardPadding;

  /**
   * Quando true, adiciona efeito de sombra ao passar o mouse sobre o card.
   * Útil para cards clicáveis ou interativos.
   * @default false
   */
  hover?: boolean;
}

/**
 * Propriedades do componente CardHeader
 *
 * @interface CardHeaderProps
 * @extends {HTMLAttributes<HTMLDivElement>}
 *
 * @example
 * // Header com título e descrição
 * <Card.Header
 *   title="Meu Card"
 *   description="Descrição do conteúdo"
 * />
 *
 * @example
 * // Header com action (botão ou ícone)
 * <Card.Header
 *   title="Tarefas"
 *   description="5 itens pendentes"
 *   action={<Button size="sm">Ver todas</Button>}
 * />
 *
 * @example
 * // Header totalmente customizado usando children
 * <Card.Header>
 *   <div className="flex items-center gap-3">
 *     <Avatar src="/user.jpg" />
 *     <div>
 *       <h3>Nome do Usuário</h3>
 *       <p className="text-sm text-gray-500">há 2 horas</p>
 *     </div>
 *   </div>
 * </Card.Header>
 */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Título principal do card.
   * Renderizado como heading h3 com truncamento automático.
   */
  title?: string;

  /**
   * Descrição ou subtítulo do card.
   * Exibido abaixo do título com estilo secundário.
   */
  description?: string;

  /**
   * Elemento de ação exibido no canto direito do header.
   * Geralmente um botão, ícone ou badge.
   */
  action?: ReactNode;
}

/**
 * Propriedades do componente CardContent
 *
 * @interface CardContentProps
 * @extends {HTMLAttributes<HTMLDivElement>}
 *
 * @example
 * // Content com conteúdo simples
 * <Card.Content>
 *   <p>Conteúdo principal do card</p>
 * </Card.Content>
 *
 * @example
 * // Content com múltiplos elementos
 * <Card.Content>
 *   <div className="space-y-4">
 *     <p>Primeiro parágrafo</p>
 *     <p>Segundo parágrafo</p>
 *   </div>
 * </Card.Content>
 */
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Propriedades do componente CardFooter
 *
 * @interface CardFooterProps
 * @extends {HTMLAttributes<HTMLDivElement>}
 *
 * @example
 * // Footer com botões de ação
 * <Card.Footer>
 *   <Button variant="secondary">Cancelar</Button>
 *   <Button variant="primary">Salvar</Button>
 * </Card.Footer>
 *
 * @example
 * // Footer com informações adicionais
 * <Card.Footer>
 *   <span className="text-sm text-gray-500">
 *     Última atualização: 5 min atrás
 *   </span>
 * </Card.Footer>
 */
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

// Mapa de estilos de padding
const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Componente Card principal
 *
 * Container versátil com bordas arredondadas, sombra suave e padding configurável.
 * Pode ser usado isoladamente ou composto com subcomponentes Header, Content e Footer.
 *
 * @param {CardProps} props - Propriedades do componente
 * @returns {JSX.Element} Elemento div estilizado como card
 */
export function Card({
  padding = 'md',
  hover = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const cardStyles = `
    bg-white border border-surface-200 rounded-2xl shadow-soft
    ${paddingStyles[padding]}
    ${hover ? 'hover-lift' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={cardStyles} {...props}>
      {children}
    </div>
  );
}

/**
 * Subcomponente CardHeader
 *
 * Seção superior do card, tipicamente contendo título, descrição e ações.
 * Pode ser usado com as props title/description/action ou totalmente customizado via children.
 *
 * @param {CardHeaderProps} props - Propriedades do componente
 * @returns {JSX.Element} Elemento div estilizado como header do card
 */
export function CardHeader({
  title,
  description,
  action,
  className = '',
  children,
  ...props
}: CardHeaderProps) {
  const headerStyles = `
    flex items-start justify-between gap-4
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Se tiver children, renderiza diretamente
  if (children) {
    return (
      <div className={headerStyles} {...props}>
        {children}
      </div>
    );
  }

  // Renderiza com title/description/action
  return (
    <div className={headerStyles} {...props}>
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-semibold text-surface-900 truncate">
            {title}
          </h3>
        )}
        {description && (
          <p className="mt-1 text-sm text-surface-500">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Subcomponente CardContent
 *
 * Área principal de conteúdo do card.
 * Wrapper semântico para o conteúdo principal, sem estilos predefinidos.
 *
 * @param {CardContentProps} props - Propriedades do componente
 * @returns {JSX.Element} Elemento div para conteúdo do card
 */
export function CardContent({
  className = '',
  children,
  ...props
}: CardContentProps) {
  const contentStyles = `
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={contentStyles} {...props}>
      {children}
    </div>
  );
}

/**
 * Subcomponente CardFooter
 *
 * Seção inferior do card, geralmente contendo ações (botões) ou informações adicionais.
 * Inclui borda superior e alinhamento à direita por padrão.
 *
 * @param {CardFooterProps} props - Propriedades do componente
 * @returns {JSX.Element} Elemento div estilizado como footer do card
 */
export function CardFooter({
  className = '',
  children,
  ...props
}: CardFooterProps) {
  const footerStyles = `
    flex items-center justify-end gap-3
    pt-4 mt-4 border-t border-surface-100
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={footerStyles} {...props}>
      {children}
    </div>
  );
}

// Atribuição de subcomponentes
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
