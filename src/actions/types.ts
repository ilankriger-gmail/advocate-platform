/**
 * Tipos compartilhados para Server Actions
 *
 * Este arquivo centraliza tipos comuns utilizados em múltiplos arquivos de actions
 * para evitar duplicação e manter consistência.
 */

/**
 * Resposta padrão para Server Actions
 *
 * @property error - Mensagem de erro (quando a operação falha)
 * @property success - Indica se a operação foi bem-sucedida
 * @property data - Dados retornados pela operação (opcional)
 */
export type ActionResponse<T = any> = {
  error?: string;
  success?: boolean;
  data?: T;
};

/**
 * Status comuns de participação em desafios
 */
export type ChallengeParticipationStatus = 'pending' | 'approved' | 'rejected';

/**
 * Status comuns de desafios
 */
export type ChallengeStatus = 'active' | 'completed' | 'cancelled';

/**
 * Status comuns de resgates de recompensas
 */
export type RewardClaimStatus = 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered';

/**
 * Status comuns de registros de eventos
 */
export type EventRegistrationStatus = 'registered' | 'confirmed' | 'cancelled' | 'checked_in' | 'completed';

/**
 * Tipos de desafios
 */
export type ChallengeType = 'fisico' | 'social' | 'conteudo';

/**
 * Tipos de transações de moedas
 */
export type CoinTransactionType = 'earned' | 'spent' | 'bonus' | 'refund';
