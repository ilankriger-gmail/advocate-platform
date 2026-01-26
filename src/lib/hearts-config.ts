/**
 * Configuração de corações por ação
 * 1 ação = 1 coração (flat)
 */
export const HEARTS_CONFIG = {
  // Conteúdo
  CREATE_POST: 1,
  LIKE_POST: 1,
  COMMENT: 1,
  SHARE: 1,
  SAVE_POST: 1,
  
  // Social
  FOLLOW: 1,
  BE_FOLLOWED: 1,
  REPLY_COMMENT: 1,
  MENTION: 1,
  
  // Perfil
  COMPLETE_PROFILE: 1,
  ADD_AVATAR: 1,
  ADD_BIO: 1,
  VERIFY_EMAIL: 1,
  
  // Engajamento
  DAILY_LOGIN: 1,
  WATCH_LIVE: 1,
  VOTE_POLL: 1,
  REACT_STORY: 1,
  
  // Crescimento
  INVITE_FRIEND: 1,
  FRIEND_ACCEPTED: 1,
  FIRST_POST: 1,
  STREAK_DAY: 1,
  
  // Eventos
  JOIN_EVENT: 1,
  ATTEND_EVENT: 1,
  
  // Desafios
  JOIN_CHALLENGE: 1,
  COMPLETE_CHALLENGE: 1,
  WIN_CHALLENGE: 1,
} as const;

export type HeartAction = keyof typeof HEARTS_CONFIG;
