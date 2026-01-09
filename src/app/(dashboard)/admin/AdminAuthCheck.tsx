'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Componente que verifica se o usuário é criador (is_creator = true)
 * Redireciona para /login se não estiver autenticado ou não for criador
 */
export function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isCreator = user?.user_metadata?.is_creator === true;

  useEffect(() => {
    if (!isLoading && (!user || !isCreator)) {
      router.push('/login');
    }
  }, [user, isCreator, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || !isCreator) {
    return null;
  }

  return <>{children}</>;
}
