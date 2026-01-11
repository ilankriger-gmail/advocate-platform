'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Tamanhos disponíveis para o avatar
 *
 * @typedef {'xs' | 'sm' | 'md' | 'lg' | 'xl'} AvatarSize
 *
 * - `xs`: Extra pequeno - 24px (1.5rem), ideal para listas compactas
 * - `sm`: Pequeno - 32px (2rem), ideal para comentários e menções
 * - `md`: Médio - 40px (2.5rem), tamanho padrão recomendado
 * - `lg`: Grande - 48px (3rem), ideal para perfis em cards
 * - `xl`: Extra grande - 64px (4rem), ideal para páginas de perfil
 */
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Propriedades do componente Avatar
 *
 * @interface AvatarProps
 * @extends {Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>}
 *
 * @example
 * // Avatar com imagem
 * <Avatar src="/avatar.jpg" alt="João Silva" />
 *
 * @example
 * // Avatar com fallback de iniciais
 * <Avatar name="Maria Santos" />
 *
 * @example
 * // Avatar com status online
 * <Avatar
 *   src="/avatar.jpg"
 *   name="Pedro Costa"
 *   status="online"
 * />
 *
 * @example
 * // Avatar grande com status busy
 * <Avatar
 *   name="Ana Lima"
 *   size="lg"
 *   status="busy"
 * />
 *
 * @example
 * // Avatar extra pequeno sem imagem
 * <Avatar name="Carlos" size="xs" />
 */
interface AvatarProps {
  /**
   * URL da imagem do avatar.
   * Se não fornecida ou falhar ao carregar, exibe fallback com iniciais.
   */
  src?: string | null;

  /**
   * Classes CSS adicionais para o container.
   */
  className?: string;

  /**
   * Texto alternativo para a imagem.
   * Usado para acessibilidade. Se não fornecido, usa o valor de 'name'.
   */
  alt?: string;

  /**
   * Nome do usuário para gerar iniciais no fallback.
   * Também usado como aria-label quando alt não é fornecido.
   * A cor de fundo do fallback é gerada automaticamente baseada no nome.
   */
  name?: string;

  /**
   * Tamanho do avatar
   * @default 'md'
   */
  size?: AvatarSize;

  /**
   * Indicador de status do usuário exibido como badge no canto inferior direito.
   * - `online`: Verde - usuário online/disponível
   * - `offline`: Cinza - usuário offline/indisponível
   * - `busy`: Vermelho - usuário ocupado/não perturbe
   * - `away`: Amarelo - usuário ausente/inativo
   */
  status?: 'online' | 'offline' | 'busy' | 'away';
}

// Mapa de tamanhos
const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: {
    container: 'h-6 w-6',
    text: 'text-xs',
    status: 'h-1.5 w-1.5 ring-1',
  },
  sm: {
    container: 'h-8 w-8',
    text: 'text-sm',
    status: 'h-2 w-2 ring-2',
  },
  md: {
    container: 'h-10 w-10',
    text: 'text-base',
    status: 'h-2.5 w-2.5 ring-2',
  },
  lg: {
    container: 'h-12 w-12',
    text: 'text-lg',
    status: 'h-3 w-3 ring-2',
  },
  xl: {
    container: 'h-16 w-16',
    text: 'text-xl',
    status: 'h-4 w-4 ring-2',
  },
};

// Cores para o status
const statusColors: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'bg-green-500',
  offline: 'bg-surface-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
};

// Cores de fundo para fallback baseadas no nome
const backgroundColors = [
  'bg-primary-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
];

// Função para extrair iniciais do nome
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Função para obter cor de fundo baseada no nome
function getBackgroundColor(name: string): string {
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return backgroundColors[index % backgroundColors.length];
}

/**
 * Componente Avatar para exibir foto de perfil do usuário
 *
 * Exibe a imagem do usuário ou fallback com iniciais se a imagem não estiver
 * disponível. Suporta indicador de status é múltiplos tamanhos.
 * A cor do fallback é gerada automaticamente baseada no nome do usuário.
 *
 * @component
 * @example
 * // Avatar básico com imagem
 * <Avatar src="/user.jpg" alt="João Silva" />
 *
 * @example
 * // Avatar com fallback de iniciais
 * <Avatar name="Maria Santos" />
 *
 * @example
 * // Avatar com status online
 * <Avatar
 *   src="/user.jpg"
 *   name="Pedro Costa"
 *   status="online"
 *   size="lg"
 * />
 *
 * @example
 * // Avatar pequeno com status busy
 * <Avatar
 *   name="Ana Lima"
 *   size="sm"
 *   status="busy"
 * />
 */
