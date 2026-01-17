import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Verificar se estamos no servidor (SSR)
const isServer = typeof window === 'undefined';

// Storage compatível com web, mobile e SSR
const storage: StateStorage = {
  getItem: (name) => {
    if (isServer) return null; // SSR: retorna null
    if (Platform.OS === 'web') {
      return localStorage.getItem(name) ?? null;
    }
    // Mobile: AsyncStorage é async, mas zustand espera sync/Promise
    return AsyncStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (isServer) return; // SSR: não faz nada
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    AsyncStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (isServer) return; // SSR: não faz nada
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    AsyncStorage.removeItem(name);
  },
};

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_creator: boolean;
  coins_balance: number;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCoins: (balance: number) => void;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_URL}/api/mobile/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ isLoading: false });
            return { success: false, error: data.error || 'Erro ao fazer login' };
          }

          set({
            user: data.user,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Erro de conexão' };
        }
      },

      logout: () => {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
        });
      },

      updateCoins: (balance) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, coins_balance: balance } });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
      // Pular hidratação no SSR
      skipHydration: isServer,
    }
  )
);
