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
  createMockCoinTransaction,
  createMockRewardClaim,
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
      expect(result.reason).toBe('Usuário não autenticado');
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
      expect(result.reason).toBe('Recompensa não disponível');
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
      expect(result.reason).toBe('Usuário não autenticado');
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
      expect(result.reason).toBe('Recompensa não disponível');
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

describe('getRewardsStats', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Validações', () => {
    it('deve retornar null quando usuário não está autenticado', async () => {
      // Arrange: Sem autenticação (nenhum usuário configurado)

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Cenários de Dados Vazios', () => {
    it('deve retornar estatísticas zeradas quando usuário não tem dados', async () => {
      // Arrange: Usuário autenticado mas sem transações ou resgates
      const user = setupAuthenticatedUser({ coinBalance: 0 });
      // Não adiciona transações nem resgates
      setMockData('coin_transactions', []);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result).toEqual({
        current_balance: 0,
        total_earned: 0,
        total_spent: 0,
        total_claims: 0,
        pending_claims: 0,
        delivered_claims: 0,
      });
    });

    it('deve retornar estatísticas zeradas quando usuário não tem registro de moedas', async () => {
      // Arrange: Usuário autenticado mas sem registro na tabela user_coins
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      setMockData('user_coins', []); // Remove o registro de moedas
      setMockData('coin_transactions', []);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result).toEqual({
        current_balance: 0,
        total_earned: 0,
        total_spent: 0,
        total_claims: 0,
        pending_claims: 0,
        delivered_claims: 0,
      });
    });
  });

  describe('Cálculo de Moedas Ganhas', () => {
    it('deve calcular corretamente total_earned com uma transação', async () => {
      // Arrange: Usuário com uma transação de ganho
      const user = setupAuthenticatedUser({ coinBalance: 50 });
      const transaction = createMockCoinTransaction({
        user_id: user.id,
        amount: 50,
        type: 'earned',
        description: 'Completed challenge',
      });
      setMockData('coin_transactions', [transaction]);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result).toEqual({
        current_balance: 50,
        total_earned: 50,
        total_spent: 0,
        total_claims: 0,
        pending_claims: 0,
        delivered_claims: 0,
      });
    });

    it('deve calcular corretamente total_earned com múltiplas transações', async () => {
      // Arrange: Usuário com múltiplas transações de ganho
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const transactions = [
        createMockCoinTransaction({
          user_id: user.id,
          amount: 50,
          type: 'earned',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: 75,
          type: 'earned',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: 100,
          type: 'earned',
        }),
      ];
      setMockData('coin_transactions', transactions);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result?.total_earned).toBe(225); // 50 + 75 + 100
    });

    it('deve ignorar transações de gasto ao calcular total_earned', async () => {
      // Arrange: Usuário com transações mistas
      const user = setupAuthenticatedUser({ coinBalance: 50 });
      const transactions = [
        createMockCoinTransaction({
          user_id: user.id,
          amount: 100,
          type: 'earned',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: -50,
          type: 'spent',
        }),
      ];
      setMockData('coin_transactions', transactions);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result?.total_earned).toBe(100); // Apenas a transação 'earned'
    });
  });

  describe('Cálculo de Moedas Gastas', () => {
    it('deve calcular corretamente total_spent com uma transação', async () => {
      // Arrange: Usuário com uma transação de gasto
      const user = setupAuthenticatedUser({ coinBalance: 50 });
      const transaction = createMockCoinTransaction({
        user_id: user.id,
        amount: -50,
        type: 'spent',
        description: 'Claimed reward',
      });
      setMockData('coin_transactions', [transaction]);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result).toEqual({
        current_balance: 50,
        total_earned: 0,
        total_spent: 50, // Valor absoluto
        total_claims: 0,
        pending_claims: 0,
        delivered_claims: 0,
      });
    });

    it('deve calcular corretamente total_spent com múltiplas transações', async () => {
      // Arrange: Usuário com múltiplas transações de gasto
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      const transactions = [
        createMockCoinTransaction({
          user_id: user.id,
          amount: -50,
          type: 'spent',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: -75,
          type: 'spent',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: -25,
          type: 'spent',
        }),
      ];
      setMockData('coin_transactions', transactions);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result?.total_spent).toBe(150); // 50 + 75 + 25 (valores absolutos)
    });

    it('deve converter valores negativos para positivos em total_spent', async () => {
      // Arrange: Garantir que valores negativos são convertidos para absolutos
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      const transaction = createMockCoinTransaction({
        user_id: user.id,
        amount: -100,
        type: 'spent',
      });
      setMockData('coin_transactions', [transaction]);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result?.total_spent).toBe(100); // Valor absoluto de -100
    });

    it('deve ignorar transações de ganho ao calcular total_spent', async () => {
      // Arrange: Usuário com transações mistas
      const user = setupAuthenticatedUser({ coinBalance: 150 });
      const transactions = [
        createMockCoinTransaction({
          user_id: user.id,
          amount: 200,
          type: 'earned',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: -50,
          type: 'spent',
        }),
      ];
      setMockData('coin_transactions', transactions);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result?.total_spent).toBe(50); // Apenas a transação 'spent'
    });
  });

  describe('Cálculo de Resgates', () => {
    it('deve calcular corretamente total_claims', async () => {
      // Arrange: Usuário com múltiplos resgates
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      const claims = [
        createMockRewardClaim({ user_id: user.id, status: 'pending' }),
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
        createMockRewardClaim({ user_id: user.id, status: 'cancelled' }),
      ];
      setMockData('reward_claims', claims);
      setMockData('coin_transactions', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result?.total_claims).toBe(3);
    });

    it('deve calcular corretamente pending_claims', async () => {
      // Arrange: Usuário com resgates pendentes
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      const claims = [
        createMockRewardClaim({ user_id: user.id, status: 'pending' }),
        createMockRewardClaim({ user_id: user.id, status: 'pending' }),
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
      ];
      setMockData('reward_claims', claims);
      setMockData('coin_transactions', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result?.pending_claims).toBe(2);
    });

    it('deve calcular corretamente delivered_claims', async () => {
      // Arrange: Usuário com resgates entregues
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      const claims = [
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
        createMockRewardClaim({ user_id: user.id, status: 'pending' }),
      ];
      setMockData('reward_claims', claims);
      setMockData('coin_transactions', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result?.delivered_claims).toBe(3);
    });

    it('deve contar apenas resgates do usuário autenticado', async () => {
      // Arrange: Usuário com resgates próprios e de outros usuários
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      const otherUserId = 'other-user-id';
      const claims = [
        createMockRewardClaim({ user_id: user.id, status: 'pending' }),
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
        createMockRewardClaim({ user_id: otherUserId, status: 'pending' }),
        createMockRewardClaim({ user_id: otherUserId, status: 'delivered' }),
      ];
      setMockData('reward_claims', claims);
      setMockData('coin_transactions', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      // Deve contar apenas os 2 resgates do usuário autenticado
      expect(result?.total_claims).toBe(2);
      expect(result?.pending_claims).toBe(1);
      expect(result?.delivered_claims).toBe(1);
    });

    it('deve retornar 0 para resgates quando não há resgates', async () => {
      // Arrange: Usuário sem resgates
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      setMockData('reward_claims', []);
      setMockData('coin_transactions', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result?.total_claims).toBe(0);
      expect(result?.pending_claims).toBe(0);
      expect(result?.delivered_claims).toBe(0);
    });
  });

  describe('Cenários Completos', () => {
    it('deve calcular corretamente estatísticas completas com dados mistos', async () => {
      // Arrange: Cenário completo com transações e resgates
      const user = setupAuthenticatedUser({ coinBalance: 250 });

      // Transações: ganhou 500, gastou 250, saldo = 250
      const transactions = [
        createMockCoinTransaction({
          user_id: user.id,
          amount: 100,
          type: 'earned',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: 200,
          type: 'earned',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: 200,
          type: 'earned',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: -150,
          type: 'spent',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: -100,
          type: 'spent',
        }),
      ];

      // Resgates: 2 pendentes, 3 entregues
      const claims = [
        createMockRewardClaim({ user_id: user.id, status: 'pending' }),
        createMockRewardClaim({ user_id: user.id, status: 'pending' }),
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
      ];

      setMockData('coin_transactions', transactions);
      setMockData('reward_claims', claims);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result).toEqual({
        current_balance: 250,
        total_earned: 500, // 100 + 200 + 200
        total_spent: 250, // 150 + 100 (valores absolutos)
        total_claims: 5,
        pending_claims: 2,
        delivered_claims: 3,
      });
    });

    it('deve calcular corretamente quando usuário só ganhou moedas', async () => {
      // Arrange: Usuário que só ganhou moedas, nunca gastou
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const transactions = [
        createMockCoinTransaction({
          user_id: user.id,
          amount: 200,
          type: 'earned',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: 300,
          type: 'earned',
        }),
      ];
      setMockData('coin_transactions', transactions);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result).toEqual({
        current_balance: 500,
        total_earned: 500,
        total_spent: 0,
        total_claims: 0,
        pending_claims: 0,
        delivered_claims: 0,
      });
    });

    it('deve calcular corretamente quando usuário só gastou moedas', async () => {
      // Arrange: Usuário que só gastou moedas
      const user = setupAuthenticatedUser({ coinBalance: 0 });
      const transactions = [
        createMockCoinTransaction({
          user_id: user.id,
          amount: -100,
          type: 'spent',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: -50,
          type: 'spent',
        }),
      ];
      const claims = [
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
        createMockRewardClaim({ user_id: user.id, status: 'delivered' }),
      ];
      setMockData('coin_transactions', transactions);
      setMockData('reward_claims', claims);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result).toEqual({
        current_balance: 0,
        total_earned: 0,
        total_spent: 150, // 100 + 50
        total_claims: 2,
        pending_claims: 0,
        delivered_claims: 2,
      });
    });

    it('deve lidar com números grandes corretamente', async () => {
      // Arrange: Edge case com valores grandes
      const user = setupAuthenticatedUser({ coinBalance: 999999 });
      const transactions = [
        createMockCoinTransaction({
          user_id: user.id,
          amount: 1000000,
          type: 'earned',
        }),
        createMockCoinTransaction({
          user_id: user.id,
          amount: -1,
          type: 'spent',
        }),
      ];
      setMockData('coin_transactions', transactions);
      setMockData('reward_claims', []);

      // Act
      const result = await getRewardsStats();

      // Assert
      expect(result).toEqual({
        current_balance: 999999,
        total_earned: 1000000,
        total_spent: 1,
        total_claims: 0,
        pending_claims: 0,
        delivered_claims: 0,
      });
    });

    it('deve isolar estatísticas entre diferentes usuários', async () => {
      // Arrange: Múltiplos usuários com dados diferentes
      const user1 = setupAuthenticatedUser({ coinBalance: 100 });
      const user2Id = 'user-2-id';

      const transactions = [
        // Transações do user1
        createMockCoinTransaction({
          user_id: user1.id,
          amount: 100,
          type: 'earned',
        }),
        // Transações do user2 (não devem ser contadas)
        createMockCoinTransaction({
          user_id: user2Id,
          amount: 500,
          type: 'earned',
        }),
      ];

      const claims = [
        // Resgates do user1
        createMockRewardClaim({ user_id: user1.id, status: 'delivered' }),
        // Resgates do user2 (não devem ser contados)
        createMockRewardClaim({ user_id: user2Id, status: 'delivered' }),
        createMockRewardClaim({ user_id: user2Id, status: 'pending' }),
      ];

      setMockData('coin_transactions', transactions);
      setMockData('reward_claims', claims);

      // Act
      const result = await getRewardsStats();

      // Assert: Deve contar apenas dados do user1
      expect(result).toEqual({
        current_balance: 100,
        total_earned: 100,
        total_spent: 0,
        total_claims: 1,
        pending_claims: 0,
        delivered_claims: 1,
      });
    });
  });
});
