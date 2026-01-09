import { requireAdmin, isAuthError } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLoginForm from './AdminLoginForm';

/**
 * Pagina de login do painel administrativo
 *
 * Server Component que verifica se o usuario ja esta autenticado como admin.
 * Se ja estiver logado, redireciona automaticamente para /admin.
 * Caso contrario, renderiza o formulario de login.
 *
 * Autentica via Supabase Auth usando email/senha e verifica role='admin'.
 * Substitui a implementacao insegura anterior que usava credenciais hardcoded
 * e localStorage para autenticacao.
 */
export default async function AdminLoginPage() {
  // Verificar se o usuario ja esta autenticado como admin
  const auth = await requireAdmin();

  // Se o usuario ja esta autenticado como admin, redirecionar para /admin
  if (!isAuthError(auth)) {
    redirect('/admin');
  }

  // Usuario nao esta autenticado ou nao e admin, mostrar formulario de login
  return <AdminLoginForm />;
}
