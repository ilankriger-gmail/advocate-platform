export interface MocoBotConfig {
  enabled: boolean;
  probCurtirPost: number;
  probComentarPost: number;
  probResponderComment: number;
  delayCurtirMin: number;
  delayCurtirMax: number;
  delayComentarMin: number;
  delayComentarMax: number;
  delayResponderMin: number;
  delayResponderMax: number;
}

export const DEFAULT_CONFIG: MocoBotConfig = {
  enabled: true,
  probCurtirPost: 0.80,
  probComentarPost: 0.40,
  probResponderComment: 0.67,
  delayCurtirMin: 5 * 60 * 1000,
  delayCurtirMax: 60 * 60 * 1000,
  delayComentarMin: 10 * 60 * 1000,
  delayComentarMax: 2 * 60 * 60 * 1000,
  delayResponderMin: 3 * 60 * 1000,
  delayResponderMax: 2 * 60 * 60 * 1000,
};

export interface BotStats {
  totalToday: number;
  pending: number;
  completedToday: number;
  failedToday: number;
  byType: { likes: number; comments: number; replies: number };
}

export interface RecentAction {
  id: string;
  action_type: string;
  post_id: string;
  comment_id: string | null;
  response_text: string | null;
  scheduled_for: string;
  executed_at: string | null;
  status: string;
  created_at: string;
}
