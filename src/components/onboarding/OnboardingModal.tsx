'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const steps: OnboardingStep[] = [
  {
    icon: (
      <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30">
        <span className="text-4xl">🎉</span>
      </div>
    ),
    title: 'Bem-vindo à Arena Te Amo!',
    description: 'Aqui você pratica o bem e é premiado por cada ato de amor.',
    highlight: 'Faça o bem, ganhe recompensas!',
  },
  {
    icon: (
      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
        <span className="text-4xl">🏆</span>
      </div>
    ),
    title: 'Complete desafios para ganhar corações',
    description: 'Escolha desafios diários e semanais para acumular pontos.',
    highlight: 'Cada desafio completo = mais corações ❤️',
  },
  {
    icon: (
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
        <span className="text-4xl">🎁</span>
      </div>
    ),
    title: 'Troque seus corações por prêmios',
    description: 'Use seus corações acumulados para resgatar recompensas incríveis.',
    highlight: 'Quanto mais você pratica, mais você ganha!',
  },
  {
    icon: (
      <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30">
        <span className="text-4xl">🚀</span>
      </div>
    ),
    title: 'Vamos começar!',
    description: 'Escolha seu primeiro desafio e comece sua jornada de amor.',
    highlight: 'Sua primeira missão te espera!',
  },
];

// Animações
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const }
  },
  exit: { opacity: 0, x: -50 },
};

export function OnboardingModal({ isOpen, onComplete, onSkip }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Indicador de progresso */}
              <div className="flex gap-1.5 p-4 justify-center">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'w-8 bg-primary-500'
                        : index < currentStep
                        ? 'w-4 bg-primary-300'
                        : 'w-4 bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Conteúdo animado */}
              <div className="px-8 pb-8 pt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col items-center text-center"
                  >
                    {/* Ícone */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                      className="mb-6"
                    >
                      {step.icon}
                    </motion.div>

                    {/* Título */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h2>

                    {/* Descrição */}
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Destaque */}
                    {step.highlight && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-r from-primary-50 to-pink-50 border border-primary-100 rounded-xl px-4 py-3"
                      >
                        <p className="text-primary-700 font-medium text-sm">
                          {step.highlight}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Botões */}
                <div className="flex flex-col gap-3 mt-8">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleNext}
                  >
                    {isLastStep ? 'Começar agora!' : 'Próximo'}
                  </Button>

                  {!isLastStep && (
                    <button
                      onClick={handleSkip}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors py-2"
                    >
                      Pular introdução
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
