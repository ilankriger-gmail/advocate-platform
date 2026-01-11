/**
 * CSRF Protection
 *
 * Next.js Server Actions ja tem protecao CSRF built-in via:
 * - Same-origin policy
 * - Cookies HttpOnly com SameSite
 *
 * Este modulo adiciona camada extra para APIs e formularios tradicionais
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = '__csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Gera um token CSRF seguro
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Define o token CSRF no cookie (chamado no server component)
 */
export async function setCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = generateCSRFToken();
    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    });
  }

  return token;
}

/**
 * Obtem o token CSRF do cookie
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Valida o token CSRF do header contra o cookie
 */
export async function validateCSRFToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Usar timingSafeEqual para prevenir timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    return false;
  }
}

/**
 * Middleware helper para validar CSRF em API routes
 *
 * @example
 * export async function POST(request: Request) {
 *   const csrfValid = await validateCSRFToken(request);
 *   if (!csrfValid) {
 *     return Response.json({ error: 'Invalid CSRF token' }, { status: 403 });
 *   }
 *   // ... rest of handler
 * }
 */
export async function requireCSRF(request: Request): Promise<Response | null> {
  const isValid = await validateCSRFToken(request);

  if (!isValid) {
    return Response.json(
      { error: 'Token CSRF invalido ou ausente' },
      { status: 403 }
    );
  }

  return null; // Continuar processamento
}
