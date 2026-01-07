/**
 * Funcoes utilitarias para autenticacao de admin
 *
 * Gerencia autenticacao de admin via localStorage com expiracao de sessao
 */

// Chaves do localStorage
export const ADMIN_AUTH_KEYS = {
  authenticated: 'admin_authenticated',
  loginTime: 'admin_login_time',
} as const;

// Configuracao de expiracao de sessao (em horas)
export const SESSION_EXPIRATION_HOURS = 24;

/**
 * Resultado da verificacao de autenticacao
 */
export interface AdminAuthResult {
  isAuthenticated: boolean;
  isExpired: boolean;
}

/**
 * Verifica se a sessao do admin esta autenticada e valida
 * Considera a expiracao de 24 horas
 */
export function checkAdminAuth(): AdminAuthResult {
  // Verificar se esta no client-side
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, isExpired: false };
  }

  const isAuth = localStorage.getItem(ADMIN_AUTH_KEYS.authenticated) === 'true';
  const loginTime = localStorage.getItem(ADMIN_AUTH_KEYS.loginTime);

  // Se nao esta autenticado, retorna false
  if (!isAuth) {
    return { isAuthenticated: false, isExpired: false };
  }

  // Verificar se a sessao expirou (24 horas)
  if (loginTime) {
    const loginDate = new Date(loginTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > SESSION_EXPIRATION_HOURS) {
      // Sessao expirada - limpa os dados
      clearAdminAuth();
      return { isAuthenticated: false, isExpired: true };
    }
  }

  return { isAuthenticated: true, isExpired: false };
}

/**
 * Verifica se o admin esta autenticado (versao simples)
 * Retorna apenas boolean para uso em verificacoes rapidas
 */
export function isAdminAuthenticated(): boolean {
  const { isAuthenticated } = checkAdminAuth();
  return isAuthenticated;
}

/**
 * Define a autenticacao do admin
 * Armazena o estado de autenticacao e o horario de login
 */
export function setAdminAuth(): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(ADMIN_AUTH_KEYS.authenticated, 'true');
  localStorage.setItem(ADMIN_AUTH_KEYS.loginTime, new Date().toISOString());
}

/**
 * Limpa a autenticacao do admin
 * Remove todos os dados de sessao do localStorage
 */
export function clearAdminAuth(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ADMIN_AUTH_KEYS.authenticated);
  localStorage.removeItem(ADMIN_AUTH_KEYS.loginTime);
}

/**
 * Obtem o tempo restante da sessao em horas
 * Retorna null se nao estiver autenticado
 */
export function getSessionTimeRemaining(): number | null {
  if (typeof window === 'undefined') return null;

  const isAuth = localStorage.getItem(ADMIN_AUTH_KEYS.authenticated) === 'true';
  const loginTime = localStorage.getItem(ADMIN_AUTH_KEYS.loginTime);

  if (!isAuth || !loginTime) return null;

  const loginDate = new Date(loginTime);
  const now = new Date();
  const hoursPassed = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
  const hoursRemaining = SESSION_EXPIRATION_HOURS - hoursPassed;

  return Math.max(0, hoursRemaining);
}

/**
 * Renova a sessao do admin
 * Atualiza o horario de login para estender a sessao
 */
export function renewAdminSession(): void {
  if (!isAdminAuthenticated()) return;

  localStorage.setItem(ADMIN_AUTH_KEYS.loginTime, new Date().toISOString());
}
