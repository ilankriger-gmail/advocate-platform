'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  siteName: string;
  subtitle: string;
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
 * Componente de loading
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
    </div>
  );
}

/**
 * Formulario de Login com Google OAuth
 */
export default function LoginForm({ siteName, subtitle }: LoginFormProps) {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Redireciona se já autenticado
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Função para lidar com o login
  async function handleGoogleSignIn() {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setIsSigningIn(false);
    }
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
          <Image
            src="/logo.png"
            alt={siteName}
            width={180}
            height={60}
            className="h-16 w-auto mx-auto mb-4"
            priority
          />
          <p className="text-gray-600">
            {subtitle}
          </p>
        </div>

        {/* Aviso de acesso restrito */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 text-center">
            Apenas usuários aprovados podem acessar a plataforma.
          </p>
        </div>

        {/* Divisor visual */}
        <div className="relative mb-8">
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
          className="w-full flex items-center justify-center py-3 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
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

        {/* Link para inscrição */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Quer fazer parte da comunidade?{' '}
          <a
            href="https://comece.omocodoteamo.com.br"
            className="text-gray-700 font-medium hover:text-gray-900 underline"
          >
            Inscreva-se aqui
          </a>
        </p>

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
