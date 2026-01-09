import { requireAdminOrCreator, isAuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Server Component para verificacao de autenticacao admin/creator
 *
 * Verifica se o usuario esta autenticado e tem role='admin' OU is_creator=true.
 * Se nao autorizado, redireciona para /login.
 */
export async function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  // Verificacao server-side usando Supabase Auth e role/is_creator do usuario
  const auth = await requireAdminOrCreator();

  // Se houve erro de autenticacao ou autorizacao, redirecionar para login
  if (isAuthError(auth)) {
    redirect('/login');
  }

  // Usuario e admin/creator autenticado, renderizar children
  return <>{children}</>;
}