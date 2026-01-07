/**
 * Testes para queries de recompensas
 */

import { canClaimReward, getRewardsStats } from '@/lib/supabase/rewards';
import {
  resetMocks,
  setupAuthenticatedUser,
} from '../../helpers';
import {
  createMockReward,
} from '../../factories';
import { setMockData } from '../../mocks/supabase';

// Mock do módulo Supabase server
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => require('../../mocks/supabase').mockSupabaseClient),
}));

describe('canClaimReward', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Validações', () => {
    it('deve retornar false quando usuário não está autenticado', async () => {
      // Arrange: Sem autenticação (nenhum usuário configurado)
      const reward = createMockReward();
      setMockData('rewards', [reward]);

      // Act
      const result = await canClaimReward(reward.id);

      // Assert
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Usuario nao autenticado');
    });

    it('deve retornar false quando recompensa não existe', async () => {
      // Arrange: Usuário autenticado mas recompensa não existe
      setupAuthenticatedUser({ coinBalance: 500 });
      const nonExistentRewardId = 'non-existent-reward-id';

      // Act
      const result = await canClaimReward(nonExistentRewardId);

      // Assert
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Recompensa nao encontrada');
    });

    it('deve retornar false quando recompensa está inativa', async () => {
      // Arrange: Usuário autenticado e recompensa inativa
      setupAuthenticatedUser({ coinBalance: 500 });
      const inactiveReward = createMockReward({
        is_active: false,
        coins_required: 100,
        quantity_available: 5,
      });
      setMockData('rewards', [inactiveReward]);

      // Act
      const result = await canClaimReward(inactiveReward.id);

      // Assert
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Recompensa nao disponivel');
    });

    it('deve retornar false quando estoque está esgotado', async () => {
      // Arrange: Usuário autenticado e recompensa sem estoque
      setupAuthenticatedUser({ coinBalance: 500 });
      const outOfStockReward = createMockReward({
        coins_required: 100,
        quantity_available: 0,
        is_active: true,
      });
      setMockData('rewards', [outOfStockReward]);

      // Act
      const result = await canClaimReward(outOfStockReward.id);

      // Assert
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Estoque esgotado');
    });

    it('deve retornar false quando estoque é negativo', async () => {
      // Arrange: Edge case - estoque negativo
      setupAuthenticatedUser({ coinBalance: 500 });
      const negativeStockReward = createMockReward({
        coins_required: 100,
        quantity_available: -1,
        is_active: true,
      });
      setMockData('rewards', [negativeStockReward]);

      // Act
      const result = await canClaimReward(negativeStockReward.id);

      // Assert
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Estoque esgotado');
    });

    it('deve retornar false quando saldo é insuficiente', async () => {
      // Arrange: Usuário com pouco saldo
      setupAuthenticatedUser({ coinBalance: 50 });
      const expensiveReward = createMockReward({
        coins_required: 100,
        quantity_available: 5,
        is_active: true,
      });
      setMockData('rewards', [expensiveReward]);

      // Act
      const result = await canClaimReward(expensiveReward.id);

      // Assert
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Saldo insuficiente');
    });

    it('deve retornar false quando usuário não tem registro de moedas', async () => {
      // Arrange: Usuário autenticado mas sem registro na tabela user_coins
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      // Remove o registro de moedas
      setMockData('user_coins', []);

      const reward = createMockReward({
        coins_required: 50,
        quantity_available: 5,
        is_active: true,
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await canClaimReward(reward.id);

      // Assert
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Saldo insuficiente');
    });

    it('deve retornar false quando saldo é exatamente 1 moeda menor que necessário', async () => {
      // Arrange: Edge case - saldo 99, requer 100
      setupAuthenticatedUser({ coinBalance: 99 });
      const reward = createMockReward({
        coins_required: 100,
        quantity_available: 5,
        is_active: true,
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await canClaimReward(reward.id);

      // Assert
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Saldo insuficiente');
    });

    it('deve validar em ordem de prioridade: autenticação > recompensa > status > estoque > saldo', async () => {
      // Arrange: Sem autenticação e recompensa não existe
      // A primeira validação (autenticação) deve ser verificada primeiro
      const nonExistentRewardId = 'non-existent-reward-id';

      // Act
      const result = await canClaimReward(nonExistentRewardId);

      // Assert: Deve falhar na autenticação, não na recompensa
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Usuario nao autenticado');
    });

    it('deve validar estoque antes de saldo', async () => {
      // Arrange: Usuário autenticado, sem estoque e sem saldo suficiente
      setupAuthenticatedUser({ coinBalance: 50 });
      const reward = createMockReward({
        coins_required: 100,
        quantity_available: 0, // Sem estoque
        is_active: true,
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await canClaimReward(reward.id);

      // Assert: Deve falhar no estoque antes de verificar saldo
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Estoque esgotado');
    });

    it('deve validar status ativo antes de estoque', async () => {
      // Arrange: Usuário autenticado, recompensa inativa e sem estoque
      setupAuthenticatedUser({ coinBalance: 500 });
      const reward = createMockReward({
        coins_required: 100,
        quantity_available: 0,
        is_active: false,
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await canClaimReward(reward.id);

      // Assert: Deve falhar no status antes de verificar estoque
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Recompensa nao disponivel');
    });
  });

  describe('Cenários de Sucesso', () => {
    it('deve retornar true quando usuário pode resgatar recompensa', async () => {
      // Arrange: Usuário com saldo suficiente e recompensa disponível
      setupAuthenticatedUser({ coinBalance: 500 });
      const reward = createMockReward({
        coins_required: 100,
        quantity_available: 5,
        is_active: true,
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await canClaimReward(reward.id);

      // Assert
      expect(result.canClaim).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('deve retornar true quando saldo é exatamente igual ao necessário', async () => {
      // Arrange: Edge case - saldo exato
      setupAuthenticatedUser({ coinBalance: 100 });
      const reward = createMockReward({
        coins_required: 100,
        quantity_available: 5,
        is_active: true,
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await canClaimReward(reward.id);

      // Assert
      expect(result.canClaim).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('deve retornar true quando estoque é exatamente 1', async () => {
      // Arrange: Edge case - última unidade disponível
      setupAuthenticatedUser({ coinBalance: 500 });
      const lastUnitReward = createMockReward({
        coins_required: 100,
        quantity_available: 1,
        is_active: true,
      });
      setMockData('rewards', [lastUnitReward]);

      // Act
      const result = await canClaimReward(lastUnitReward.id);

      // Assert
      expect(result.canClaim).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('deve retornar true quando usuário tem muito mais saldo que necessário', async () => {
      // Arrange: Usuário com saldo muito maior
      setupAuthenticatedUser({ coinBalance: 10000 });
      const cheapReward = createMockReward({
        coins_required: 10,
        quantity_available: 100,
        is_active: true,
      });
      setMockData('rewards', [cheapReward]);

      // Act
      const result = await canClaimReward(cheapReward.id);

      // Assert
      expect(result.canClaim).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('deve retornar true para recompensa gratuita (0 moedas)', async () => {
      // Arrange: Recompensa gratuita
      setupAuthenticatedUser({ coinBalance: 0 });
      const freeReward = createMockReward({
        coins_required: 0,
        quantity_available: 10,
        is_active: true,
      });
      setMockData('rewards', [freeReward]);

      // Act
      const result = await canClaimReward(freeReward.id);

      // Assert
      expect(result.canClaim).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('deve avaliar recompensas diferentes de forma independente', async () => {
      // Arrange: Usuário com saldo para resgatar apenas uma das recompensas
      setupAuthenticatedUser({ coinBalance: 150 });

      const affordableReward = createMockReward({
        id: 'affordable-reward',
        coins_required: 100,
        quantity_available: 5,
        is_active: true,
      });

      const expensiveReward = createMockReward({
        id: 'expensive-reward',
        coins_required: 200,
        quantity_available: 5,
        is_active: true,
      });

      setMockData('rewards', [affordableReward, expensiveReward]);

      // Act
      const result1 = await canClaimReward(affordableReward.id);
      const result2 = await canClaimReward(expensiveReward.id);

      // Assert: Pode resgatar a mais barata mas não a mais cara
      expect(result1.canClaim).toBe(true);
      expect(result1.reason).toBeUndefined();

      expect(result2.canClaim).toBe(false);
      expect(result2.reason).toBe('Saldo insuficiente');
    });
  });
});
