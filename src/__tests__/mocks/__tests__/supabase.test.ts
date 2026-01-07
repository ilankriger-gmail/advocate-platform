/**
 * Testes para verificar o mock do Supabase
 */

import {
  createMockSupabaseClient,
  resetSupabaseMocks,
  setMockUser,
  setMockData,
  addMockData,
  getMockData,
  setMockRpcFunction,
} from '../supabase';

describe('Supabase Mock', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('Auth Mock', () => {
    it('should return null user when not authenticated', async () => {
      const client = createMockSupabaseClient();
      const { data, error } = await client.auth.getUser();

      expect(data.user).toBeNull();
      expect(error).toBeDefined();
    });

    it('should return authenticated user', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      setMockUser(mockUser);

      const client = createMockSupabaseClient();
      const { data, error } = await client.auth.getUser();

      expect(data.user).toEqual(mockUser);
      expect(error).toBeNull();
    });
  });

  describe('Query Builder - Select', () => {
    it('should select all records from a table', async () => {
      const mockRewards = [
        { id: '1', name: 'Reward 1', coins_required: 100 },
        { id: '2', name: 'Reward 2', coins_required: 200 },
      ];
      setMockData('rewards', mockRewards);

      const client = createMockSupabaseClient();
      const { data, error } = await client.from('rewards').select();

      expect(data).toEqual(mockRewards);
      expect(error).toBeNull();
    });

    it('should filter records with eq()', async () => {
      const mockRewards = [
        { id: '1', name: 'Reward 1', is_active: true },
        { id: '2', name: 'Reward 2', is_active: false },
      ];
      setMockData('rewards', mockRewards);

      const client = createMockSupabaseClient();
      const { data } = await client.from('rewards').select().eq('is_active', true);

      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('1');
    });

    it('should return single record with single()', async () => {
      const mockRewards = [
        { id: '1', name: 'Reward 1' },
        { id: '2', name: 'Reward 2' },
      ];
      setMockData('rewards', mockRewards);

      const client = createMockSupabaseClient();
      const { data } = await client.from('rewards').select().eq('id', '1').single();

      expect(data).toEqual(mockRewards[0]);
    });

    it('should return error when no record found with single()', async () => {
      setMockData('rewards', []);

      const client = createMockSupabaseClient();
      const { data, error } = await client.from('rewards').select().eq('id', '999').single();

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe('Insert Builder', () => {
    it('should insert a record', async () => {
      const client = createMockSupabaseClient();
      const newReward = { name: 'New Reward', coins_required: 150 };

      await client.from('rewards').insert(newReward);

      const data = getMockData('rewards');
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('New Reward');
      expect(data[0].id).toBeDefined();
    });

    it('should insert and return data with select()', async () => {
      const client = createMockSupabaseClient();
      const newReward = { name: 'New Reward', coins_required: 150 };

      const { data } = await client.from('rewards').insert(newReward).select();

      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('New Reward');
    });

    it('should insert and return single record with select().single()', async () => {
      const client = createMockSupabaseClient();
      const newReward = { name: 'New Reward', coins_required: 150 };

      const { data } = await client.from('rewards').insert(newReward).select().single();

      expect(data.name).toBe('New Reward');
      expect(data.id).toBeDefined();
    });
  });

  describe('Update Builder', () => {
    it('should update matching records', async () => {
      setMockData('rewards', [
        { id: '1', name: 'Reward 1', is_active: true },
        { id: '2', name: 'Reward 2', is_active: true },
      ]);

      const client = createMockSupabaseClient();
      await client.from('rewards').update({ is_active: false }).eq('id', '1');

      const data = getMockData('rewards');
      expect(data[0].is_active).toBe(false);
      expect(data[1].is_active).toBe(true);
    });
  });

  describe('Delete Builder', () => {
    it('should delete matching records', async () => {
      setMockData('rewards', [
        { id: '1', name: 'Reward 1' },
        { id: '2', name: 'Reward 2' },
      ]);

      const client = createMockSupabaseClient();
      await client.from('rewards').delete().eq('id', '1');

      const data = getMockData('rewards');
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('2');
    });
  });

  describe('RPC Functions', () => {
    it('should call RPC function', async () => {
      setMockRpcFunction('increment_reward_stock', ({ reward_id }) => {
        const rewards = getMockData('rewards');
        const reward = rewards.find(r => r.id === reward_id);
        if (reward) {
          reward.quantity_available += 1;
        }
        return true;
      });

      setMockData('rewards', [{ id: '1', quantity_available: 5 }]);

      const client = createMockSupabaseClient();
      await client.rpc('increment_reward_stock', { reward_id: '1' });

      const data = getMockData('rewards');
      expect(data[0].quantity_available).toBe(6);
    });
  });

  describe('Helper Functions', () => {
    it('should reset all mocks', () => {
      setMockUser({ id: 'user-1', email: 'test@example.com' });
      setMockData('rewards', [{ id: '1', name: 'Test' }]);

      resetSupabaseMocks();

      const client = createMockSupabaseClient();
      expect(getMockData('rewards')).toEqual([]);
    });

    it('should add data to existing table', () => {
      setMockData('rewards', [{ id: '1', name: 'Reward 1' }]);
      addMockData('rewards', { id: '2', name: 'Reward 2' });

      const data = getMockData('rewards');
      expect(data).toHaveLength(2);
    });
  });
});
