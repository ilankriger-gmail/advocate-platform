'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NPSScoreSelector } from './NPSScoreSelector';
import { submitNpsLead } from '@/actions/leads';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function NPSForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    // Validacao do score
    if (score === null) {
      setErrors({ score: 'Por favor, selecione uma nota' });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const reason = formData.get('reason') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    // Validacoes
    const newErrors: Record<string, string> = {};

    if (!reason || reason.trim().length < 3) {
      newErrors.reason = 'Por favor, explique o motivo';
    }

    if (!name || name.trim().length < 2) {
      newErrors.name = 'Nome e obrigatorio';
    }

    if (!email || !email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    const result = await submitNpsLead({
      score,
      reason: reason.trim(),
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || undefined,
    });

    setIsLoading(false);

    if (result.error) {
      setErrors({ form: result.error });
      return;
    }

    // Redirecionar para pagina de obrigado
    router.push('/seja-arena/obrigado');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Erro geral */}
      {errors.form && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {errors.form}
        </div>
      )}

      {/* Seletor de nota NPS */}
      <NPSScoreSelector
        value={score}
        onChange={setScore}
        error={errors.score}
      />

      {/* Motivo da nota */}
      <div className="w-full">
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Por que você deu a nota {score !== null ? score : '...'}?
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={4}
          placeholder="Conte-nos o motivo da sua avaliacao..."
          className={`
            w-full px-4 py-3
            bg-white border rounded-xl
            text-gray-900 placeholder:text-gray-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            resize-none
            ${errors.reason
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-pink-500 focus:ring-pink-200'
            }
          `}
        />
        {errors.reason && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.reason}
          </p>
        )}
      </div>

      {/* Nome */}
      <Input
        label="Seu nome"
        name="name"
        type="text"
        placeholder="Como podemos te chamar?"
        error={errors.name}
        required
      />

      {/* Email */}
      <Input
        label="Seu e-mail"
        name="email"
        type="email"
        placeholder="seu@email.com"
        error={errors.email}
        hint="Para enviarmos o convite da comunidade"
        required
      />

      {/* Telefone (opcional) */}
      <Input
        label="Seu WhatsApp (opcional)"
        name="phone"
        type="tel"
        placeholder="(11) 99999-9999"
        hint="Para enviarmos o convite da comunidade"
      />

      {/* Botao de envio */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
      >
        Enviar
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Ao enviar, você concorda com nossa política de privacidade.
      </p>
    </form>
  );
}
