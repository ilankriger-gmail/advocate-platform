/**
 * Testes para actions de recompensas
 */

import { claimReward, cancelClaim, addCoinsToUser } from '@/actions/rewards';
import {
  resetMocks,
  setupAuthenticatedUser,
  setupAdminUser,
} from '../helpers';
import {
  createMockReward,
  createMockRewardClaim,
  createMockUser,
} from '../factories';
import { setMockData, getMockData } from '../mocks/supabase';

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
      expect(result.error).toBe('Usuário não autenticado');
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
      expect(result.error).toBe('Usuário não autenticado');
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

  describe('Operações de Sucesso', () => {
    it('deve criar resgate com sucesso e deduzir moedas', async () => {
      // Arrange: Usuário com saldo suficiente
      const initialBalance = 500;
      const coinsRequired = 150;
      const initialStock = 10;

      const user = setupAuthenticatedUser({ coinBalance: initialBalance });
      const reward = createMockReward({
        coins_required: coinsRequired,
        quantity_available: initialStock,
      });
      setMockData('rewards', [reward]);

      // Act
      const result = await claimReward(reward.id);

      // Assert: Operação bem-sucedida
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();

      // Assert: Resgate criado corretamente
      const claims = getMockData('reward_claims');
      expect(claims).toHaveLength(1);
      expect(claims[0]).toMatchObject({
        user_id: user.id,
        reward_id: reward.id,
        status: 'pending',
        coins_spent: coinsRequired,
      });

      // Assert: Saldo foi deduzido corretamente
      const userCoins = getMockData('user_coins');
      expect(userCoins).toHaveLength(1);
      expect(userCoins[0].balance).toBe(initialBalance - coinsRequired);
      expect(userCoins[0].user_id).toBe(user.id);

      // Assert: Transação registrada
      const transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        user_id: user.id,
        amount: -coinsRequired,
        type: 'spent',
        reference_id: claims[0].id,
      });
      expect(transactions[0].description).toContain(reward.name);

      // Assert: Estoque decrementado
      const rewards = getMockData('rewards');
      expect(rewards).toHaveLength(1);
      expect(rewards[0].quantity_available).toBe(initialStock - 1);
    });
  });
});

