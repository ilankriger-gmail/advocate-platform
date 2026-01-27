'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
  action?: 'desafios' | 'feed';
  hasPhoneInput?: boolean;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (phone?: string) => void;
  onSkip: () => void;
}

const steps: OnboardingStep[] = [
  {
    icon: (
      <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30">
        <span className="text-4xl">❤️</span>
      </div>
    ),
    title: 'Bem-vindo à Arena Te Amo!',
    description: 'Aqui você ganha corações ❤️ só de participar da comunidade!',
    highlight: 'Quanto mais você engaja, mais corações acumula!',
  },
  {
    icon: (
      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
        <span className="text-4xl">💬</span>
      </div>
    ),
    title: 'Todo engajamento vale!',
    description: 'Curtiu um post? +1❤️\nComentou? +1❤️\nSeguiu alguém? +1❤️\nCompartilhou? +1❤️',
    highlight: 'Cada ação = 1 coração. Simples assim!',
  },
  {
    icon: (
      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
        <span className="text-4xl">👥</span>
      </div>
    ),
    title: 'Indique amigos, ganhe mais!',
    description: 'Convide amigos para a Arena. Quando eles entrarem, vocês dois ganham 100 corações!',
    highlight: 'Seu link de indicação está em Desafios!',
  },
  {
    icon: (
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
        <span className="text-4xl">📱</span>
      </div>
    ),
    title: 'Quer receber novidades?',
    description: 'Deixe seu telefone para receber atualizações exclusivas da comunidade!',
    highlight: 'Totalmente opcional. Você pode pular se preferir.',
    hasPhoneInput: true,
  },
  {
    icon: (
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
        <span className="text-4xl">🎁</span>
      </div>
    ),
    title: 'Troque por prêmios!',
    description: 'Acumule corações e resgate prêmios exclusivos na aba Prêmios.',
    highlight: 'Quanto mais você participa, mais você ganha!',
  },
  {
    icon: (
      <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30">
        <span className="text-4xl">🏆</span>
      </div>
    ),
    title: 'Comece com um desafio!',
    description: 'Vá em Desafios e participe de um ato de amor. É rápido, divertido e você já ganha corações!',
    highlight: '🎯 Primeiro desafio = primeiros corações!',
    action: 'desafios',
  },
];

// Formatar telefone brasileiro
function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

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
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    if (formatted.replace(/\D/g, '').length <= 11) {
      setPhone(formatted);
    }
  };

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete(phone || undefined);
      // Se o último passo tem ação, redireciona
      if (step.action === 'desafios') {
        router.push('/desafios');
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, onComplete, step.action, router, phone]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  if (!isOpen) return null;

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

                    {/* Phone input (optional) */}
                    {step.hasPhoneInput && (
                      <div className="w-full mb-4">
                        <label className="block text-sm font-medium text-gray-600 mb-2 text-left">
                          Telefone (opcional)
                        </label>
                        <Input
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder="(XX) XXXXX-XXXX"
                          className="text-center text-lg"
                        />
                      </div>
                    )}

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
                    {isLastStep ? (step.action === 'desafios' ? 'Ver Desafios 🏆' : 'Começar agora!') : 'Próximo'}
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