export function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  status,
  className = '',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeConfig = sizeStyles[size];
  const showFallback = !src || imageError;
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? getBackgroundColor(name) : 'bg-surface-400';

  const containerStyles = `
    relative inline-flex items-center justify-center
    rounded-full overflow-hidden shrink-0
    ${sizeConfig.container}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerStyles}>
      {/* Imagem ou fallback */}
      {showFallback ? (
        <div
          className={`
            flex items-center justify-center
            w-full h-full
            ${bgColor} text-white font-medium
            ${sizeConfig.text}
          `.trim().replace(/\s+/g, ' ')}
          role="img"
          aria-label={alt || name || 'Avatar'}
        >
          {initials}
        </div>
      ) : (
        <Image
          src={src!}
          alt={alt || name || 'Avatar'}
          fill
          sizes="64px"
          onError={() => setImageError(true)}
          className="object-cover"
        />
      )}

      {/* Indicador de status */}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            rounded-full ring-white
            ${statusColors[status]}
            ${sizeConfig.status}
          `.trim().replace(/\s+/g, ' ')}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

/**
 * Propriedades do componente AvatarGroup
 *
 * @interface AvatarGroupProps
 *
 * @example
 * // Grupo básico de avatars
 * <AvatarGroup>
 *   <Avatar name="João Silva" />
 *   <Avatar name="Maria Santos" />
 *   <Avatar name="Pedro Costa" />
 * </AvatarGroup>
 *
 * @example
 * // Grupo com limite máximo
 * <AvatarGroup max={3}>
 *   <Avatar name="João Silva" />
 *   <Avatar name="Maria Santos" />
 *   <Avatar name="Pedro Costa" />
 *   <Avatar name="Ana Lima" />
 *   <Avatar name="Carlos Souza" />
 * </AvatarGroup>
 *
 * @example
 * // Grupo pequeno com imagens
 * <AvatarGroup size="sm" max={4}>
 *   <Avatar src="/user1.jpg" name="Usuário 1" />
 *   <Avatar src="/user2.jpg" name="Usuário 2" />
 *   <Avatar src="/user3.jpg" name="Usuário 3" />
 *   <Avatar src="/user4.jpg" name="Usuário 4" />
 *   <Avatar src="/user5.jpg" name="Usuário 5" />
 * </AvatarGroup>
 */
interface AvatarGroupProps {
  /**
   * Componentes Avatar a serem exibidos no grupo.
   * Os avatars são sobrepostos com espaçamento negativo.
   */
  children: React.ReactNode;

  /**
   * Número máximo de avatars a exibir.
   * Se houver mais avatars, exibe um indicador "+N" com a quantidade restante.
   */
  max?: number;

  /**
   * Tamanho dos avatars no grupo.
   * Todos os avatars no grupo usam o mesmo tamanho.
   * @default 'md'
   */
  size?: AvatarSize;
}

/**
 * Componente AvatarGroup para exibir múltiplos avatars sobrepostos
 *
 * Agrupa múltiplos componentes Avatar com sobreposição horizontal.
 * Suporta limite máximo de avatars exibidos, mostrando contador "+N" para os restantes.
 * Útil para mostrar listas de participantes, membros de equipe, etc.
 *
 * @component
 * @example
 * // Grupo básico de avatars
 * <AvatarGroup>
 *   <Avatar name="João Silva" src="/user1.jpg" />
 *   <Avatar name="Maria Santos" src="/user2.jpg" />
 *   <Avatar name="Pedro Costa" src="/user3.jpg" />
 * </AvatarGroup>
 *
 * @example
 * // Grupo com limite de 3 avatars
 * <AvatarGroup max={3}>
 *   <Avatar name="João Silva" />
 *   <Avatar name="Maria Santos" />
 *   <Avatar name="Pedro Costa" />
 *   <Avatar name="Ana Lima" />
 *   <Avatar name="Carlos Souza" />
 * </AvatarGroup>
 *
 * @example
 * // Grupo pequeno para lista compacta
 * <AvatarGroup size="sm" max={5}>
 *   {members.map(member => (
 *     <Avatar key={member.id} name={member.name} src={member.avatar} />
 *   ))}
 * </AvatarGroup>
 */
export function AvatarGroup({ children, max, size = 'md' }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const displayChildren = max ? childArray.slice(0, max) : childArray;
  const remaining = max ? childArray.length - max : 0;

  return (
    <div className="flex -space-x-2">
      {displayChildren.map((child, index) => (
        <div
          key={index}
          className="ring-2 ring-white rounded-full"
        >
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            flex items-center justify-center
            rounded-full ring-2 ring-white
            bg-surface-200 text-surface-600 font-medium
            ${sizeStyles[size].container}
            ${sizeStyles[size].text}
          `.trim().replace(/\s+/g, ' ')}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

Avatar.Group = AvatarGroup;
