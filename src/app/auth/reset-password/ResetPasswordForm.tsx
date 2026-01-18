'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { setNewPassword } from '@/actions/auth';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';

interface ResetPasswordFormProps {
  siteName: string;
  logoUrl?: string;
}

type FormState = 'loading' | 'ready' | 'expired' | 'success';

export default function ResetPasswordForm({
  siteName,
  logoUrl = '/logo.png',
}: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificar se ha sessao de recuperacao valida
  useEffect(() => {
    async function checkSession() {
      const code = searchParams.get('code');

      if (code) {
        // Trocar codigo por sessao
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('Erro ao validar codigo:', error.message);
          setFormState('expired');
          return;
        }
      }

      // Verificar se usuario esta autenticado (sessao de recuperacao)
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setFormState('ready');
      } else {
        setFormState('expired');
      }
    }

    checkSession();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!password || !confirmPassword) {
      setError('Preencha todos os campos');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);

    const result = await setNewPassword(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setFormState('success');
    setIsSubmitting(false);
  }

  // Loading state
  if (formState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando link...</p>
        </div>
      </div>
    );
  }

  // Expired/Invalid state
  if (formState === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center">
            {logoUrl.startsWith('/') ? (
              <Image
                src={logoUrl}
                alt={siteName}
                width={180}
                height={60}
                className="h-16 w-auto mx-auto mb-4"
                style={{ filter: 'sepia(100%) saturate(300%) brightness(95%) hue-rotate(-5deg)' }}
                priority
              />
            ) : (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-16 w-auto mx-auto mb-4"
                style={{ filter: 'sepia(100%) saturate(300%) brightness(95%) hue-rotate(-5deg)' }}
              />
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 font-medium">
                  Link expirado ou invalido
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  O link de recuperacao de senha expirou ou e invalido.
                  Solicite um novo link.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/esqueci-senha"
              className="block w-full text-center py-3 px-6 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98] bg-gray-700 hover:bg-gray-800"
            >
              Solicitar novo link
            </Link>
            <Link
              href="/login"
              className="block w-full text-center py-3 px-6 rounded-xl text-gray-700 font-semibold transition-all duration-200 hover:bg-gray-50 border border-gray-300"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (formState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center">
            {logoUrl.startsWith('/') ? (
              <Image
                src={logoUrl}
                alt={siteName}
                width={180}
                height={60}
                className="h-16 w-auto mx-auto mb-4"
                style={{ filter: 'sepia(100%) saturate(300%) brightness(95%) hue-rotate(-5deg)' }}
                priority
              />
            ) : (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-16 w-auto mx-auto mb-4"
                style={{ filter: 'sepia(100%) saturate(300%) brightness(95%) hue-rotate(-5deg)' }}
              />
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm text-green-800 font-medium">
                  Senha redefinida com sucesso!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Sua nova senha foi salva. Agora você pode fazer login.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-6 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98] bg-gray-700 hover:bg-gray-800"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  // Ready state - show form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          {logoUrl.startsWith('/') ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={180}
              height={60}
              className="h-16 w-auto mx-auto mb-4"
              style={{ filter: 'sepia(100%) saturate(300%) brightness(95%) hue-rotate(-5deg)' }}
              priority
            />
          ) : (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-16 w-auto mx-auto mb-4"
              style={{ filter: 'sepia(100%) saturate(300%) brightness(95%) hue-rotate(-5deg)' }}
            />
          )}
          <h1 className="text-xl font-bold text-gray-800">
            Redefinir senha
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Digite sua nova senha
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nova senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
              placeholder="Digite sua nova senha"
              required
              autoFocus
            />
          </div>

          {/* Indicador de forca da senha */}
          <PasswordStrengthIndicator password={password} />

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirmar nova senha
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
              placeholder="Confirme sua nova senha"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] bg-gray-700 hover:bg-gray-800"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Salvando...
              </>
            ) : (
              'Salvar nova senha'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
