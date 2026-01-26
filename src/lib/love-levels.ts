/**
 * Sistema de Níveis de Amor - Arena Te Amo
 * 5 níveis de reação, cada um com efeitos diferentes
 */

export interface LoveLevel {
  id: number;
  name: string;
  emoji: string;
  cost: number;        // Corações que CUSTA para dar
  reward: number;      // Corações que o AUTOR recebe
  description: string;
  color: string;
  bgColor: string;
  animation?: string;
}

export const LOVE_LEVELS: LoveLevel[] = [
  {
    id: 1,
    name: 'Curti',
    emoji: '🤍',
    cost: 0,
    reward: 1,
    description: 'Curtida básica',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  {
    id: 2,
    name: 'Te Amo',
    emoji: '❤️',
    cost: 0,
    reward: 2,
    description: 'Demonstra carinho',
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
  {
    id: 3,
    name: 'Te Amo Muito',
    emoji: '❤️‍🔥',
    cost: 5,
    reward: 10,
    description: 'Amor intenso!',
    color: 'text-orange-500',
    bgColor: 'bg-gradient-to-r from-red-100 to-orange-100',
    animation: 'animate-pulse',
  },
  {
    id: 4,
    name: 'Super Te Amo',
    emoji: '💝',
    cost: 20,
    reward: 50,
    description: 'Post ganha badge especial',
    color: 'text-pink-500',
    bgColor: 'bg-gradient-to-r from-pink-100 to-purple-100',
    animation: 'animate-bounce',
  },
  {
    id: 5,
    name: 'Te Amo Real',
    emoji: '👑',
    cost: 100,
    reward: 200,
    description: 'Post vira destaque do dia!',
    color: 'text-yellow-500',
    bgColor: 'bg-gradient-to-r from-yellow-100 to-amber-100',
    animation: 'animate-pulse',
  },
];

export function getLoveLevel(id: number): LoveLevel | undefined {
  return LOVE_LEVELS.find(l => l.id === id);
}

export function getDefaultLevel(): LoveLevel {
  return LOVE_LEVELS[1]; // Te Amo (nível 2)
}

/**
 * Streak de Like - Recompensas por dias seguidos
 */
export const STREAK_REWARDS = [
  { days: 7, hearts: 50, badge: null, message: '1 semana de amor!' },
  { days: 14, hearts: 100, badge: 'streak_14', message: '2 semanas de amor!' },
  { days: 30, hearts: 500, badge: 'streak_30', message: '1 mês de amor!' },
  { days: 60, hearts: 1000, badge: 'streak_60', message: '2 meses de amor!' },
  { days: 100, hearts: 2000, badge: 'streak_100', message: '100 dias de amor! 🎉' },
];

export function getStreakReward(days: number) {
  // Retorna a maior recompensa que o usuário pode receber
  const rewards = STREAK_REWARDS.filter(r => r.days <= days);
  return rewards[rewards.length - 1] || null;
}

/**
 * Recompensas por dar likes (Like Surpresa)
 */
export const LIKES_GIVEN_REWARDS = [
  { likes: 10, hearts: 5 },
  { likes: 50, hearts: 25 },
  { likes: 100, hearts: 50, badge: 'love_spreader' },
  { likes: 500, hearts: 250, badge: 'love_champion' },
  { likes: 1000, hearts: 500, badge: 'love_legend', specialReward: 'moco_message' },
];

export function getLikesGivenReward(totalLikes: number) {
  const rewards = LIKES_GIVEN_REWARDS.filter(r => r.likes <= totalLikes);
  return rewards[rewards.length - 1] || null;
}

/**
 * Combo de likes - Curtir rápido em sequência
 */
export const COMBO_REWARDS = [
  { combo: 5, hearts: 5, name: 'COMBO!' },
  { combo: 10, hearts: 20, name: 'ULTRA COMBO!' },
  { combo: 15, hearts: 50, name: 'MEGA COMBO!' },
  { combo: 20, hearts: 100, name: 'INSANE COMBO!' },
];

export function getComboReward(comboCount: number) {
  const rewards = COMBO_REWARDS.filter(r => r.combo <= comboCount);
  return rewards[rewards.length - 1] || null;
}
