/**
 * Testes para actions de recompensas
 */

import { claimReward } from '@/actions/rewards';
import {
  resetMocks,
  setupAuthenticatedUser,
} from '../helpers';
import {
  createMockReward,
} from '../factories';
import { setMockData } from '../mocks/supabase';

// Mock do módulo Supabase server
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => require('../mocks/supabase').mockSupabaseClient),
}));

// Mock do Next.js cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('claimReward', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Validações', () => {
    it('deve rejeitar usuário não autenticado', async () => {
      // Arrange: Sem autenticação (nenhum usuário configurado)
      const reward = createMockReward();
      setMockData('rewards', [reward]);

      // Act
      const result = await claimReward(reward.id);

      // Assert
      expect(result.error).toBe('Usuario nao autenticado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando recompensa não existe', async () => {
      // Arrange: Usuário autenticado mas recompensa não existe
      setupAuthenticatedUser({ coinBalance: 500 });
      const nonExistentRewardId = 'non-existent-reward-id';

      // Act
      const result = await claimReward(nonExistentRewardId);

      // Assert
      expect(result.error).toBe('Recompensa nao encontrada');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando recompensa está inativa', async () => {
      // Arrange: Usuário autenticado e recompensa inativa
      setupAuthenticatedUser({ coinBalance: 500 });
      const inactiveReward = createMockReward({
        is_active: false,
        coins_required: 100,
      });
      setMockData('rewards', [inactiveReward]);

      // Act
      const result = await claimReward(inactiveReward.id);

      // Assert
      expect(result.error).toBe('Recompensa nao encontrada');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando estoque está esgotado', async () => {
      // Arrange: Usuário autenticado e recompensa sem estoque
      setupAuthenticatedUser({ coinBalance: 500 });
      const outOfStockReward = createMockReward({
        coins_required: 100,
        quantity_available: 0,
      });
      setMockData('rewards', [outOfStockReward]);

      // Act
      const result = await claimReward(outOfStockReward.id);

      // Assert
      expect(result.error).toBe('Estoque esgotado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando saldo é insuficiente', async () => {
      // Arrange: Usuário com pouco saldo
      setupAuthenticatedUser({ coinBalance: 50 });
      const expensiveReward = createMockReward({
        coins_required: 100,
        quantity_available: 5,
      });
      setMockData('rewards', [expensiveReward]);

      // Act
      const result = await claimReward(expensiveReward.id);

      // Assert
      expect(result.error).toBe('Saldo insuficiente');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando usuário não tem registro de moedas', async () => {
      // Arrange: Usuário autenticado mas sem registro na tabela user_coins
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      // Remove o registro de moedas
      setMockData('user_coins', []);

      const reward = createMockReward({
        coins_required: 50,
        quantity_available: 5,
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await claimReward(reward.id);

      // Assert
      expect(result.error).toBe('Saldo insuficiente');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando saldo é exatamente 1 moeda menor que necessário', async () => {
      // Arrange: Edge case - saldo 99, requer 100
      setupAuthenticatedUser({ coinBalance: 99 });
      const reward = createMockReward({
        coins_required: 100,
        quantity_available: 5,
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await claimReward(reward.id);

      // Assert
      expect(result.error).toBe('Saldo insuficiente');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar múltiplas validações em ordem de prioridade', async () => {
      // Arrange: Sem autenticação e recompensa não existe
      // A primeira validação (autenticação) deve ser verificada primeiro
      const nonExistentRewardId = 'non-existent-reward-id';

      // Act
      const result = await claimReward(nonExistentRewardId);

      // Assert: Deve falhar na autenticação, não na recompensa
      expect(result.error).toBe('Usuario nao autenticado');
    });

    it('deve validar estoque antes de saldo', async () => {
      // Arrange: Usuário autenticado, sem estoque e sem saldo suficiente
      setupAuthenticatedUser({ coinBalance: 50 });
      const reward = createMockReward({
        coins_required: 100,
        quantity_available: 0, // Sem estoque
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await claimReward(reward.id);

      // Assert: Deve falhar no estoque antes de verificar saldo
      expect(result.error).toBe('Estoque esgotado');
    });

    it('deve aceitar quando saldo é exatamente igual ao necessário', async () => {
      // Arrange: Edge case - saldo exato
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      const reward = createMockReward({
        coins_required: 100,
        quantity_available: 5,
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await claimReward(reward.id);

      // Assert: Não deve ter erro de saldo
      expect(result.error).not.toBe('Saldo insuficiente');
    });
  });
});
