/**
 * Testes para actions de desafios
 */

import { participateInChallenge, approveParticipation, rejectParticipation } from '@/actions/challenges';
import {
  resetMocks,
  setupAuthenticatedUser,
  setupAdminUser,
} from '../helpers';
import {
  createMockChallenge,
  createMockParticipation,
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

// Mock do módulo Gemini AI
jest.mock('@/lib/gemini', () => ({
  analyzeVideoChallenge: jest.fn(() => Promise.resolve({
    isValid: true,
    achievedValue: 10,
    confidence: 0.95,
    reasoning: 'Test AI analysis',
  })),
}));

describe('participateInChallenge', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Validações', () => {
    it('deve rejeitar usuário não autenticado', async () => {
      // Arrange: Sem autenticação (nenhum usuário configurado)
      const challenge = createMockChallenge();
      setMockData('challenges', [challenge]);

      // Act
      const result = await participateInChallenge({
        challengeId: challenge.id,
        resultValue: 15,
      });

      // Assert
      expect(result.error).toBe('Usuario nao autenticado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando desafio não existe', async () => {
      // Arrange: Usuário autenticado mas desafio não existe
      setupAuthenticatedUser({ coinBalance: 500 });
      const nonExistentChallengeId = 'non-existent-challenge-id';

      // Act
      const result = await participateInChallenge({
        challengeId: nonExistentChallengeId,
        resultValue: 15,
      });

      // Assert
      expect(result.error).toBe('Desafio nao encontrado ou encerrado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando desafio está inativo', async () => {
      // Arrange: Usuário autenticado e desafio inativo
      setupAuthenticatedUser({ coinBalance: 500 });
      const inactiveChallenge = createMockChallenge({
        is_active: false,
        status: 'active',
      });
      setMockData('challenges', [inactiveChallenge]);

      // Act
      const result = await participateInChallenge({
        challengeId: inactiveChallenge.id,
        resultValue: 15,
      });

      // Assert
      expect(result.error).toBe('Desafio nao encontrado ou encerrado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar quando desafio está encerrado', async () => {
      // Arrange: Usuário autenticado e desafio com status 'closed'
      setupAuthenticatedUser({ coinBalance: 500 });
      const closedChallenge = createMockChallenge({
        is_active: true,
        status: 'closed',
      });
      setMockData('challenges', [closedChallenge]);

      // Act
      const result = await participateInChallenge({
        challengeId: closedChallenge.id,
        resultValue: 15,
      });

      // Assert
      expect(result.error).toBe('Desafio nao encontrado ou encerrado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar desafio não físico (tipo engajamento)', async () => {
      // Arrange: Usuário autenticado e desafio tipo 'engajamento'
      setupAuthenticatedUser({ coinBalance: 500 });
      const engagementChallenge = createMockChallenge({
        type: 'engajamento',
        is_active: true,
        status: 'active',
      });
      setMockData('challenges', [engagementChallenge]);

      // Act
      const result = await participateInChallenge({
        challengeId: engagementChallenge.id,
        resultValue: 15,
      });

      // Assert
      expect(result.error).toBe('Este desafio nao aceita participacoes diretas');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar desafio não físico (tipo participe)', async () => {
      // Arrange: Usuário autenticado e desafio tipo 'participe'
      setupAuthenticatedUser({ coinBalance: 500 });
      const participeChallenge = createMockChallenge({
        type: 'participe',
        is_active: true,
        status: 'active',
      });
      setMockData('challenges', [participeChallenge]);

      // Act
      const result = await participateInChallenge({
        challengeId: participeChallenge.id,
        resultValue: 15,
      });

      // Assert
      expect(result.error).toBe('Este desafio nao aceita participacoes diretas');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar participação duplicada', async () => {
      // Arrange: Usuário autenticado e já participou do desafio
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const challenge = createMockChallenge({
        type: 'fisico',
        is_active: true,
        status: 'active',
      });
      const existingParticipation = createMockParticipation({
        challenge_id: challenge.id,
        user_id: user.id,
        status: 'pending',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [existingParticipation]);

      // Act
      const result = await participateInChallenge({
        challengeId: challenge.id,
        resultValue: 15,
      });

      // Assert
      expect(result.error).toBe('Voce ja participou deste desafio');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar participação duplicada mesmo com status diferente', async () => {
      // Arrange: Usuário já participou com status 'approved'
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const challenge = createMockChallenge({
        type: 'fisico',
        is_active: true,
        status: 'active',
      });
      const existingParticipation = createMockParticipation({
        challenge_id: challenge.id,
        user_id: user.id,
        status: 'approved',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [existingParticipation]);

      // Act
      const result = await participateInChallenge({
        challengeId: challenge.id,
        resultValue: 20,
      });

      // Assert
      expect(result.error).toBe('Voce ja participou deste desafio');
      expect(result.success).toBeUndefined();
    });

    it('deve validar autenticação antes de verificar desafio', async () => {
      // Arrange: Sem autenticação e desafio não existe
      // A primeira validação (autenticação) deve ser verificada primeiro
      const nonExistentChallengeId = 'non-existent-challenge-id';

      // Act
      const result = await participateInChallenge({
        challengeId: nonExistentChallengeId,
        resultValue: 15,
      });

      // Assert: Deve falhar na autenticação, não no desafio
      expect(result.error).toBe('Usuario nao autenticado');
    });

    it('deve validar existência do desafio antes de tipo', async () => {
      // Arrange: Usuário autenticado mas desafio não existe
      setupAuthenticatedUser({ coinBalance: 500 });
      const nonExistentChallengeId = 'non-existent-challenge-id';

      // Act
      const result = await participateInChallenge({
        challengeId: nonExistentChallengeId,
        resultValue: 15,
      });

      // Assert: Deve falhar ao buscar desafio
      expect(result.error).toBe('Desafio nao encontrado ou encerrado');
    });

    it('deve validar tipo de desafio antes de participação duplicada', async () => {
      // Arrange: Usuário autenticado, desafio tipo engajamento, e participação existente
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const engagementChallenge = createMockChallenge({
        type: 'engajamento',
        is_active: true,
        status: 'active',
      });
      const existingParticipation = createMockParticipation({
        challenge_id: engagementChallenge.id,
        user_id: user.id,
      });

      setMockData('challenges', [engagementChallenge]);
      setMockData('challenge_participants', [existingParticipation]);

      // Act
      const result = await participateInChallenge({
        challengeId: engagementChallenge.id,
        resultValue: 15,
      });

      // Assert: Deve falhar no tipo de desafio antes de verificar duplicação
      expect(result.error).toBe('Este desafio nao aceita participacoes diretas');
    });

    it('deve aceitar participação quando todas as validações passam', async () => {
      // Arrange: Cenário válido
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const challenge = createMockChallenge({
        type: 'fisico',
        is_active: true,
        status: 'active',
      });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', []); // Sem participações existentes

      // Act
      const result = await participateInChallenge({
        challengeId: challenge.id,
        resultValue: 15,
      });

      // Assert: Não deve ter erro
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it('deve permitir usuários diferentes participarem do mesmo desafio', async () => {
      // Arrange: Primeiro usuário já participou
      const user1 = setupAuthenticatedUser({ coinBalance: 500 });
      const challenge = createMockChallenge({
        type: 'fisico',
        is_active: true,
        status: 'active',
      });
      const user1Participation = createMockParticipation({
        challenge_id: challenge.id,
        user_id: user1.id,
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [user1Participation]);

      // Trocar para segundo usuário
      resetMocks();
      const user2 = setupAuthenticatedUser({ coinBalance: 500 });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [user1Participation]);

      // Act
      const result = await participateInChallenge({
        challengeId: challenge.id,
        resultValue: 20,
      });

      // Assert: Deve aceitar participação do segundo usuário
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Criação de Participação', () => {
    it('deve criar participação com status pending e dados corretos', async () => {
      // Arrange: Usuário autenticado e desafio válido
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const challenge = createMockChallenge({
        type: 'fisico',
        is_active: true,
        status: 'active',
      });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', []);

      // Act
      const result = await participateInChallenge({
        challengeId: challenge.id,
        resultValue: 15,
        videoProofUrl: 'https://example.com/video.mp4',
        socialMediaUrl: 'https://instagram.com/p/abc123',
      });

      // Assert: Resposta de sucesso
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();

      // Assert: Participação criada no banco de dados
      const participations = getMockData('challenge_participants');
      expect(participations).toHaveLength(1);

      // Assert: Dados da participação estão corretos
      const participation = participations[0];
      expect(participation.user_id).toBe(user.id);
      expect(participation.challenge_id).toBe(challenge.id);
      expect(participation.status).toBe('pending');
      expect(participation.result_value).toBe(15);
      expect(participation.video_proof_url).toBe('https://example.com/video.mp4');
      expect(participation.social_media_url).toBe('https://instagram.com/p/abc123');
      expect(participation.coins_earned).toBe(0);
      expect(participation.created_at).toBeDefined();
    });

    it('deve criar participação sem URLs opcionais', async () => {
      // Arrange: Usuário autenticado e desafio válido
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const challenge = createMockChallenge({
        type: 'fisico',
        is_active: true,
        status: 'active',
      });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', []);

      // Act: Participar sem video_proof_url nem social_media_url
      const result = await participateInChallenge({
        challengeId: challenge.id,
        resultValue: 25,
      });

      // Assert: Resposta de sucesso
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Assert: Participação criada com URLs como null
      const participations = getMockData('challenge_participants');
      expect(participations).toHaveLength(1);
      const participation = participations[0];
      expect(participation.user_id).toBe(user.id);
      expect(participation.result_value).toBe(25);
      expect(participation.video_proof_url).toBeNull();
      expect(participation.social_media_url).toBeNull();
      expect(participation.status).toBe('pending');
    });

    it('deve registrar diferentes valores de resultado', async () => {
      // Arrange: Usuário autenticado e desafio válido
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const challenge = createMockChallenge({
        type: 'fisico',
        is_active: true,
        status: 'active',
        goal_type: 'repetitions',
        goal_value: 50,
      });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', []);

      // Act: Participar com resultado de 100 repetições
      const result = await participateInChallenge({
        challengeId: challenge.id,
        resultValue: 100,
      });

      // Assert: Valor do resultado registrado corretamente
      expect(result.success).toBe(true);
      const participations = getMockData('challenge_participants');
      expect(participations[0].result_value).toBe(100);
    });

    it('deve incluir veredicto da IA quando video é fornecido', async () => {
      // Arrange: Usuário autenticado e desafio válido
      const user = setupAuthenticatedUser({ coinBalance: 500 });
      const challenge = createMockChallenge({
        type: 'fisico',
        is_active: true,
        status: 'active',
      });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', []);

      // Act: Participar com URL de vídeo (AI será invocada)
      const result = await participateInChallenge({
        challengeId: challenge.id,
        resultValue: 30,
        videoProofUrl: 'https://example.com/proof.mp4',
      });

      // Assert: Veredicto da IA incluído na participação
      expect(result.success).toBe(true);
      const participations = getMockData('challenge_participants');
      const participation = participations[0];
      expect(participation.ai_verdict).toBeDefined();
      expect(participation.ai_verdict.isValid).toBe(true);
      expect(participation.ai_verdict.achievedValue).toBe(10);
      expect(participation.ai_verdict.confidence).toBe(0.95);
      expect(participation.ai_verdict.reasoning).toBe('Test AI analysis');
    });
  });
});

describe('approveParticipation', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Validações de Acesso', () => {
    it('deve rejeitar usuário não autenticado', async () => {
      // Arrange: Sem autenticação
      const participation = createMockParticipation();
      setMockData('challenge_participants', [participation]);

      // Act
      const result = await approveParticipation(participation.id);

      // Assert
      expect(result.error).toBe('Usuario nao autenticado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar usuário não-admin', async () => {
      // Arrange: Usuário comum autenticado
      setupAuthenticatedUser({ role: 'fan', is_creator: false });
      const participation = createMockParticipation();
      setMockData('challenge_participants', [participation]);

      // Act
      const result = await approveParticipation(participation.id);

      // Assert
      expect(result.error).toBe('Acesso nao autorizado');
      expect(result.success).toBeUndefined();
    });

    it('deve permitir admin aprovar participação', async () => {
      // Arrange: Admin autenticado
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser();
      const challenge = createMockChallenge({ coins_reward: 100 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await approveParticipation(participation.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('deve rejeitar se participação não existe', async () => {
      // Arrange: Admin autenticado mas participação não existe
      setupAdminUser();
      const nonExistentParticipationId = 'non-existent-participation-id';

      // Act
      const result = await approveParticipation(nonExistentParticipationId);

      // Assert
      expect(result.error).toBe('Participacao nao encontrada');
      expect(result.success).toBeUndefined();
    });
  });

  describe('Recompensa de Moedas', () => {
    it('deve aprovar com recompensa padrão do desafio', async () => {
      // Arrange: Admin autenticado, participação pendente
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({ coins_reward: 150 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await approveParticipation(participation.id);

      // Assert: Participação aprovada com moedas do desafio
      expect(result.success).toBe(true);
      const updatedParticipations = getMockData('challenge_participants');
      const updatedParticipation = updatedParticipations.find(
        (p: any) => p.id === participation.id
      );
      expect(updatedParticipation.status).toBe('approved');
      expect(updatedParticipation.coins_earned).toBe(150);
      expect(updatedParticipation.approved_by).toBe(admin.id);
      expect(updatedParticipation.approved_at).toBeDefined();
    });

    it('deve aprovar com valor customizado de moedas', async () => {
      // Arrange: Admin autenticado, participação pendente
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({ coins_reward: 100 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act: Aprovar com 200 moedas customizadas
      const result = await approveParticipation(participation.id, 200);

      // Assert: Participação aprovada com moedas customizadas
      expect(result.success).toBe(true);
      const updatedParticipations = getMockData('challenge_participants');
      const updatedParticipation = updatedParticipations.find(
        (p: any) => p.id === participation.id
      );
      expect(updatedParticipation.coins_earned).toBe(200);
      expect(updatedParticipation.status).toBe('approved');
    });

    it('deve adicionar moedas ao saldo do usuário', async () => {
      // Arrange: Admin autenticado, participação pendente
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({ coins_reward: 150 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      const userCoins = getMockData('user_coins').find(
        (uc: any) => uc.user_id === user.id
      );
      const initialBalance = userCoins.balance;

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      const userCoinsAfterReset = {
        id: 'user-coins-1',
        user_id: user.id,
        balance: initialBalance,
        updated_at: new Date().toISOString(),
      };
      setMockData('user_coins', [userCoinsAfterReset]);
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await approveParticipation(participation.id);

      // Assert: Moedas adicionadas ao saldo
      expect(result.success).toBe(true);
      const updatedUserCoins = getMockData('user_coins').find(
        (uc: any) => uc.user_id === user.id
      );
      expect(updatedUserCoins.balance).toBe(initialBalance + 150);
    });

    it('deve criar transação de moedas ao aprovar', async () => {
      // Arrange: Admin autenticado, participação pendente
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({ coins_reward: 150 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await approveParticipation(participation.id);

      // Assert: Transação criada
      expect(result.success).toBe(true);
      const transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(1);

      const transaction = transactions[0];
      expect(transaction.user_id).toBe(user.id);
      expect(transaction.amount).toBe(150);
      expect(transaction.type).toBe('earned');
      expect(transaction.description).toBe('Desafio concluido');
      expect(transaction.reference_id).toBe(participation.id);
    });

    it('não deve criar transação quando recompensa é zero', async () => {
      // Arrange: Admin autenticado, desafio com recompensa zero
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({ coins_reward: 0 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await approveParticipation(participation.id);

      // Assert: Sem transação criada
      expect(result.success).toBe(true);
      const transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(0);
    });
  });

  describe('Atualização de Status', () => {
    it('deve atualizar todos os campos de aprovação', async () => {
      // Arrange: Admin autenticado, participação pendente
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({ coins_reward: 100 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
        approved_by: null,
        approved_at: null,
        coins_earned: 0,
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await approveParticipation(participation.id);

      // Assert: Todos os campos atualizados
      expect(result.success).toBe(true);
      const updatedParticipations = getMockData('challenge_participants');
      const updatedParticipation = updatedParticipations.find(
        (p: any) => p.id === participation.id
      );

      expect(updatedParticipation.status).toBe('approved');
      expect(updatedParticipation.approved_by).toBe(admin.id);
      expect(updatedParticipation.approved_at).toBeDefined();
      expect(updatedParticipation.approved_at).not.toBeNull();
      expect(updatedParticipation.coins_earned).toBe(100);
    });

    it('deve manter outros dados da participação inalterados', async () => {
      // Arrange: Admin autenticado, participação com dados específicos
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({ coins_reward: 100 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
        result_value: 25,
        video_proof_url: 'https://example.com/video.mp4',
        social_media_url: 'https://instagram.com/p/abc123',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await approveParticipation(participation.id);

      // Assert: Dados originais preservados
      expect(result.success).toBe(true);
      const updatedParticipations = getMockData('challenge_participants');
      const updatedParticipation = updatedParticipations.find(
        (p: any) => p.id === participation.id
      );

      expect(updatedParticipation.result_value).toBe(25);
      expect(updatedParticipation.video_proof_url).toBe('https://example.com/video.mp4');
      expect(updatedParticipation.social_media_url).toBe('https://instagram.com/p/abc123');
      expect(updatedParticipation.user_id).toBe(user.id);
      expect(updatedParticipation.challenge_id).toBe(challenge.id);
    });
  });
});

describe('rejectParticipation', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Validações de Acesso', () => {
    it('deve rejeitar usuário não autenticado', async () => {
      // Arrange: Sem autenticação
      const participation = createMockParticipation();
      setMockData('challenge_participants', [participation]);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert
      expect(result.error).toBe('Usuario nao autenticado');
      expect(result.success).toBeUndefined();
    });

    it('deve rejeitar usuário não-admin', async () => {
      // Arrange: Usuário comum autenticado
      setupAuthenticatedUser({ role: 'fan', is_creator: false });
      const participation = createMockParticipation();
      setMockData('challenge_participants', [participation]);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert
      expect(result.error).toBe('Acesso nao autorizado');
      expect(result.success).toBeUndefined();
    });

    it('deve permitir admin rejeitar participação', async () => {
      // Arrange: Admin autenticado
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser();
      const challenge = createMockChallenge({ coins_reward: 100 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('deve permitir creator rejeitar participação', async () => {
      // Arrange: Creator autenticado (não admin)
      const creator = setupAuthenticatedUser({ role: 'fan', is_creator: true });
      const user = setupAuthenticatedUser();
      const challenge = createMockChallenge({ coins_reward: 100 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar creator novamente
      resetMocks();
      setupAuthenticatedUser({ id: creator.id, role: 'fan', is_creator: true });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Atualização de Status', () => {
    it('deve atualizar status para rejected', async () => {
      // Arrange: Admin autenticado, participação pendente
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser();
      const challenge = createMockChallenge({ coins_reward: 100 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
        coins_earned: 0,
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert: Status atualizado para rejected
      expect(result.success).toBe(true);
      const updatedParticipations = getMockData('challenge_participants');
      const updatedParticipation = updatedParticipations.find(
        (p: any) => p.id === participation.id
      );

      expect(updatedParticipation.status).toBe('rejected');
    });

    it('deve definir approved_by e approved_at ao rejeitar', async () => {
      // Arrange: Admin autenticado, participação pendente
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser();
      const challenge = createMockChallenge({ coins_reward: 100 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
        approved_by: null,
        approved_at: null,
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert: approved_by e approved_at definidos
      expect(result.success).toBe(true);
      const updatedParticipations = getMockData('challenge_participants');
      const updatedParticipation = updatedParticipations.find(
        (p: any) => p.id === participation.id
      );

      expect(updatedParticipation.approved_by).toBe(admin.id);
      expect(updatedParticipation.approved_at).toBeDefined();
      expect(updatedParticipation.approved_at).not.toBeNull();
    });

    it('deve manter outros dados da participação inalterados', async () => {
      // Arrange: Admin autenticado, participação com dados específicos
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser();
      const challenge = createMockChallenge({ coins_reward: 100 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
        result_value: 25,
        video_proof_url: 'https://example.com/video.mp4',
        social_media_url: 'https://instagram.com/p/abc123',
        coins_earned: 0,
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert: Dados originais preservados
      expect(result.success).toBe(true);
      const updatedParticipations = getMockData('challenge_participants');
      const updatedParticipation = updatedParticipations.find(
        (p: any) => p.id === participation.id
      );

      expect(updatedParticipation.result_value).toBe(25);
      expect(updatedParticipation.video_proof_url).toBe('https://example.com/video.mp4');
      expect(updatedParticipation.social_media_url).toBe('https://instagram.com/p/abc123');
      expect(updatedParticipation.user_id).toBe(user.id);
      expect(updatedParticipation.challenge_id).toBe(challenge.id);
      expect(updatedParticipation.coins_earned).toBe(0);
    });

    it('não deve adicionar moedas ao usuário', async () => {
      // Arrange: Admin autenticado, participação pendente
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({ coins_reward: 150 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      const userCoins = getMockData('user_coins').find(
        (uc: any) => uc.user_id === user.id
      );
      const initialBalance = userCoins.balance;

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      const userCoinsAfterReset = {
        id: 'user-coins-1',
        user_id: user.id,
        balance: initialBalance,
        updated_at: new Date().toISOString(),
      };
      setMockData('user_coins', [userCoinsAfterReset]);
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert: Saldo de moedas não alterado
      expect(result.success).toBe(true);
      const updatedUserCoins = getMockData('user_coins').find(
        (uc: any) => uc.user_id === user.id
      );
      expect(updatedUserCoins.balance).toBe(initialBalance);
    });

    it('não deve criar transação de moedas ao rejeitar', async () => {
      // Arrange: Admin autenticado, participação pendente
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({ coins_reward: 150 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert: Nenhuma transação criada
      expect(result.success).toBe(true);
      const transactions = getMockData('coin_transactions');
      expect(transactions).toHaveLength(0);
    });

    it('deve rejeitar participações com diferentes valores de resultado', async () => {
      // Arrange: Admin autenticado, participação com resultado alto
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({
        coins_reward: 100,
        goal_type: 'repetitions',
        goal_value: 50,
      });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
        result_value: 100,
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert: Participação rejeitada mantendo result_value
      expect(result.success).toBe(true);
      const updatedParticipations = getMockData('challenge_participants');
      const updatedParticipation = updatedParticipations.find(
        (p: any) => p.id === participation.id
      );

      expect(updatedParticipation.status).toBe('rejected');
      expect(updatedParticipation.result_value).toBe(100);
      expect(updatedParticipation.coins_earned).toBe(0);
    });

    it('deve rejeitar participação com veredicto da IA', async () => {
      // Arrange: Admin autenticado, participação com veredicto de IA
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser({ coinBalance: 200 });
      const challenge = createMockChallenge({ coins_reward: 100 });
      const aiVerdict = {
        isValid: false,
        achievedValue: 5,
        confidence: 0.7,
        reasoning: 'Movimento incorreto detectado',
      };
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
        ai_verdict: aiVerdict,
        video_proof_url: 'https://example.com/proof.mp4',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert: Veredicto da IA preservado
      expect(result.success).toBe(true);
      const updatedParticipations = getMockData('challenge_participants');
      const updatedParticipation = updatedParticipations.find(
        (p: any) => p.id === participation.id
      );

      expect(updatedParticipation.status).toBe('rejected');
      expect(updatedParticipation.ai_verdict).toEqual(aiVerdict);
      expect(updatedParticipation.video_proof_url).toBe('https://example.com/proof.mp4');
    });

    it('deve aceitar rejeição com motivo opcional', async () => {
      // Arrange: Admin autenticado
      const admin = setupAdminUser();
      const user = setupAuthenticatedUser();
      const challenge = createMockChallenge({ coins_reward: 100 });
      const participation = createMockParticipation({
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'pending',
      });

      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Resetar e configurar admin novamente
      resetMocks();
      setupAdminUser({ id: admin.id });
      setMockData('challenges', [challenge]);
      setMockData('challenge_participants', [participation]);
      setMockData('coin_transactions', []);

      // Act: Rejeitar com motivo
      const reason = 'Vídeo não mostra o desafio completo';
      const result = await rejectParticipation(participation.id, reason);

      // Assert: Operação bem-sucedida (nota: motivo não é armazenado na implementação atual)
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Cenários de Erro', () => {
    it('deve retornar erro quando participação não existe', async () => {
      // Arrange: Admin autenticado mas participação não existe
      setupAdminUser();
      const nonExistentParticipationId = 'non-existent-participation-id';

      // Act
      const result = await rejectParticipation(nonExistentParticipationId);

      // Assert: Erro de update retornado pelo mock
      expect(result.error).toBe('Erro ao rejeitar participacao');
      expect(result.success).toBeUndefined();
    });

    it('deve validar autenticação antes de verificar permissões', async () => {
      // Arrange: Sem autenticação
      const participation = createMockParticipation();
      setMockData('challenge_participants', [participation]);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert: Deve falhar na autenticação primeiro
      expect(result.error).toBe('Usuario nao autenticado');
    });

    it('deve validar permissões antes de processar rejeição', async () => {
      // Arrange: Usuário comum (não admin/creator)
      setupAuthenticatedUser({ role: 'fan', is_creator: false });
      const participation = createMockParticipation({ status: 'pending' });
      setMockData('challenge_participants', [participation]);

      // Act
      const result = await rejectParticipation(participation.id);

      // Assert: Deve falhar na autorização
      expect(result.error).toBe('Acesso nao autorizado');
    });
  });
});
