import { requireAdmin, isAuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Server Component para verificacao de autenticacao admin
 *
 * Verifica se o usuario esta autenticado e tem role='admin' no servidor.
 * Se nao autorizado, redireciona para /admin/login.
 *
 * Esta implementacao substitui a verificacao client-side insegura via localStorage.
 */
export async function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  // Verificacao server-side usando Supabase Auth e role do usuario
  const auth = await requireAdmin();

  // Se houve erro de autenticacao ou autorizacao, redirecionar para login
  if (isAuthError(auth)) {
    redirect('/admin/login');
  }

  // Usuario e admin autenticado, renderizar children
  return <>{children}</>;
}

/**
 * Botao de logout do admin
 *
 * Chama o Server Action adminLogout para encerrar a sessao Supabase de forma segura.
 * Usa useTransition para mostrar loading state durante o logout.
 */
'use client';

import { useTransition } from 'react';
import { adminLogout } from '@/actions/admin-auth';

export function AdminLogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await adminLogout();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? 'Saindo...' : 'Sair'}
    </button>
  );
}