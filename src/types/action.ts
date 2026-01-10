/**
 * Tipos para Server Actions
 */

/**
 * Resposta padrão para Server Actions
 *
 * @template T - Tipo dos dados retornados (default: void para acoes que nao retornam dados)
 *
 * @example
 * // Acao que nao retorna dados
 * async function deleteItem(): Promise<ActionResponse> {
 *   return { success: true };
 * }
 *
 * @example
 * // Acao que retorna um objeto Event
 * async function createEvent(): Promise<ActionResponse<Event>> {
 *   return { success: true, data: event };
 * }
 *
 * @example
 * // Acao que retorna um array de Challenges
 * async function getChallenges(): Promise<ActionResponse<Challenge[]>> {
 *   return { success: true, data: challenges };
 * }
 */
export type ActionResponse<T = void> = {
  /** Mensagem de erro, quando houver falha */
  error?: string;

  /** Indicador de sucesso da operação */
  success?: boolean;

  /** Dados retornados pela ação (tipados conforme T) */
  data?: T;

  /** Mensagem informativa (ex: moderação pendente) */
  message?: string;
};

/**
 * Resposta específica para criação de post
 * Inclui informações de moderação para feedback ao usuário
 */
export type CreatePostResponse<T = void> = ActionResponse<T> & {
  /** Status da decisão de moderação */
  moderationStatus?: 'approved' | 'pending_review' | 'blocked';

  /** Categoria do conteúdo detectada */
  contentCategory?: 'normal' | 'help_request';

  /** Motivos do bloqueio (quando bloqueado) */
  blockedReasons?: string[];
};
