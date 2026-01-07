/**
 * Testes para as funções helper de teste
 */

import {
  setupAuthenticatedUser,
  setupAdminUser,
  resetMocks,
  setupTestScenario,
} from './index';
import {
  mockSupabaseState,
  createMockSupabaseClient,
} from '../mocks/supabase';

describe('Test Helpers', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('setupAuthenticatedUser', () => {
    it('should create an authenticated user with default coin balance', () => {
      const user = setupAuthenticatedUser();

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toContain('@test.com');
      expect(user.role).toBe('fan');
      expect(user.is_creator).toBe(false);

      // Verifica se o usuário está configurado no mock
      const mockUser = mockSupabaseState.getUser();
      expect(mockUser).toEqual(user);

      // Verifica se o saldo de moedas está configurado
      const userCoins = mockSupabaseState.getData('user_coins');
      expect(userCoins).toHaveLength(1);
      expect(userCoins[0].user_id).toBe(user.id);
      expect(userCoins[0].balance).toBe(100); // default
    });

    it('should create an authenticated user with custom coin balance', () => {
      const user = setupAuthenticatedUser({ coinBalance: 500 });

      const userCoins = mockSupabaseState.getData('user_coins');
      expect(userCoins[0].balance).toBe(500);
    });

    it('should create an authenticated user with custom properties', () => {
      const user = setupAuthenticatedUser({
        full_name: 'Custom User',
        email: 'custom@test.com',
      });

      expect(user.full_name).toBe('Custom User');
      expect(user.email).toBe('custom@test.com');
    });

    it('should setup profile data', () => {
      const user = setupAuthenticatedUser();

      const profiles = mockSupabaseState.getData('profiles');
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe(user.id);
      expect(profiles[0].role).toBe(user.role);
      expect(profiles[0].is_creator).toBe(user.is_creator);
    });
  });

  describe('setupAdminUser', () => {
    it('should create an admin user', () => {
      const admin = setupAdminUser();

      expect(admin).toBeDefined();
      expect(admin.role).toBe('creator');
      expect(admin.is_creator).toBe(true);

      // Verifica se o usuário está configurado no mock
      const mockUser = mockSupabaseState.getUser();
      expect(mockUser).toEqual(admin);

      // Verifica se o saldo de moedas está configurado
      const userCoins = mockSupabaseState.getData('user_coins');
      expect(userCoins).toHaveLength(1);
      expect(userCoins[0].user_id).toBe(admin.id);
    });

    it('should create an admin user with custom coin balance', () => {
      const admin = setupAdminUser({ coinBalance: 1000 });

      const userCoins = mockSupabaseState.getData('user_coins');
      expect(userCoins[0].balance).toBe(1000);
    });

    it('should setup admin profile data', () => {
      const admin = setupAdminUser();

      const profiles = mockSupabaseState.getData('profiles');
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe(admin.id);
      expect(profiles[0].role).toBe('creator');
      expect(profiles[0].is_creator).toBe(true);
    });
  });

  describe('resetMocks', () => {
    it('should reset all mock state', () => {
      // Configura alguns dados
      setupAuthenticatedUser({ coinBalance: 500 });

      // Verifica que os dados existem
      expect(mockSupabaseState.getUser()).not.toBeNull();
      expect(mockSupabaseState.getData('user_coins')).toHaveLength(1);

      // Reseta os mocks
      resetMocks();

      // Verifica que os dados foram limpos
      expect(mockSupabaseState.getUser()).toBeNull();
      expect(mockSupabaseState.getData('user_coins')).toHaveLength(0);
    });
  });

  describe('setupTestScenario', () => {
    it('should reset mocks and run setup function', () => {
      // Configura dados iniciais
      setupAuthenticatedUser();

      // Configura novo cenário (deve resetar)
      const result = setupTestScenario(() => {
        const user = setupAuthenticatedUser({ coinBalance: 300 });
        return { user, someValue: 42 };
      });

      expect(result.user).toBeDefined();
      expect(result.someValue).toBe(42);

      // Verifica que os dados do novo cenário estão corretos
      const userCoins = mockSupabaseState.getData('user_coins');
      expect(userCoins).toHaveLength(1);
      expect(userCoins[0].balance).toBe(300);
    });

    it('should return the setup function result', () => {
      const result = setupTestScenario(() => {
        return { test: 'value', number: 123 };
      });

      expect(result).toEqual({ test: 'value', number: 123 });
    });
  });

  describe('integration with Supabase mock', () => {
    it('should work with Supabase client auth', async () => {
      const user = setupAuthenticatedUser();
      const client = createMockSupabaseClient();

      const { data } = await client.auth.getUser();

      expect(data.user).toEqual(user);
    });

    it('should work with Supabase client queries', async () => {
      const user = setupAuthenticatedUser({ coinBalance: 250 });
      const client = createMockSupabaseClient();

      const { data } = await client
        .from('user_coins')
        .select()
        .eq('user_id', user.id)
        .single();

      expect(data).toBeDefined();
      expect(data.balance).toBe(250);
    });
  });
});
