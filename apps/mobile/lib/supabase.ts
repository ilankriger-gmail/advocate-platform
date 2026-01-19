import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Verificar se estamos no servidor (SSR)
const isServer = typeof window === 'undefined';

// Cliente Supabase lazy-loaded para evitar problemas de SSR
let _supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (isServer) {
    // Retorna um cliente sem storage para SSR
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return _supabase;
};

// Exporta getter para compatibilidade
export const supabase = isServer
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null!;

// Re-exporta para uso em componentes client
export { getSupabase as default };
