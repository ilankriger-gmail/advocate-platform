'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { register } from '@/actions/auth';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

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

interface RegisterFormProps {
  prefilledEmail?: string;
}

/**
 * Formulário de registro com Client Component para interatividade
 * Aceita email pre-preenchido via query string ou prop
 * Suporta cadastro direto via landing page (source, id, name params)
 */
export default function RegisterForm({ prefilledEmail }: RegisterFormProps) {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email') || prefilledEmail || '';
  const { signInWithGoogle } = useAuth();

  // Parâmetros de origem (cadastro direto via landing page)
  const source = searchParams.get('source');
  const sourceId = searchParams.get('id');
  const sourceName = searchParams.get('name');
  const referralCode = searchParams.get('ref') || '';

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState('');

  // Cadastro direto via landing page: formulário de email/senha começa fechado
  const isDirectRegistration = !!(source && sourceId);
  const [showEmailForm, setShowEmailForm] = useState(!isDirectRegistration);

  // Salvar origem e referral em cookie para uso no callback de autenticação
  useEffect(() => {
    if (source && sourceId) {
      const sourceData = JSON.stringify({
        type: source,
        id: sourceId,
        name: sourceName || '',
      });
      document.cookie = `direct_registration_source=${encodeURIComponent(sourceData)}; path=/; max-age=3600; SameSite=Lax`;
    }
    if (referralCode) {
      document.cookie = `referral_code=${encodeURIComponent(referralCode)}; path=/; max-age=3600; SameSite=Lax`;
    }
  }, [source, sourceId, sourceName, referralCode]);

  // Função para criar conta com Google
  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError('Erro ao criar conta com Google');
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await register(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setSuccess(true);
      setLoading(false);
    }
  }

  // Mensagem de sucesso após registro
  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="rounded-md bg-green-50 p-4">
          <h3 className="text-lg font-medium text-green-800">
            Conta criada com sucesso!
          </h3>
          <p className="mt-2 text-sm text-green-700">
            Enviamos um email de confirmação para você. Por favor, verifique sua
            caixa de entrada e clique no link para ativar sua conta.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Botão Google */}
      <button
        onClick={handleGoogleSignUp}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center py-3 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
        style={{ backgroundColor: '#4285F4' }}
        onMouseEnter={(e) => {
          if (!googleLoading && !loading) {
            e.currentTarget.style.backgroundColor = '#3367D6';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#4285F4';
        }}
      >
        {googleLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Criando conta...
          </>
        ) : (
          <>
            <GoogleIcon />
            Criar conta com Google
          </>
        )}
      </button>

      {/* Divisor e opção de email/senha */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          {showEmailForm ? (
            <span className="px-4 bg-white text-gray-500">ou</span>
          ) : (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="px-4 bg-white text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Usar email e senha
            </button>
          )}
        </div>
      </div>

      {/* Formulário de email/senha */}
      {showEmailForm && (
      <form action={handleSubmit} className="space-y-4">
        {/* Código de indicação (hidden) */}
        {referralCode && <input type="hidden" name="ref" value={referralCode} />}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome completo
          </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Seu nome"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={!!emailFromUrl}
            className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${emailFromUrl ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder="seu@email.com"
          />
        </div>
        {emailFromUrl && (
          <p className="mt-1 text-xs text-gray-500">
            Este email foi aprovado para cadastro e não pode ser alterado.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Senha
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Crie uma senha segura"
          />
        </div>
        {/* Indicador de força e requisitos da senha */}
        {password && (
          <div className="mt-2">
            <PasswordStrengthIndicator password={password} />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirmar senha
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Repita a senha"
          />
        </div>
      </div>

      {/* Confirmação de idade (13+) */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="ageConfirmed"
            name="ageConfirmed"
            type="checkbox"
            required
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="ageConfirmed" className="text-gray-600">
            Confirmo que tenho 13 anos ou mais
          </label>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </div>

      </form>
      )}

      <div className="text-sm text-center">
        <span className="text-gray-600">Já tem uma conta? </span>
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Fazer login
        </Link>
      </div>
    </div>
  );
}
