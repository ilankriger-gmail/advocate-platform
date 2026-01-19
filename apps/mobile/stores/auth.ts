import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { getSupabase } from '../lib/supabase';

// Necessário para fechar o browser após autenticação
WebBrowser.maybeCompleteAuthSession();

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
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
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

      loginWithGoogle: async () => {
        set({ isLoading: true });
        try {
          const redirectUri = makeRedirectUri({
            scheme: 'arenateamo',
            path: 'auth/callback',
          });

          const supabase = getSupabase();
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUri,
              skipBrowserRedirect: true,
            },
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data?.url) {
            // Abre o browser para autenticação
            const result = await WebBrowser.openAuthSessionAsync(
              data.url,
              redirectUri
            );

            if (result.type === 'success' && result.url) {
              // Extrai os tokens da URL de callback
              const url = new URL(result.url);
              const params = new URLSearchParams(url.hash.substring(1));
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');

              if (accessToken) {
                // Define a sessão no Supabase
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                });

                if (sessionError) {
                  set({ isLoading: false });
                  return { success: false, error: sessionError.message };
                }

                if (sessionData.user) {
                  // Buscar dados adicionais do usuário
                  const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', sessionData.user.id)
                    .single();

                  set({
                    user: {
                      id: sessionData.user.id,
                      email: sessionData.user.email || '',
                      full_name: userData?.full_name || sessionData.user.user_metadata?.full_name || '',
                      avatar_url: userData?.avatar_url || sessionData.user.user_metadata?.avatar_url || null,
                      role: userData?.role || 'user',
                      is_creator: userData?.is_creator || false,
                      coins_balance: 0,
                    },
                    session: {
                      access_token: sessionData.session?.access_token || '',
                      refresh_token: sessionData.session?.refresh_token || '',
                      expires_at: sessionData.session?.expires_at || 0,
                    },
                    isAuthenticated: true,
                    isLoading: false,
                  });

                  return { success: true };
                }
              }
            }

            set({ isLoading: false });
            return { success: false, error: 'Autenticação cancelada' };
          }

          set({ isLoading: false });
          return { success: false, error: 'Erro ao iniciar autenticação' };
        } catch (error) {
          console.error('Google login error:', error);
          set({ isLoading: false });
          return { success: false, error: 'Erro ao fazer login com Google' };
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
