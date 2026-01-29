'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  siteName: string;
  subtitle: string;
  logoUrl?: string;
}

/**
 * Icone do Google em SVG
 */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
      <path
        fill="#ffffff"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#ffffff"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#ffffff"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#ffffff"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * Icone de Email
 */
function EmailIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

/**
 * Componente de loading
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
    </div>
  );
}

type AuthMode = 'select' | 'login' | 'register';

/**
 * Formulario de Login com Google OAuth e Email
 */
export default function LoginForm({ siteName, subtitle, logoUrl = '/logo.png' }: LoginFormProps) {
  const { user, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mostrar erro de redirect (ex: Google OAuth sem lead aprovado)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'lead_required') {
      setError('Para criar sua conta, primeiro preencha o formulário de inscrição.');
    } else if (errorParam === 'auth_callback_error') {
      setError('Erro na autenticação. Tente novamente.');
    }
  }, [searchParams]);

  // Redireciona se já autenticado
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Função para lidar com o login Google
  async function handleGoogleSignIn() {
    setIsSigningIn(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setError('Erro ao fazer login com Google');
      setIsSigningIn(false);
    }
  }

  // Função para lidar com login por email
  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setIsSigningIn(true);
    setError('');

    if (!email || !password) {
      setError('Preencha todos os campos');
      setIsSigningIn(false);
      return;
    }

    const result = await signInWithEmail(email, password);
    if (result.error) {
      setError(result.error);
      setIsSigningIn(false);
    }
  }

  // Função para cadastro por email
  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setIsSigningIn(true);
    setError('');
    setSuccess('');

    if (!email || !password || !name) {
      setError('Preencha todos os campos');
      setIsSigningIn(false);
      return;
    }

    if (!ageConfirmed) {
      setError('Você precisa confirmar que tem 13 anos ou mais');
      setIsSigningIn(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsSigningIn(false);
      return;
    }

    const result = await signUpWithEmail(email, password, name);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Conta criada! Verifique seu email para confirmar o cadastro.');
      setEmail('');
      setPassword('');
      setName('');
    }
    setIsSigningIn(false);
  }

  // Mostra loading enquanto verifica autenticacao
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Se já está autenticado, mostra loading enquanto redireciona
  if (user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl max-w-md w-full">
        {/* Logo / Título */}
        <div className="text-center mb-8">
          {logoUrl.startsWith('/') ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={180}
              height={60}
              className="h-16 w-auto mx-auto mb-4"
              priority
            />
          ) : (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <p className="text-gray-600">
            {subtitle}
          </p>
          <p className="text-lg font-semibold text-gray-700 mt-2">
            Pratique o bem. Seja premiado.
          </p>
        </div>

        {/* Aviso de acesso restrito */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 text-center">
            Apenas usuários aprovados podem acessar a plataforma.
          </p>
        </div>

        {/* Mensagens de erro/sucesso */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600 text-center">{error}</p>
            {searchParams.get('error') === 'lead_required' && (
              <p className="text-sm text-center mt-2">
                <Link href="/seja-arena" className="text-pink-600 font-medium underline hover:text-pink-700">
                  Preencher formulário de inscrição →
                </Link>
              </p>
            )}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-600 text-center">{success}</p>
          </div>
        )}

        {/* Modo de seleção */}
        {authMode === 'select' && (
          <>
            {/* Divisor visual */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Entre para continuar
                </span>
              </div>
            </div>

            {/* Botao Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center py-3 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] mb-3"
              style={{ backgroundColor: '#4285F4' }}
              onMouseEnter={(e) => {
                if (!isSigningIn) {
                  e.currentTarget.style.backgroundColor = '#3367D6';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4285F4';
              }}
            >
              {isSigningIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Entrando...
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Entrar com Google
                </>
              )}
            </button>

            {/* Botao Email */}
            <button
              onClick={() => setAuthMode('login')}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center py-3 px-6 rounded-xl text-gray-700 font-semibold text-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] border border-gray-300 hover:bg-gray-50"
            >
              <EmailIcon />
              Entrar com Email
            </button>

            {/* Link para cadastro */}
            <p className="mt-4 text-center text-sm text-gray-600">
              Não tem conta?{' '}
              <button
                onClick={() => setAuthMode('register')}
                className="text-gray-700 font-medium hover:text-gray-900 underline"
              >
                Criar conta
              </button>
            </p>
          </>
        )}

        {/* Modo de login por email */}
        {authMode === 'login' && (
          <>
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full flex items-center justify-center py-3 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] bg-gray-700 hover:bg-gray-800"
              >
                {isSigningIn ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="mt-4 space-y-3">
              <div className="text-center">
                <Link
                  href="/esqueci-senha"
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => { setAuthMode('select'); setError(''); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Voltar
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setError(''); }}
                  className="text-gray-700 font-medium hover:text-gray-900 underline"
                >
                  Criar conta
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modo de cadastro por email */}
        {authMode === 'register' && (
          <>
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  placeholder="Seu nome"
                  required
                />
              </div>
              <div>
                <label htmlFor="email-register" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email-register"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password-register" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  id="password-register"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
              {/* Confirmação de idade (13+) */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="ageConfirmed"
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="ageConfirmed" className="text-gray-600">
                    Confirmo que tenho 13 anos ou mais
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full flex items-center justify-center py-3 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] bg-gray-700 hover:bg-gray-800"
              >
                {isSigningIn ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                onClick={() => { setAuthMode('select'); setError(''); setSuccess(''); setAgeConfirmed(false); }}
                className="text-gray-500 hover:text-gray-700"
              >
                Voltar
              </button>
              <button
                onClick={() => { setAuthMode('login'); setError(''); setSuccess(''); setAgeConfirmed(false); }}
                className="text-gray-700 font-medium hover:text-gray-900 underline"
              >
                Já tenho conta
              </button>
            </div>
          </>
        )}

        {/* Link para inscrição (apenas no modo select) */}
        {authMode === 'select' && (
          <p className="mt-6 text-center text-sm text-gray-600">
            Quer fazer parte da comunidade?{' '}
            <a
              href="https://comece.omocodoteamo.com.br"
              className="text-gray-700 font-medium hover:text-gray-900 underline"
            >
              Inscreva-se aqui
            </a>
          </p>
        )}

        {/* Texto de rodape */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Ao entrar, você concorda com nossos{' '}
          <a href="/termos" className="text-gray-500 hover:text-gray-600">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="/privacidade" className="text-gray-500 hover:text-gray-600">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
}
