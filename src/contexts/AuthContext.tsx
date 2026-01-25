'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  role: string;
  is_creator: boolean;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setOnboardingCompleted: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Criar cliente uma única vez
  const [supabase] = useState(() => createClient());

  // Função para buscar dados do perfil do usuário
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, is_creator, full_name, avatar_url, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      // Ignorar erro PGRST116 (nenhum resultado) - usuário novo pode não ter perfil
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error.message);
        setProfile(null);
        return;
      }

      setProfile(data ? {
        role: data.role,
        is_creator: data.is_creator,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        onboarding_completed: data.onboarding_completed ?? false,
      } : null);
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', error);
      setProfile(null);
    }
  }, [supabase]);

  useEffect(() => {
    // Listener para mudanças de autenticação (configurar primeiro)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[Auth] Estado alterado:', event, currentSession?.user?.email);

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Buscar dados do perfil quando usuário faz login
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    // Obtém a sessão inicial
    const getInitialSession = async () => {
      try {
        // Usar getUser() ao invés de getSession() para validar o token
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.log('[Auth] Erro ao obter usuário:', error.message);
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        if (currentUser) {
          console.log('[Auth] Usuário encontrado:', currentUser.email);
          // Buscar sessão completa
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          setSession(currentSession);
          setUser(currentUser);
          await fetchProfile(currentUser.id);
        } else {
          console.log('[Auth] Nenhum usuário autenticado');
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('[Auth] Erro ao obter sessão inicial:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Cleanup do listener
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, fetchProfile]);

  // Login com Google
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Erro ao fazer login com Google:', error);
      throw error;
    }
  }, [supabase.auth]);

  // Login com Email
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Erro ao fazer login com email:', error);
      if (error.message === 'Invalid login credentials') {
        return { error: 'Email ou senha incorretos' };
      }
      if (error.message === 'Email not confirmed') {
        return { error: 'Por favor, confirme seu email antes de fazer login' };
      }
      return { error: error.message };
    }

    console.log('[Auth] Login com email bem sucedido:', data.user?.email);
    return { error: null };
  }, [supabase.auth]);

  // Cadastro com Email
  const signUpWithEmail = useCallback(async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      console.error('Erro ao criar conta:', error);
      if (error.message.includes('already registered')) {
        return { error: 'Este email já está cadastrado' };
      }
      if (error.message.includes('weak') || error.message.includes('easy to guess')) {
        return { error: 'Senha muito fraca. Use uma senha mais forte com letras, números e símbolos.' };
      }
      if (error.message.includes('at least')) {
        return { error: 'A senha deve ter pelo menos 6 caracteres' };
      }
      return { error: error.message };
    }

    return { error: null };
  }, [supabase.auth]);

  // Marcar onboarding como completo localmente
  const setOnboardingCompleted = useCallback(() => {
    setProfile((prev) => prev ? { ...prev, onboarding_completed: true } : null);
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    try {
      // Limpar sessao em todos os escopos
      await supabase.auth.signOut({ scope: 'global' });

      // Limpar estado local
      setUser(null);
      setSession(null);
      setProfile(null);

      // Pequeno delay para garantir que cookies foram limpos
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirecionar para login
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, tentar redirecionar
      window.location.href = '/login';
    }
  }, [supabase.auth]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    setOnboardingCompleted,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}
