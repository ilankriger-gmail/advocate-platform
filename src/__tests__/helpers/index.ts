/**
 * Helper functions para cenários comuns de teste
 *
 * Estas funções combinam os mocks e factories para facilitar a configuração
 * de cenários de teste comuns, reduzindo código boilerplate nos testes.
 */

import {
  resetSupabaseMocks,
  setMockUser,
  setMockData,
} from '../mocks/supabase';
import {
  createMockUser,
  createMockAdmin,
  createMockUserCoins,
  resetFactories,
} from '../factories';
import type { User } from '@/lib/supabase/types';

/**
 * Configuração de usuário autenticado
 */
export interface AuthenticatedUserSetup {
  user: User;
  coinBalance?: number;
}

/**
 * Configura um usuário autenticado para testes
 *
 * @param options - Opções de configuração do usuário
 * @returns O usuário criado
 *
 * @example
 * ```ts
 * const user = setupAuthenticatedUser({ coinBalance: 500 });
 * // Agora auth.getUser() retornará este usuário
 * // E a tabela user_coins terá um registro com 500 moedas
 * ```
 */
export const setupAuthenticatedUser = (
  options: Partial<User> & { coinBalance?: number } = {}
): User => {
  const { coinBalance = 100, ...userOverrides } = options;

  // Cria o usuário
  const user = createMockUser(userOverrides);

  // Configura autenticação
  setMockUser(user);

  // Configura saldo de moedas
  const userCoins = createMockUserCoins({
    user_id: user.id,
    balance: coinBalance,
  });
  setMockData('user_coins', [userCoins]);

  // Configura perfil (usado em alguns actions)
  setMockData('profiles', [{
    id: user.id,
    role: user.role,
    is_creator: user.is_creator,
  }]);

  return user;
};

/**
 * Configura um usuário admin/creator autenticado para testes
 *
 * @param options - Opções de configuração do usuário admin
 * @returns O usuário admin criado
 *
 * @example
 * ```ts
 * const admin = setupAdminUser();
 * // Agora auth.getUser() retornará este admin
 * // O usuário terá role='creator' e is_creator=true
 * ```
 */
export const setupAdminUser = (
  options: Partial<User> & { coinBalance?: number } = {}
): User => {
  const { coinBalance = 100, ...userOverrides } = options;

  // Cria o usuário admin
  const admin = createMockAdmin(userOverrides);

  // Configura autenticação
  setMockUser(admin);

  // Configura saldo de moedas
  const userCoins = createMockUserCoins({
    user_id: admin.id,
    balance: coinBalance,
  });
  setMockData('user_coins', [userCoins]);

  // Configura perfil (usado em alguns actions)
  setMockData('profiles', [{
    id: admin.id,
    role: admin.role,
    is_creator: admin.is_creator,
  }]);

  return admin;
};

/**
 * Reseta todos os mocks e factories para um estado limpo
 *
 * Deve ser chamado em beforeEach() ou afterEach() para garantir
 * isolamento entre testes.
 *
 * @example
 * ```ts
 * describe('My tests', () => {
 *   beforeEach(() => {
 *     resetMocks();
 *   });
 *
 *   it('should...', () => {
 *     // Teste com estado limpo
 *   });
 * });
 * ```
 */
export const resetMocks = (): void => {
  resetSupabaseMocks();
  resetFactories();
};

/**
 * Configura um cenário completo de teste com usuário e dados
 *
 * Útil para testes mais complexos que precisam de múltiplos dados
 * configurados.
 *
 * @param setup - Função de configuração customizada
 * @returns Resultado da função de setup
 *
 * @example
 * ```ts
 * const { user, reward } = setupTestScenario(() => {
 *   const user = setupAuthenticatedUser({ coinBalance: 500 });
 *   const reward = createMockReward({ coins_required: 200 });
 *   setMockData('rewards', [reward]);
 *   return { user, reward };
 * });
 * ```
 */
export const setupTestScenario = <T>(setup: () => T): T => {
  resetMocks();
  return setup();
};
