'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { resetPassword } from '@/actions/auth';

interface ForgotPasswordFormProps {
  siteName: string;
  logoUrl?: string;
}

export default function ForgotPasswordForm({
  siteName,
  logoUrl = '/logo.png',
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!email) {
      setError('Digite seu email');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('email', email);

    const result = await resetPassword(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setIsSubmitting(false);
  }

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
              priority
            />
          ) : (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <h1 className="text-xl font-bold text-gray-800">
            Esqueci minha senha
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Digite seu email para receber o link de recuperacao
          </p>
        </div>

        {/* Mensagem de sucesso */}
        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
                    Email enviado!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Se o email estiver cadastrado, voce recebera um link para redefinir sua senha.
                    Verifique tambem a pasta de spam.
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/login"
              className="block w-full text-center py-3 px-6 rounded-xl text-gray-700 font-semibold transition-all duration-200 hover:bg-gray-50 border border-gray-300"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
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
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                  autoFocus
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
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperacao'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Voltar para o login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
