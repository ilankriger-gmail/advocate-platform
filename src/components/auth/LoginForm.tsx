'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { login } from '@/actions/auth';
import Link from 'next/link';

/**
 * Formulário de login com Client Component para interatividade
 */
export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // Se não houver erro, o redirect acontece automaticamente
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="seu@email.com"
      />

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Senha
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Sua senha"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link
            href="/esqueci-senha"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Esqueceu sua senha?
          </Link>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>

      <div className="text-sm text-center">
        <span className="text-gray-600">Ainda não tem conta? </span>
        <Link
          href="/registro"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Criar conta
        </Link>
      </div>
    </form>
  );
}
