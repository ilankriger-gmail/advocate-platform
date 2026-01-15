/**
 * Constantes da Plataforma de Comunidade de Criador
 */

// Cores do tema
export const COLORS = {
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#b91c1c',
  },
} as const;

// Status de posts
export const POST_STATUS = {
  pending: { label: 'Pendente', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  approved: { label: 'Aprovado', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: 'Rejeitado', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  blocked: { label: 'Bloqueado', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
} as const;

// Tipos de post
export const POST_TYPES = {
  creator: { label: 'Criador', color: 'purple', icon: 'Star' },
  community: { label: 'Comunidade', color: 'blue', icon: 'Users' },
} as const;

// Limites
export const LIMITS = {
  MAX_POSTS_PER_DAY: 5,
  MAX_COMMENTS_PER_POST: 100,
  MAX_MEDIA_PER_POST: 5,
  MAX_BIO_LENGTH: 500,
  MAX_TITLE_LENGTH: 100,
} as const;

// Rotas protegidas (requerem login)
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/desafios',
  '/premios',
  '/perfil',
] as const;

// Rotas de autenticação
export const AUTH_ROUTES = ['/login', '/registro'] as const;

// Rotas apenas para criador
export const CREATOR_ROUTES = ['/admin', '/moderation'] as const;

// Navegação principal (usuário logado)
export const MAIN_NAV = [
  { href: '/', label: 'Início', icon: 'Home' },
  { href: '/descobrir', label: 'Descobrir', icon: 'Search' },
  { href: '/desafios', label: 'Desafios', icon: 'Target' },
  { href: '/eventos', label: 'Eventos', icon: 'Calendar' },
  { href: '/premios', label: 'Prêmios', icon: 'Gift' },
  { href: '/perfil', label: 'Perfil', icon: 'User' },
] as const;

// Navegação bottom bar mobile (mesmos itens do sidebar)
export const BOTTOM_NAV_ITEMS = [
  { href: '/', label: 'Início', icon: 'Home' },
  { href: '/descobrir', label: 'Descobrir', icon: 'Search' },
  { href: '/desafios', label: 'Desafios', icon: 'Target' },
  { href: '/eventos', label: 'Eventos', icon: 'Calendar' },
  { href: '/premios', label: 'Prêmios', icon: 'Gift' },
  { href: '/perfil', label: 'Perfil', icon: 'User' },
] as const;

// Navegação do criador/admin (adicional)
export const CREATOR_NAV = [
  { href: '/admin', label: 'Painel Admin', icon: 'Shield' },
  { href: '/admin/moderacao', label: 'Moderação', icon: 'Shield' },
  { href: '/admin/posts', label: 'Moderar Posts', icon: 'FileText' },
  { href: '/admin/desafios', label: 'Desafios', icon: 'Target' },
  { href: '/admin/eventos', label: 'Eventos', icon: 'Calendar' },
  { href: '/admin/premios', label: 'Prêmios', icon: 'Gift' },
  { href: '/admin/usuarios', label: 'Usuários', icon: 'Users' },
  { href: '/admin/leads', label: 'Leads NPS', icon: 'Chart' },
  { href: '/admin/landing-pages', label: 'Landing Pages', icon: 'Layout' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'Chart' },
  { href: '/admin/notificacoes', label: 'Notificações', icon: 'Bell' },
  { href: '/admin/emails', label: 'Emails', icon: 'Mail' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: 'Settings' },
] as const;

// Links de redes sociais
export const SOCIAL_LINKS = {
  instagram: {
    label: 'Instagram',
    icon: 'Instagram',
    baseUrl: 'https://instagram.com/',
  },
  tiktok: {
    label: 'TikTok',
    icon: 'Music',
    baseUrl: 'https://tiktok.com/@',
  },
  youtube: {
    label: 'YouTube',
    icon: 'Youtube',
    baseUrl: 'https://youtube.com/@',
  },
  twitter: {
    label: 'Twitter/X',
    icon: 'Twitter',
    baseUrl: 'https://twitter.com/',
  },
} as const;

// Configurações de upload
export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  acceptedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  acceptedVídeoTypes: ['vídeo/mp4', 'vídeo/webm'],
} as const;

// Status de campanhas (mantido para compatibilidade)
export const CAMPAIGN_STATUS = {
  draft: { label: 'Rascunho', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  active: { label: 'Ativa', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  paused: { label: 'Pausada', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  completed: { label: 'Concluida', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
} as const;

// Status de resgates (mantido para compatibilidade)
export const CLAIM_STATUS = {
  pending: { label: 'Pendente', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  approved: { label: 'Aprovado', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  shipped: { label: 'Enviado', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  delivered: { label: 'Entregue', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  cancelled: { label: 'Cancelado', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
} as const;
