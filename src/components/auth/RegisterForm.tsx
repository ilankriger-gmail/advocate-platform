'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { register } from '@/actions/auth';
import Link from 'next/link';

interface RegisterFormProps {
  prefilledEmail?: string;
}

/**
 * Formulário de registro com Client Component para interatividade
 * Aceita email pre-preenchido via query string ou prop
 */
export default function RegisterForm({ prefilledEmail }: RegisterFormProps) {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email') || prefilledEmail || '';

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(emailFromUrl);

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
    <form action={handleSubmit} className="space-y-6">
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
            minLength={6}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
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
            minLength={6}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Repita a senha"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </div>

      <div className="text-sm text-center">
        <span className="text-gray-600">Já tem uma conta? </span>
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Fazer login
        </Link>
      </div>
    </form>
  );
}
