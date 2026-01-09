'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAdminSession } from '@/actions/admin-auth';

export function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar sessão via server action segura
        const isAuth = await checkAdminSession();

        if (!isAuth) {
          setIsAuthenticated(false);
          router.push('/admin/login');
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Em caso de erro, redirecionar para login
        setIsAuthenticated(false);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Chamar server action segura para logout
      const { adminLogout } = await import('@/actions/admin-auth');
      await adminLogout();
      // O server action redireciona automaticamente para /admin/login
    } catch (error) {
      // Em caso de erro, forçar navegação para login
      setIsLoading(false);
      window.location.href = '/admin/login';
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Saindo...' : 'Sair'}
    </button>
  );
}
