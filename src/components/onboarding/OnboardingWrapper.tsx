'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingModal } from './OnboardingModal';
import { completeOnboarding } from '@/actions/onboarding';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { profile, isLoading, setOnboardingCompleted } = useAuth();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Mostrar onboarding apenas se:
    // 1. Não está carregando
    // 2. Tem perfil (usuário logado)
    // 3. Onboarding não foi completado
    if (!isLoading && profile && !profile.onboarding_completed) {
      // Pequeno delay para garantir que a página carregou
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, profile]);

  const handleComplete = useCallback(async (phone?: string) => {
    // Salvar no banco de dados (com telefone opcional)
    const result = await completeOnboarding(phone);

    if (result.success) {
      // Atualizar estado local
      setOnboardingCompleted();
      setShowOnboarding(false);

      // Redirecionar para desafios
      router.push('/desafios');
    }
  }, [setOnboardingCompleted, router]);

  const handleSkip = useCallback(async () => {
    // Mesmo ao pular, marca como completo para não mostrar novamente
    const result = await completeOnboarding();

    if (result.success) {
      setOnboardingCompleted();
      setShowOnboarding(false);
    }
  }, [setOnboardingCompleted]);

  return (
    <>
      {children}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </>
  );
}
