'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem('admin_authenticated') === 'true';
      const loginTime = localStorage.getItem('admin_login_time');

      // Verificar se a sessao expirou (24 horas)
      if (isAuth && loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
          // Sessao expirada
          localStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_login_time');
          setIsAuthenticated(false);
          router.push('/admin/login');
          return;
        }
      }

      if (!isAuth) {
        setIsAuthenticated(false);
        router.push('/admin/login');
      } else {
        setIsAuthenticated(true);
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
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_login_time');
    router.push('/admin/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
    >
      Sair
    </button>
  );
}
