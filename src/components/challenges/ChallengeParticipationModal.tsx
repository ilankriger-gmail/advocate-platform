'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input } from '@/components/ui';
import { participateInChallenge, type ParticipationResult } from '@/actions/challenges';

interface Challenge {
  id: string;
  title: string;
  goal_type: 'repetitions' | 'time' | null;
  goal_value: number | null;
  hashtag: string | null;
  profile_to_tag: string | null;
  coins_reward: number;
}

interface ChallengeParticipationModalProps {
  challenge: Challenge;
  isOpen: boolean;
  onClose: () => void;
}

type ModalStage = 'form' | 'analyzing' | 'result';

export function ChallengeParticipationModal({
  challenge,
  isOpen,
  onClose,
}: ChallengeParticipationModalProps) {
  const router = useRouter();
  const [stage, setStage] = useState<ModalStage>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParticipationResult | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [formData, setFormData] = useState({
    resultValue: '',
    proofUrl: '',
  });

  // Animação dos passos de análise
  useEffect(() => {
    if (stage !== 'analyzing') {
      setAnalysisStep(0);
      return;
    }

    const steps = [0, 1, 2, 3, 4];
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length;
      setAnalysisStep(currentStep);
    }, 2000);

    return () => clearInterval(interval);
  }, [stage]);

  // Reset ao fechar
  const handleClose = () => {
    setStage('form');
    setError(null);
    setResult(null);
    setFormData({ resultValue: '', proofUrl: '' });
    onClose();
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const resultValue = parseInt(formData.resultValue);
    if (isNaN(resultValue) || resultValue <= 0) {
      setError('Informe um valor válido');
      return;
    }

    // Validar que é YouTube
    if (!formData.proofUrl || !isYouTubeUrl(formData.proofUrl)) {
      setError('Apenas links do YouTube são aceitos. O vídeo deve ser público.');
      return;
    }

    setIsLoading(true);
    setStage('analyzing');

    const response = await participateInChallenge({
      challengeId: challenge.id,
      resultValue,
      vídeoProofUrl: formData.proofUrl || undefined,
    });

    setIsLoading(false);

    if (response.error) {
      setError(response.error);
      setStage('form');
      return;
    }

    if (response.data) {
      setResult(response.data);
      setStage('result');
    }
  };

  const goalLabel = challenge.goal_type === 'time' ? 'segundos' : 'repeticoes';

  // Validar que é URL do YouTube
  const isYouTubeUrl = (url: string) => {
    return /youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\//.test(url);
  };

  // Passos de análise
  const analysisSteps = [
    { label: 'Conectando ao YouTube', icon: '🔗' },
    { label: 'Carregando vídeo', icon: '📥' },
    { label: 'Assistindo conteúdo', icon: '👀' },
    { label: 'Contando repetições', icon: '🔢' },
    { label: 'Finalizando análise', icon: '✨' },
  ];

  // Tela de análise em andamento
  const renderAnalyzingStage = () => (
    <div className="py-8 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
        <span className="text-4xl">🤖</span>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Analisando seu vídeo...
      </h3>
      <p className="text-gray-500 text-sm mb-6">
        Nossa IA está assistindo seu vídeo para validar o desafio.
        <br />
        Isso pode levar até 60 segundos.
      </p>

      <div className="space-y-3 max-w-xs mx-auto">
        {analysisSteps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
              index === analysisStep
                ? 'bg-blue-50 border border-blue-200'
                : index < analysisStep
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <span className="text-xl">
              {index < analysisStep ? '✅' : step.icon}
            </span>
            <span
              className={`text-sm font-medium ${
                index === analysisStep
                  ? 'text-blue-700'
                  : index < analysisStep
                  ? 'text-green-700'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
            {index === analysisStep && (
              <div className="ml-auto">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Tela de resultado
  const renderResultStage = () => {
    if (!result) return null;

    const { aiVerdict, participation } = result;
    const confidence = aiVerdict?.confidence ?? 0;
    const observedValue = aiVerdict?.observedValue;
    const reason = aiVerdict?.reason;
    const isValid = aiVerdict?.isValid;

    return (
      <div className="py-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isValid ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            <span className="text-3xl">{isValid ? '✅' : '⏳'}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {isValid ? 'Participação Enviada!' : 'Participação em Análise'}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {isValid
              ? 'A IA validou seu desafio com sucesso'
              : 'Aguardando revisão da equipe'}
          </p>
        </div>

        {/* Card de análise da IA */}
        {aiVerdict && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 mb-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🤖</span>
              <h4 className="font-semibold text-gray-900">Análise da IA</h4>
            </div>

            <div className="space-y-3">
              {/* Confiança */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Confiança</span>
                  <span className="font-medium text-gray-900">{confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      confidence >= 80
                        ? 'bg-green-500'
                        : confidence >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs text-gray-500 mb-1">Seu resultado</p>
                  <p className="font-bold text-gray-900">
                    {participation.result_value} {goalLabel}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs text-gray-500 mb-1">IA contou</p>
                  <p className="font-bold text-gray-900">
                    {observedValue ?? '-'} {observedValue ? goalLabel : ''}
                  </p>
                </div>
              </div>

              {/* Motivo */}
              {reason && (
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs text-gray-500 mb-1">Observação da IA</p>
                  <p className="text-sm text-gray-700">{reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Se não teve análise de IA */}
        {!aiVerdict && (
          <div className="bg-yellow-50 rounded-xl p-4 mb-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="font-semibold text-yellow-800">Análise de IA indisponível</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Não foi possível analisar o vídeo automaticamente.
                  Sua participação será revisada manualmente pela equipe.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
          <span className="text-sm text-gray-600">Status</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            participation.status === 'approved'
              ? 'bg-green-100 text-green-700'
              : participation.status === 'rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {participation.status === 'approved'
              ? 'Aprovado'
              : participation.status === 'rejected'
              ? 'Rejeitado'
              : 'Aguardando revisão'}
          </span>
        </div>

        <Button onClick={handleClose} className="w-full">
          Fechar
        </Button>
      </div>
    );
  };

  // Tela do formulário
  const renderFormStage = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info do desafio */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-900">{challenge.title}</h3>
        {challenge.goal_value && (
          <p className="text-sm text-blue-700 mt-1">
            Meta: {challenge.goal_value} {goalLabel}
          </p>
        )}
        <p className="text-sm text-blue-600 mt-1">
          Recompensa: {challenge.coins_reward} corações
        </p>
      </div>

      {/* Resultado */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Seu resultado ({goalLabel}) *
        </label>
        <Input
          type="number"
          value={formData.resultValue}
          onChange={(e) => setFormData({ ...formData, resultValue: e.target.value })}
          placeholder={`Ex: ${challenge.goal_value || 50}`}
          min="1"
          required
        />
      </div>

      {/* Link do YouTube */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Link do vídeo no YouTube *
        </label>
        <Input
          type="url"
          value={formData.proofUrl}
          onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          required
        />
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Importante:</strong> O vídeo deve ser <strong>PÚBLICO</strong> no YouTube.
            Vídeos não listados ou privados não serão analisados.
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Nossa IA vai assistir seu vídeo e validar se você bateu a meta!
        </p>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Acoes */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          Enviar Participação
        </Button>
      </div>
    </form>
  );

  // Título do modal baseado no estágio
  const getModalTitle = () => {
    switch (stage) {
      case 'analyzing':
        return 'Verificando Desafio';
      case 'result':
        return 'Resultado da Verificação';
      default:
        return 'Participar do Desafio';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={stage === 'analyzing' ? () => {} : handleClose}
      title={getModalTitle()}
    >
      {stage === 'form' && renderFormStage()}
      {stage === 'analyzing' && renderAnalyzingStage()}
      {stage === 'result' && renderResultStage()}
    </Modal>
  );
}
