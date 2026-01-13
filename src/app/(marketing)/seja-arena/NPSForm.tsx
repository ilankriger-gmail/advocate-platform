'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { NPSScoreSelector } from './NPSScoreSelector';
import { submitNpsLead, checkExistingAccount } from '@/actions/leads';
import { validateName, validateReason, checkEmailTypo, validatePhone } from '@/lib/validation/nps-validation';

// Dados de origem (quando vem de uma landing page)
export interface SourceData {
  sourceType: 'landing_challenge' | 'landing_reward';
  sourceId: string;
  sourceName?: string;
}

interface NPSFormProps {
  siteName: string;
  creatorName: string;
  logoUrl: string;
  sourceData?: SourceData;
}

export function NPSForm({ siteName, creatorName, logoUrl, sourceData }: NPSFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados para validações avançadas
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<{
    message?: string;
    loginUrl?: string;
  } | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Sistema de steps - agora com 5 steps
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Validacao por step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1 && score === null) {
      newErrors.score = 'Por favor, selecione uma nota';
    }

    if (step === 2) {
      const reasonResult = validateReason(reason);
      if (!reasonResult.valid) {
        newErrors.reason = reasonResult.error || 'Por favor, explique o motivo';
      }
    }

    if (step === 3) {
      const nameResult = validateName(name);
      if (!nameResult.valid) {
        newErrors.name = nameResult.error || 'Nome inválido';
      }
    }

    if (step === 4) {
      // Validação mais rigorosa de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        newErrors.email = 'Email inválido. Use o formato: seu@email.com';
      }
      // Se tem sugestão de typo, alertar
      else if (emailSuggestion) {
        newErrors.email = `Você quis dizer ${emailSuggestion}? Clique em "Corrigir" ou verifique o email.`;
      }
      // Se tem conta existente já identificada, mostra o erro
      else if (accountStatus?.message) {
        newErrors.email = accountStatus.message;
      }
    }

    // Step 5 (WhatsApp) - validar se preenchido
    if (step === 5 && phone && phone.trim()) {
      const phoneResult = validatePhone(phone);
      if (!phoneResult.valid) {
        newErrors.phone = phoneResult.error || 'Telefone inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navegacao
  const nextStep = async () => {
    // Se está no step 4 (email), verificar conta existente antes de avançar
    if (currentStep === 4 && email && email.includes('@')) {
      setIsCheckingEmail(true);
      const result = await checkExistingAccount(email);
      setIsCheckingEmail(false);

      if (result.hasAccount || result.hasPendingLead || result.hasApprovedLead) {
        setAccountStatus({ message: result.message, loginUrl: result.loginUrl });
        setErrors({ email: result.message || 'Email já cadastrado' });
        return;
      }
      setAccountStatus(null);
    }

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

    // Validar telefone se preenchido
    if (phone && phone.trim()) {
      const phoneResult = validatePhone(phone);
      if (!phoneResult.valid) {
        setErrors({ phone: phoneResult.error || 'Telefone inválido' });
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await submitNpsLead({
        score: score!,
        reason: reason.trim(),
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || undefined,
        lgpdConsent: lgpdAccepted,
        // Dados de origem (landing page)
        sourceType: sourceData?.sourceType,
        sourceId: sourceData?.sourceId,
        sourceName: sourceData?.sourceName,
      });

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
    } catch (err) {
      console.error('Erro ao enviar formulário:', err);
      setErrors({ form: 'Erro ao enviar. Por favor, tente novamente.' });
    } finally {
      setIsLoading(false);
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
              className="h-12 w-auto mx-auto mb-4 opacity-60"
              priority
            />
          ) : (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-12 w-auto mx-auto mb-4 opacity-60"
            />
          )}

          {/* Estimativa de tempo */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Leva menos de 2 minutos</span>
          </div>

          {/* Step indicator */}
          <div className="inline-block text-sm text-pink-500 font-medium mb-4">
            {currentStep} / {totalSteps}
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-surface-800 mb-6 sm:mb-8 leading-snug px-2">
            De 0 a 10, qual a chance de você recomendar {creatorName} para um amigo?
          </h2>

          {/* Score selector */}
          <div className="mb-6 sm:mb-8">
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
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-pink-500 text-white text-sm sm:text-base font-medium rounded-full
                       hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              Continuar
            </button>
          </div>

          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-surface-400">
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
          <div className="flex justify-center gap-3 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="px-5 sm:px-6 py-2.5 sm:py-3 text-surface-600 text-sm sm:text-base font-medium rounded-full
                       hover:bg-surface-100 transition-all duration-200"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-pink-500 text-white text-sm sm:text-base font-medium rounded-full
                       hover:bg-pink-600 transition-all duration-200"
            >
              Continuar
            </button>
          </div>

          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-surface-400">
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
          <div className="flex justify-center gap-3 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="px-5 sm:px-6 py-2.5 sm:py-3 text-surface-600 text-sm sm:text-base font-medium rounded-full
                       hover:bg-surface-100 transition-all duration-200"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-pink-500 text-white text-sm sm:text-base font-medium rounded-full
                       hover:bg-pink-600 transition-all duration-200"
            >
              Continuar
            </button>
          </div>

          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-surface-400">
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
                const newEmail = e.target.value;
                setEmail(newEmail);
                if (errors.email) setErrors({});
                setAccountStatus(null);

                // Verificar typo de domínio
                const typoCheck = checkEmailTypo(newEmail);
                if (typoCheck.hasTypo && typoCheck.correctedEmail) {
                  setEmailSuggestion(typoCheck.correctedEmail);
                } else {
                  setEmailSuggestion(null);
                }
              }}
              placeholder="seu@email.com"
              className={`typeform-input ${errors.email ? 'border-red-500' : ''}`}
              autoFocus={currentStep === 4}
            />

            {/* Sugestão de correção de typo */}
            {emailSuggestion && !errors.email && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800">
                  Você quis dizer <strong>{emailSuggestion}</strong>?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(emailSuggestion);
                      setEmailSuggestion(null);
                    }}
                    className="text-yellow-700 underline font-medium hover:text-yellow-900"
                  >
                    Corrigir
                  </button>
                </p>
              </div>
            )}

            {/* Mensagem de erro com link para login */}
            {errors.email && (
              <div className={`mt-2 text-sm ${accountStatus?.loginUrl ? 'p-3 bg-blue-50 border border-blue-200 rounded-xl' : ''}`}>
                <p className={accountStatus?.loginUrl ? 'text-blue-800' : 'text-red-500'}>
                  {errors.email}
                  {accountStatus?.loginUrl && (
                    <>
                      {' '}
                      <a
                        href={accountStatus.loginUrl}
                        className="text-blue-600 underline font-medium hover:text-blue-800"
                      >
                        Fazer login
                      </a>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-3 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="px-5 sm:px-6 py-2.5 sm:py-3 text-surface-600 text-sm sm:text-base font-medium rounded-full
                       hover:bg-surface-100 transition-all duration-200"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={isCheckingEmail}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-pink-500 text-white text-sm sm:text-base font-medium rounded-full
                       hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all duration-200 flex items-center gap-2"
            >
              {isCheckingEmail ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                  Verificando...
                </>
              ) : (
                'Continuar'
              )}
            </button>
          </div>

          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-surface-400">
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
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors({});
              }}
              placeholder="(00) 00000-0000"
              className={`typeform-input ${errors.phone ? 'border-red-500' : ''}`}
              autoFocus={currentStep === 5}
            />
            {errors.phone ? (
              <p className="mt-2 text-sm text-red-500">{errors.phone}</p>
            ) : (
              <p className="mt-2 text-sm text-surface-400">Opcional - formato: (00) 00000-0000</p>
            )}
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
          <div className="flex justify-center gap-3 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="px-5 sm:px-6 py-2.5 sm:py-3 text-surface-600 text-sm sm:text-base font-medium rounded-full
                       hover:bg-surface-100 transition-all duration-200"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !lgpdAccepted}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-pink-500 text-white text-sm sm:text-base font-medium rounded-full
                       hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all duration-200 flex items-center gap-2"
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
