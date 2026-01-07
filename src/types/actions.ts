/**
 * Tipos relacionados a respostas de Server Actions
 */

/**
 * Tipo generico de resposta de actions do servidor
 *
 * @template T - Tipo do dado retornado (default: unknown para compatibilidade)
 *
 * @example
 * // Sem tipo especifico (backward compatible)
 * const result: ActionResponse = await myAction();
 *
 * @example
 * // Com tipo especifico
 * const result: ActionResponse<User> = await getUserAction();
 * if (result.data) {
 *   console.log(result.data.name); // TypeScript knows data is User
 * }
 */
export type ActionResponse<T = unknown> = {
  /** Mensagem de erro, se houver */
  error?: string;
  /** Indica se a operacao foi bem-sucedida */
  success?: boolean;
  /** Dados retornados pela action */
  data?: T;
};
