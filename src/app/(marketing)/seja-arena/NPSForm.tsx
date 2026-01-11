'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { NPSScoreSelector } from './NPSScoreSelector';
import { submitNpsLead } from '@/actions/leads';

interface NPSFormProps {
  siteName: string;
  creatorName: string;
  logoUrl: string;
}

export function NPSForm({ siteName, creatorName, logoUrl }: NPSFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sistema de steps - agora com 5 steps
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Validacao por step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1 && score === null) {
      newErrors.score = 'Por favor, selecione uma nota';
    }

    if (step === 2 && (!reason || reason.trim().length < 3)) {
      newErrors.reason = 'Por favor, explique o motivo (minimo 3 caracteres)';
    }

    if (step === 3 && (!name || name.trim().length < 2)) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (step === 4 && (!email || !email.includes('@'))) {
      newErrors.email = 'Email inválido';
    }

    // Step 5 (WhatsApp) é opcional, não precisa validar

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navegacao
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit
  async function handleSubmit() {
    // Validar LGPD antes de enviar
    if (!lgpdAccepted) {
      setErrors({ lgpd: 'Você precisa aceitar os termos para continuar' });
      return;
    }

    setIsLoading(true);

    const result = await submitNpsLead({
      score: score!,
      reason: reason.trim(),
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || undefined,
      lgpdConsent: lgpdAccepted,
    });

    setIsLoading(false);

    if (result.error) {
      setErrors({ form: result.error });
      return;
    }

    // Redirecionar para o domínio comunidade (não comece)
    const leadId = result.data?.leadId;
    const baseUrl = 'https://comunidade.omocodoteamo.com.br';
    if (leadId) {
      window.location.href = `${baseUrl}/seja-arena/obrigado?leadId=${leadId}`;
    } else {
      window.location.href = `${baseUrl}/seja-arena/obrigado`;
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentStep < totalSteps) {
        nextStep();
      } else {
        handleSubmit();
      }
    }
  };

  // Determina a classe CSS baseado na posicao do step
  const getStepClass = (step: number) => {
    if (step === currentStep) return 'step-active';
    if (step < currentStep) return 'step-passed';
    return 'step-inactive';
  };

  return (
    <div className="step-container" onKeyDown={handleKeyDown}>
      {/* Step 1: Score */}
      <div className={`step-wrapper ${getStepClass(1)}`}>
        <div className="w-full max-w-2xl mx-auto text-center">
          {/* Logo */}
          {logoUrl.startsWith('/') ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={120}
              height={40}
              className="h-12 w-auto mx-auto mb-8 opacity-60"
              priority
            />
          ) : (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-12 w-auto mx-auto mb-8 opacity-60"
            />
          )}

          {/* Step indicator */}
          <span className="inline-block text-sm text-pink-500 font-medium mb-4">
            {currentStep} / {totalSteps}
          </span>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-surface-900 mb-8 leading-tight">
            De 0 a 10, qual a chance de você recomendar {creatorName} para um amigo?
          </h2>

          {/* Score selector */}
          <div className="mb-8">
            <NPSScoreSelector
              value={score}
              onChange={(newScore) => {
                setScore(newScore);
                setErrors({});
                // Auto-avanca direto para step 2 (evita stale closure com nextStep)
                setTimeout(() => setCurrentStep(2), 300);
              }}
              error={errors.score}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={nextStep}
              disabled={score === null}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-medium rounded-full
                       hover:from-pink-600 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200 press-scale shadow-lg shadow-pink-500/25"
            >
              Continuar
            </button>
          </div>

          <p className="mt-6 text-sm text-surface-400">
            Pressione Enter para continuar
          </p>
        </div>
      </div>

      {/* Step 2: Reason */}
      <div className={`step-wrapper ${getStepClass(2)}`}>
        <div className="w-full max-w-2xl mx-auto text-center">
          {/* Step indicator */}
          <span className="inline-block text-sm text-pink-500 font-medium mb-4">
            {currentStep} / {totalSteps}
          </span>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-surface-900 mb-8 leading-tight">
            Por que você deu a nota {score}?
          </h2>

          {/* Textarea */}
          <div className="text-left">
            <textarea
              id="reason"
              name="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors({});
              }}
              rows={6}
              placeholder="Conte-nos o motivo da sua avaliação..."
              className={`typeform-textarea ${errors.reason ? 'border-red-500' : ''}`}
              autoFocus={currentStep === 2}
            />
            {errors.reason && (
              <p className="mt-2 text-sm text-red-500">{errors.reason}</p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 text-surface-600 font-medium rounded-full
                       hover:bg-surface-100 transition-all duration-200"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-medium rounded-full
                       hover:from-pink-600 hover:to-red-600 transition-all duration-200 press-scale shadow-lg shadow-pink-500/25"
            >
              Continuar
            </button>
          </div>

          <p className="mt-6 text-sm text-surface-400">
            Pressione Enter para continuar
          </p>
        </div>
      </div>

      {/* Step 3: Nome */}
      <div className={`step-wrapper ${getStepClass(3)}`}>
        <div className="w-full max-w-xl mx-auto text-center">
          {/* Step indicator */}
          <span className="inline-block text-sm text-pink-500 font-medium mb-4">
            {currentStep} / {totalSteps}
          </span>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-surface-900 mb-8 leading-tight">
            Qual seu nome?
          </h2>

          {/* Input */}
          <div className="text-left">
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({});
              }}
              placeholder="Digite seu nome"
              className={`typeform-input ${errors.name ? 'border-red-500' : ''}`}
              autoFocus={currentStep === 3}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 text-surface-600 font-medium rounded-full
                       hover:bg-surface-100 transition-all duration-200"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-medium rounded-full
                       hover:from-pink-600 hover:to-red-600 transition-all duration-200 press-scale shadow-lg shadow-pink-500/25"
            >
              Continuar
            </button>
          </div>

          <p className="mt-6 text-sm text-surface-400">
            Pressione Enter para continuar
          </p>
        </div>
      </div>

      {/* Step 4: Email */}
      <div className={`step-wrapper ${getStepClass(4)}`}>
        <div className="w-full max-w-xl mx-auto text-center">
          {/* Step indicator */}
          <span className="inline-block text-sm text-pink-500 font-medium mb-4">
            {currentStep} / {totalSteps}
          </span>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-surface-900 mb-8 leading-tight">
            Qual seu email?
          </h2>

          {/* Input */}
          <div className="text-left">
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({});
              }}
              placeholder="seu@email.com"
              className={`typeform-input ${errors.email ? 'border-red-500' : ''}`}
              autoFocus={currentStep === 4}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 text-surface-600 font-medium rounded-full
                       hover:bg-surface-100 transition-all duration-200"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-medium rounded-full
                       hover:from-pink-600 hover:to-red-600 transition-all duration-200 press-scale shadow-lg shadow-pink-500/25"
            >
              Continuar
            </button>
          </div>

          <p className="mt-6 text-sm text-surface-400">
            Pressione Enter para continuar
          </p>
        </div>
      </div>

      {/* Step 5: WhatsApp (opcional) */}
      <div className={`step-wrapper ${getStepClass(5)}`}>
        <div className="w-full max-w-xl mx-auto text-center">
          {/* Step indicator */}
          <span className="inline-block text-sm text-pink-500 font-medium mb-4">
            {currentStep} / {totalSteps}
          </span>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-surface-900 mb-8 leading-tight">
            Qual seu WhatsApp?
          </h2>

          {/* Erro geral */}
          {errors.form && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-left">
              {errors.form}
            </div>
          )}

          {/* Input */}
          <div className="text-left">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="typeform-input"
              autoFocus={currentStep === 5}
            />
            <p className="mt-2 text-sm text-surface-400">Opcional</p>
          </div>

          {/* LGPD Consent Checkbox */}
          <div className="mt-6 text-left">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(e) => {
                    setLgpdAccepted(e.target.checked);
                    if (errors.lgpd) setErrors({});
                  }}
                  className="peer sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded transition-all duration-200
                  ${lgpdAccepted
                    ? 'bg-pink-500 border-pink-500'
                    : 'border-surface-300 group-hover:border-pink-400'
                  }
                  ${errors.lgpd ? 'border-red-500' : ''}
                `}>
                  {lgpdAccepted && (
                    <svg className="w-full h-full text-white p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-surface-600 leading-relaxed">
                Li e concordo com os{' '}
                <a
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-500 underline hover:text-pink-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-500 underline hover:text-pink-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  Política de Privacidade
                </a>
              </span>
            </label>
            {errors.lgpd && (
              <p className="mt-2 text-sm text-red-500">{errors.lgpd}</p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 text-surface-600 font-medium rounded-full
                       hover:bg-surface-100 transition-all duration-200"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !lgpdAccepted}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-medium rounded-full
                       hover:from-pink-600 hover:to-red-600 disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all duration-200 press-scale flex items-center gap-2 shadow-lg shadow-pink-500/25"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}
