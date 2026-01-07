/**
 * Testes para actions de desafios
 */

import { participateInChallenge } from '@/actions/challenges';
import {
  resetMocks,
  setupAuthenticatedUser,
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
});
