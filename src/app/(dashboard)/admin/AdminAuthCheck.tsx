import { requireAdminOrCreator, isAuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Server Component para verificação de autenticacao admin/creator
 *
 * Verifica se o usuário esta autenticado e tem role='admin' OU is_creator=true.
 * Se não autorizado, redireciona para /login.
 */
export async function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  // Verificação server-side usando Supabase Auth e role/is_creator do usuário
  const auth = await requireAdminOrCreator();

  // Se houve erro de autenticacao ou autorizacao, redirecionar para login
  if (isAuthError(auth)) {
    redirect('/login');
  }

  // Usuário e admin/creator autenticado, renderizar children
  return <>{children}</>;
}