describe('cancelClaim', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Validações', () => {
    it('deve rejeitar usuário não autenticado', async () => {
      // Arrange: Sem autenticação (nenhum usuário configurado)
      const claim = createMockRewardClaim();
      setMockData('reward_claims', [claim]);

      // Act
      const result = await cancelClaim(claim.id);

      // Assert
      expect(result.error).toBe('Usuário não autenticado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando resgate não existe', async () => {
      // Arrange: Usuário autenticado mas resgate não existe
      setupAuthenticatedUser({ coinBalance: 500 });
      const nonExistentClaimId = 'non-existent-claim-id';

      // Act
      const result = await cancelClaim(nonExistentClaimId);

      // Assert
      expect(result.error).toBe('Resgate não encontrado ou não pode ser cancelado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando resgate pertence a outro usuário', async () => {
      // Arrange: Usuário autenticado e resgate de outro usuário
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const otherUserId = 'other-user-id';

      const reward = createMockReward({ coins_required: 100 });
      const claim = createMockRewardClaim({
        user_id: otherUserId,
        reward_id: reward.id,
        coins_spent: 100,
        status: 'pending',
      });

      setMockData('rewards', [reward]);
      setMockData('reward_claims', [claim]);

      // Act
      const result = await cancelClaim(claim.id);

      // Assert
      expect(result.error).toBe('Resgate não encontrado ou não pode ser cancelado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando resgate já foi aprovado', async () => {
      // Arrange: Resgate em status 'approved'
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const reward = createMockReward({ coins_required: 100 });
      const approvedClaim = createMockRewardClaim({
        user_id: user.id,
        reward_id: reward.id,
        coins_spent: 100,
        status: 'approved',
      });

      setMockData('rewards', [reward]);
      setMockData('reward_claims', [approvedClaim]);

      // Act
      const result = await cancelClaim(approvedClaim.id);

      // Assert
      expect(result.error).toBe('Resgate não encontrado ou não pode ser cancelado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando resgate já foi enviado', async () => {
      // Arrange: Resgate em status 'shipped'
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const reward = createMockReward({ coins_required: 100 });
      const shippedClaim = createMockRewardClaim({
        user_id: user.id,
        reward_id: reward.id,
        coins_spent: 100,
        status: 'shipped',
      });

      setMockData('rewards', [reward]);
      setMockData('reward_claims', [shippedClaim]);

      // Act
      const result = await cancelClaim(shippedClaim.id);

      // Assert
      expect(result.error).toBe('Resgate não encontrado ou não pode ser cancelado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando resgate já foi entregue', async () => {
      // Arrange: Resgate em status 'delivered'
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const reward = createMockReward({ coins_required: 100 });
      const deliveredClaim = createMockRewardClaim({
        user_id: user.id,
        reward_id: reward.id,
        coins_spent: 100,
        status: 'delivered',
      });

      setMockData('rewards', [reward]);
      setMockData('reward_claims', [deliveredClaim]);

      // Act
      const result = await cancelClaim(deliveredClaim.id);

      // Assert
      expect(result.error).toBe('Resgate não encontrado ou não pode ser cancelado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando resgate já foi cancelado', async () => {
      // Arrange: Resgate já em status 'cancelled'
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const reward = createMockReward({ coins_required: 100 });
      const cancelledClaim = createMockRewardClaim({
        user_id: user.id,
        reward_id: reward.id,
        coins_spent: 100,
        status: 'cancelled',
      });

      setMockData('rewards', [reward]);
      setMockData('reward_claims', [cancelledClaim]);

      // Act
      const result = await cancelClaim(cancelledClaim.id);

      // Assert
      expect(result.error).toBe('Resgate não encontrado ou não pode ser cancelado');
      expect(result.success).toBeUndefined();
    });
  });

  describe('Operações de Cancelamento e Estorno', () => {
    it('deve cancelar resgate e reembolsar moedas corretamente', async () => {
      // Arrange: Usuário com resgate pendente
      const initialBalance = 200;
      const coinsSpent = 150;

      const user = setupAuthenticatedUser({ coinBalance: initialBalance });
      const reward = createMockReward({
        name: 'Premium Badge',
        coins_required: coinsSpent,
      });
      const claim = createMockRewardClaim({
        user_id: user.id,
        reward_id: reward.id,
        coins_spent: coinsSpent,
        status: 'pending',
      });

      setMockData('rewards', [reward]);
      setMockData('reward_claims', [claim]);

      // Mock RPC function for stock increment
      const mockIncrementStock = jest.fn();
      require('../mocks/supabase').setMockRpcFunction('increment_reward_stock', mockIncrementStock);

      // Act
      const result = await cancelClaim(claim.id);

      // Assert: Operação bem-sucedida
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Assert: Status do resgate atualizado para 'cancelled'
      const claims = getMockData('reward_claims');
      expect(claims).toHaveLength(1);
      expect(claims[0].status).toBe('cancelled');
      expect(claims[0].id).toBe(claim.id);

      // Assert: Saldo foi reembolsado corretamente
      const userCoins = getMockData('user_coins');
      expect(userCoins).toHaveLength(1);
      expect(userCoins[0].balance).toBe(initialBalance + coinsSpent);
      expect(userCoins[0].user_id).toBe(user.id);

      // Assert: Transação de estorno registrada
      const transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        user_id: user.id,
        amount: coinsSpent, // Valor positivo (estorno)
        type: 'earned',
        reference_id: claim.id,
      });
      expect(transactions[0].description).toContain('Estorno');
      expect(transactions[0].description).toContain(reward.name);

      // Assert: RPC de incremento de estoque foi chamado
      expect(mockIncrementStock).toHaveBeenCalledWith({ reward_id: reward.id });
    });

    it('deve calcular estorno corretamente com valores diferentes', async () => {
      // Arrange: Diferentes valores de moedas
      const initialBalance = 1000;
      const coinsSpent = 500;

      const user = setupAuthenticatedUser({ coinBalance: initialBalance });
      const reward = createMockReward({
        name: 'Gold Package',
        coins_required: coinsSpent,
      });
      const claim = createMockRewardClaim({
        user_id: user.id,
        reward_id: reward.id,
        coins_spent: coinsSpent,
        status: 'pending',
      });

      setMockData('rewards', [reward]);
      setMockData('reward_claims', [claim]);

      // Act
      const result = await cancelClaim(claim.id);

      // Assert
      expect(result.success).toBe(true);

      const userCoins = getMockData('user_coins');
      expect(userCoins[0].balance).toBe(initialBalance + coinsSpent);

      const transactions = getMockData('coin_transactions');
      expect(transactions[0].amount).toBe(coinsSpent);
    });

    it('deve cancelar quando saldo atual é menor que moedas gastas', async () => {
      // Arrange: Usuário gastou tudo e agora tem saldo baixo
      const currentBalance = 50; // Saldo atual baixo
      const coinsSpent = 200; // Mas tinha gasto 200 no resgate

      const user = setupAuthenticatedUser({ coinBalance: currentBalance });
      const reward = createMockReward({
        name: 'Expensive Item',
        coins_required: coinsSpent,
      });
      const claim = createMockRewardClaim({
        user_id: user.id,
        reward_id: reward.id,
        coins_spent: coinsSpent,
        status: 'pending',
      });

      setMockData('rewards', [reward]);
      setMockData('reward_claims', [claim]);

      // Act
      const result = await cancelClaim(claim.id);

      // Assert: Deve funcionar normalmente
      expect(result.success).toBe(true);

      // Assert: Saldo deve ser incrementado corretamente
      const userCoins = getMockData('user_coins');
      expect(userCoins[0].balance).toBe(currentBalance + coinsSpent); // 50 + 200 = 250
    });

    it('deve cancelar quando usuário tem saldo zero', async () => {
      // Arrange: Edge case - saldo zero
      const currentBalance = 0;
      const coinsSpent = 100;

      const user = setupAuthenticatedUser({ coinBalance: currentBalance });
      const reward = createMockReward({ coins_required: coinsSpent });
      const claim = createMockRewardClaim({
        user_id: user.id,
        reward_id: reward.id,
        coins_spent: coinsSpent,
        status: 'pending',
      });

      setMockData('rewards', [reward]);
      setMockData('reward_claims', [claim]);

      // Act
      const result = await cancelClaim(claim.id);

      // Assert
      expect(result.success).toBe(true);

      const userCoins = getMockData('user_coins');
      expect(userCoins[0].balance).toBe(coinsSpent); // 0 + 100 = 100
    });

    it('deve criar descrição de estorno sem nome da recompensa se não disponível', async () => {
      // Arrange: Claim sem dados da recompensa aninhada
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const reward = createMockReward({ name: 'Test Reward' });
      const claim = createMockRewardClaim({
        user_id: user.id,
        reward_id: reward.id,
        coins_spent: 100,
        status: 'pending',
      });

      // Não incluir reward em rewards para simular cenário sem nested data
      setMockData('reward_claims', [claim]);

      // Act
      const result = await cancelClaim(claim.id);

      // Assert
      expect(result.success).toBe(true);

      const transactions = getMockData('coin_transactions');
      expect(transactions[0].description).toContain('Estorno');
      // Deve ter descrição genérica quando reward não está disponível
      expect(transactions[0].description).toContain('Resgate cancelado');
    });

    it('deve restaurar estoque via RPC com ID correto', async () => {
      // Arrange
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const reward = createMockReward({
        id: 'specific-reward-id',
        coins_required: 100,
      });
      const claim = createMockRewardClaim({
        user_id: user.id,
        reward_id: reward.id,
        coins_spent: 100,
        status: 'pending',
      });

      setMockData('rewards', [reward]);
      setMockData('reward_claims', [claim]);

      const mockIncrementStock = jest.fn();
      require('../mocks/supabase').setMockRpcFunction('increment_reward_stock', mockIncrementStock);

      // Act
      const result = await cancelClaim(claim.id);

      // Assert
      expect(result.success).toBe(true);
      expect(mockIncrementStock).toHaveBeenCalledTimes(1);
      expect(mockIncrementStock).toHaveBeenCalledWith({
        reward_id: 'specific-reward-id'
      });
    });

    it('deve processar múltiplos cancelamentos de forma independente', async () => {
      // Arrange: Dois resgates diferentes do mesmo usuário
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      const reward1 = createMockReward({
        name: 'Reward A',
        coins_required: 50,
      });
      const reward2 = createMockReward({
        name: 'Reward B',
        coins_required: 75,
      });

      const claim1 = createMockRewardClaim({
        id: 'claim-1',
        user_id: user.id,
        reward_id: reward1.id,
        coins_spent: 50,
        status: 'pending',
      });
      const claim2 = createMockRewardClaim({
        id: 'claim-2',
        user_id: user.id,
        reward_id: reward2.id,
        coins_spent: 75,
        status: 'pending',
      });

      setMockData('rewards', [reward1, reward2]);
      setMockData('reward_claims', [claim1, claim2]);

      // Act: Cancelar primeiro resgate
      const result1 = await cancelClaim(claim1.id);

      // Assert: Primeiro cancelamento
      expect(result1.success).toBe(true);
      let userCoins = getMockData('user_coins');
      expect(userCoins[0].balance).toBe(150); // 100 + 50

      let transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(50);

      // Act: Cancelar segundo resgate
      const result2 = await cancelClaim(claim2.id);

      // Assert: Segundo cancelamento
      expect(result2.success).toBe(true);
      userCoins = getMockData('user_coins');
      expect(userCoins[0].balance).toBe(225); // 150 + 75

      transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(2);
      expect(transactions[1].amount).toBe(75);

      // Assert: Ambos resgates cancelados
      const claims = getMockData('reward_claims');
      expect(claims.filter(c => c.status === 'cancelled')).toHaveLength(2);
    });
  });
});

describe('addCoinsToUser', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Validações', () => {
    it('deve rejeitar usuário não autenticado', async () => {
      // Arrange: Sem autenticação (nenhum usuário configurado)
      const targetUser = createMockUser();
      const amount = 100;
      const description = 'Bonus de boas-vindas';

      // Act
      const result = await addCoinsToUser(targetUser.id, amount, description);

      // Assert
      expect(result.error).toBe('Usuário não autenticado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando usuário não é admin', async () => {
      // Arrange: Usuário autenticado mas não é admin
      setupAuthenticatedUser({ coinBalance: 100 });
      const targetUser = createMockUser();
      const amount = 100;
      const description = 'Bonus de boas-vindas';

      // Act
      const result = await addCoinsToUser(targetUser.id, amount, description);

      // Assert
      expect(result.error).toBe('Acesso não autorizado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando usuário não é creator', async () => {
      // Arrange: Usuário autenticado mas role não é creator nem admin
      const user = setupAuthenticatedUser({ coinBalance: 100 });
      // Modificar profile para role diferente
      const profiles = getMockData('profiles');
      profiles[0].role = 'user';
      profiles[0].is_creator = false;
      setMockData('profiles', profiles);

      const targetUser = createMockUser();
      const amount = 100;
      const description = 'Bonus de boas-vindas';

      // Act
      const result = await addCoinsToUser(targetUser.id, amount, description);

      // Assert
      expect(result.error).toBe('Acesso não autorizado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando quantidade é zero', async () => {
      // Arrange: Admin com amount zero
      setupAdminUser({ coinBalance: 100 });
      const targetUser = createMockUser();
      const amount = 0;
      const description = 'Teste';

      // Act
      const result = await addCoinsToUser(targetUser.id, amount, description);

      // Assert
      expect(result.error).toBe('Quantidade deve ser maior que zero');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando quantidade é negativa', async () => {
      // Arrange: Admin com amount negativo
      setupAdminUser({ coinBalance: 100 });
      const targetUser = createMockUser();
      const amount = -50;
      const description = 'Teste';

      // Act
      const result = await addCoinsToUser(targetUser.id, amount, description);

      // Assert
      expect(result.error).toBe('Quantidade deve ser maior que zero');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar múltiplas validações em ordem de prioridade', async () => {
      // Arrange: Sem autenticação e amount zero
      // A primeira validação (autenticação) deve ser verificada primeiro
      const targetUser = createMockUser();
      const amount = 0;
      const description = 'Teste';

      // Act
      const result = await addCoinsToUser(targetUser.id, amount, description);

      // Assert: Deve falhar na autenticação, não no amount
      expect(result.error).toBe('Usuário não autenticado');
    });

    it('deve validar permissões antes de amount', async () => {
      // Arrange: Usuário autenticado mas não admin, com amount zero
      setupAuthenticatedUser({ coinBalance: 100 });
      const targetUser = createMockUser();
      const amount = 0;
      const description = 'Teste';

      // Act
      const result = await addCoinsToUser(targetUser.id, amount, description);

      // Assert: Deve falhar na autorização antes de validar amount
      expect(result.error).toBe('Acesso não autorizado');
    });
  });

  describe('Operações de Sucesso', () => {
    it('deve adicionar moedas a usuário com saldo existente', async () => {
      // Arrange: Admin adicionando moedas a usuário com saldo
      setupAdminUser({ coinBalance: 500 });
      const targetUser = createMockUser();
      const initialBalance = 200;
      const amountToAdd = 100;
      const description = 'Bonus de participação';

      // Configurar saldo inicial do usuário alvo
      setMockData('user_coins', [
        {
          user_id: targetUser.id,
          balance: initialBalance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);

      // Act
      const result = await addCoinsToUser(targetUser.id, amountToAdd, description);

      // Assert: Operação bem-sucedida
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Assert: Saldo foi atualizado corretamente
      const userCoins = getMockData('user_coins');
      expect(userCoins).toHaveLength(1);
      expect(userCoins[0].balance).toBe(initialBalance + amountToAdd);
      expect(userCoins[0].user_id).toBe(targetUser.id);

      // Assert: Transação registrada
      const transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        user_id: targetUser.id,
        amount: amountToAdd,
        type: 'earned',
        description: description,
      });
    });

    it('deve adicionar moedas a usuário sem saldo existente', async () => {
      // Arrange: Admin adicionando moedas a usuário novo (sem registro user_coins)
      setupAdminUser({ coinBalance: 500 });
      const targetUser = createMockUser();
      const amountToAdd = 150;
      const description = 'Bonus de boas-vindas';

      // Garantir que não há registro de saldo para o usuário alvo
      setMockData('user_coins', []);

      // Act
      const result = await addCoinsToUser(targetUser.id, amountToAdd, description);

      // Assert: Operação bem-sucedida
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Assert: Novo registro de saldo criado
      const userCoins = getMockData('user_coins');
      expect(userCoins).toHaveLength(1);
      expect(userCoins[0]).toMatchObject({
        user_id: targetUser.id,
        balance: amountToAdd,
      });

      // Assert: Transação registrada
      const transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        user_id: targetUser.id,
        amount: amountToAdd,
        type: 'earned',
        description: description,
      });
    });

    it('deve permitir creator adicionar moedas', async () => {
      // Arrange: Creator (não admin) adicionando moedas
      const creator = setupAuthenticatedUser({ coinBalance: 500 });
      // Modificar para creator
      const profiles = getMockData('profiles');
      profiles[0].role = 'creator';
      profiles[0].is_creator = true;
      setMockData('profiles', profiles);

      const targetUser = createMockUser();
      const amountToAdd = 75;
      const description = 'Recompensa especial';

      setMockData('user_coins', []);

      // Act
      const result = await addCoinsToUser(targetUser.id, amountToAdd, description);

      // Assert: Deve funcionar normalmente
      expect(result.success).toBe(true);

      const userCoins = getMockData('user_coins');
      expect(userCoins[0].balance).toBe(amountToAdd);
    });

    it('deve calcular saldo corretamente com valores grandes', async () => {
      // Arrange: Valores grandes
      setupAdminUser({ coinBalance: 1000 });
      const targetUser = createMockUser();
      const initialBalance = 5000;
      const amountToAdd = 2500;
      const description = 'Bonus mega';

      setMockData('user_coins', [
        {
          user_id: targetUser.id,
          balance: initialBalance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);

      // Act
      const result = await addCoinsToUser(targetUser.id, amountToAdd, description);

      // Assert
      expect(result.success).toBe(true);

      const userCoins = getMockData('user_coins');
      expect(userCoins[0].balance).toBe(7500); // 5000 + 2500
    });

    it('deve adicionar moedas a usuário com saldo zero', async () => {
      // Arrange: Edge case - saldo zero
      setupAdminUser({ coinBalance: 500 });
      const targetUser = createMockUser();
      const initialBalance = 0;
      const amountToAdd = 50;
      const description = 'Primeiro bonus';

      setMockData('user_coins', [
        {
          user_id: targetUser.id,
          balance: initialBalance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);

      // Act
      const result = await addCoinsToUser(targetUser.id, amountToAdd, description);

      // Assert
      expect(result.success).toBe(true);

      const userCoins = getMockData('user_coins');
      expect(userCoins[0].balance).toBe(amountToAdd);
    });

    it('deve registrar transação com descrição correta', async () => {
      // Arrange: Verificar que a descrição é armazenada corretamente
      setupAdminUser({ coinBalance: 500 });
      const targetUser = createMockUser();
      const amountToAdd = 100;
      const description = 'Recompensa por completar desafio X';

      setMockData('user_coins', []);

      // Act
      const result = await addCoinsToUser(targetUser.id, amountToAdd, description);

      // Assert
      expect(result.success).toBe(true);

      const transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(1);
      expect(transactions[0].description).toBe(description);
      expect(transactions[0].type).toBe('earned');
    });

    it('deve processar múltiplas adições de moedas de forma independente', async () => {
      // Arrange: Admin adicionando moedas para diferentes usuários
      setupAdminUser({ coinBalance: 1000 });
      const user1 = createMockUser();
      const user2 = createMockUser();

      setMockData('user_coins', []);

      // Act: Primeira adição
      const result1 = await addCoinsToUser(user1.id, 100, 'Bonus user 1');

      // Assert: Primeira adição
      expect(result1.success).toBe(true);
      let userCoins = getMockData('user_coins');
      expect(userCoins).toHaveLength(1);
      expect(userCoins[0].user_id).toBe(user1.id);
      expect(userCoins[0].balance).toBe(100);

      // Act: Segunda adição
      const result2 = await addCoinsToUser(user2.id, 200, 'Bonus user 2');

      // Assert: Segunda adição
      expect(result2.success).toBe(true);
      userCoins = getMockData('user_coins');
      expect(userCoins).toHaveLength(2);

      const user2Coins = userCoins.find(uc => uc.user_id === user2.id);
      expect(user2Coins).toBeDefined();
      expect(user2Coins!.balance).toBe(200);

      // Assert: Ambas transações registradas
      const transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(2);
      expect(transactions[0].user_id).toBe(user1.id);
      expect(transactions[1].user_id).toBe(user2.id);
    });

    it('deve adicionar moedas múltiplas vezes ao mesmo usuário', async () => {
      // Arrange: Admin adicionando moedas ao mesmo usuário em diferentes momentos
      setupAdminUser({ coinBalance: 1000 });
      const targetUser = createMockUser();

      setMockData('user_coins', []);

      // Act: Primeira adição
      const result1 = await addCoinsToUser(targetUser.id, 100, 'Primeira recompensa');

      // Assert: Primeira adição
      expect(result1.success).toBe(true);
      let userCoins = getMockData('user_coins');
      expect(userCoins[0].balance).toBe(100);

      // Act: Segunda adição
      const result2 = await addCoinsToUser(targetUser.id, 50, 'Segunda recompensa');

      // Assert: Segunda adição
      expect(result2.success).toBe(true);
      userCoins = getMockData('user_coins');
      expect(userCoins).toHaveLength(1); // Ainda apenas 1 registro
      expect(userCoins[0].balance).toBe(150); // 100 + 50

      // Act: Terceira adição
      const result3 = await addCoinsToUser(targetUser.id, 25, 'Terceira recompensa');

      // Assert: Terceira adição
      expect(result3.success).toBe(true);
      userCoins = getMockData('user_coins');
      expect(userCoins[0].balance).toBe(175); // 150 + 25

      // Assert: Todas as transações registradas
      const transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(3);
      expect(transactions[0].amount).toBe(100);
      expect(transactions[1].amount).toBe(50);
      expect(transactions[2].amount).toBe(25);
    });
  });
});
