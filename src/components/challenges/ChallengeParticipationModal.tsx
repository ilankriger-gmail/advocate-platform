'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input } from '@/components/ui';
import { participateInChallenge, type ParticipationResult } from '@/actions/challenges';

interface Challenge {
  id: string;
  title: string;
  type?: 'fisico' | 'atos_amor' | 'engajamento' | 'participe';
  goal_type: 'repetitions' | 'time' | null;
  goal_value: number | null;
  hashtag: string | null;
  profile_to_tag: string | null;
  coins_reward: number;
  action_instructions?: string | null;
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
    instagramUrl: '',
    isVideoPublic: false,
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
    setFormData({ resultValue: '', proofUrl: '', instagramUrl: '', isVideoPublic: false });
    onClose();
    router.refresh();
  };

  const isAtosAmor = challenge.type === 'atos_amor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Para desafios físicos, validar resultado
    let resultValue = 1; // Default para atos de amor
    if (!isAtosAmor) {
      resultValue = parseInt(formData.resultValue, 10);
      if (isNaN(resultValue) || resultValue <= 0) {
        setError('Informe um valor válido');
        return;
      }
    }

    // Validar que é YouTube
    if (!formData.proofUrl || !isYouTubeUrl(formData.proofUrl)) {
      setError('Apenas links do YouTube são aceitos. O vídeo deve ser público.');
      return;
    }

    // Validar checkbox de vídeo público
    if (!formData.isVideoPublic) {
      setError('Você precisa confirmar que o vídeo é público para ganhar corações.');
      return;
    }

    // Para Atos de Amor, validar também Instagram
    if (isAtosAmor) {
      if (!formData.instagramUrl || !isInstagramUrl(formData.instagramUrl)) {
        setError('O link do Instagram é obrigatório para Atos de Amor. Use link de post ou reel.');
        return;
      }
    }

    setIsLoading(true);
    setStage('analyzing');

    const response = await participateInChallenge({
      challengeId: challenge.id,
      resultValue,
      vídeoProofUrl: formData.proofUrl || undefined,
      instagramProofUrl: isAtosAmor ? formData.instagramUrl : undefined,
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

  const goalLabel = challenge.goal_type === 'time' ? 'segundos' : 'repetições';

  // Validar que é URL do YouTube (NAO aceita Shorts)
  const isYouTubeUrl = (url: string) => {
    // Bloquear Shorts
    if (/youtube\.com\/shorts\//i.test(url)) {
      return false;
    }
    return /youtube\.com\/watch|youtu\.be\//.test(url);
  };

  // Verificar se é URL de Shorts (para mostrar erro específico)
  const isYouTubeShorts = (url: string) => {
    return /youtube\.com\/shorts\//i.test(url);
  };

  // Validar que é URL do Instagram
  const isInstagramUrl = (url: string) => {
    return /instagram\.com\/(p|reel|reels)\//.test(url);
  };

  // Passos de análise (diferentes para atos de amor)
  const analysisSteps = isAtosAmor
    ? [
        { label: 'Conectando ao YouTube', icon: '🔗' },
        { label: 'Assistindo vídeo', icon: '👀' },
        { label: 'Verificando ato no YouTube', icon: '💝' },
        { label: 'Analisando Instagram', icon: '📸' },
        { label: 'Verificando post/reel', icon: '✨' },
        { label: 'Finalizando análise', icon: '🤖' },
      ]
    : [
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

    const { aiVerdict, instagramVerdict, participation } = result;
    const youtubeConfidence = aiVerdict?.confidence ?? 0;
    const instagramConfidence = instagramVerdict?.confidence ?? 0;
    const observedValue = aiVerdict?.observedValue;
    const youtubeReason = aiVerdict?.reason;
    const instagramReason = instagramVerdict?.reason;

    // Calcular confiança média para atos de amor
    const avgConfidence = isAtosAmor && instagramVerdict
      ? Math.round((youtubeConfidence + instagramConfidence) / 2)
      : youtubeConfidence;

    const isApproved = participation.status === 'approved';
    const isRejected = participation.status === 'rejected';

    return (
      <div className="py-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isApproved ? 'bg-green-100' : isRejected ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            <span className="text-3xl">{isApproved ? '✅' : isRejected ? '❌' : '⏳'}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {isApproved ? 'Participação Aprovada!' : isRejected ? 'Participação Rejeitada' : 'Participação em Análise'}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {isApproved
              ? `Você ganhou ${participation.coins_earned} corações!`
              : isRejected
              ? 'Sua participação não atendeu aos critérios'
              : 'Aguardando revisão da equipe'}
          </p>
        </div>

        {/* Card de análise da IA - YouTube */}
        {aiVerdict && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 mb-4 border border-red-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">▶️</span>
              <h4 className="font-semibold text-gray-900">Análise do YouTube</h4>
              <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
                aiVerdict.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {aiVerdict.isValid ? 'Válido' : 'Inválido'}
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Confiança</span>
                  <span className="font-medium text-gray-900">{youtubeConfidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      youtubeConfidence >= 80 ? 'bg-green-500' : youtubeConfidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${youtubeConfidence}%` }}
                  />
                </div>
              </div>

              {/* Valores (apenas para desafios físicos) */}
              {!isAtosAmor && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-xs text-gray-500">Seu resultado</p>
                    <p className="font-bold text-gray-900 text-sm">{participation.result_value} {goalLabel}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-xs text-gray-500">IA contou</p>
                    <p className="font-bold text-gray-900 text-sm">{observedValue ?? '-'} {observedValue ? goalLabel : ''}</p>
                  </div>
                </div>
              )}

              {youtubeReason && (
                <p className="text-xs text-gray-600 mt-2">{youtubeReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Card de análise da IA - Instagram (apenas para Atos de Amor) */}
        {isAtosAmor && instagramVerdict && (
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 mb-4 border border-pink-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📸</span>
              <h4 className="font-semibold text-gray-900">Análise do Instagram</h4>
              <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
                instagramVerdict.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {instagramVerdict.isValid ? 'Válido' : 'Inválido'}
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Confiança</span>
                  <span className="font-medium text-gray-900">{instagramConfidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      instagramConfidence >= 80 ? 'bg-green-500' : instagramConfidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${instagramConfidence}%` }}
                  />
                </div>
              </div>

              {instagramReason && (
                <p className="text-xs text-gray-600 mt-2">{instagramReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Confiança Média (para Atos de Amor) */}
        {isAtosAmor && aiVerdict && instagramVerdict && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 mb-4 border border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h4 className="font-semibold text-gray-900">Confiança Média</h4>
              </div>
              <span className={`text-xl font-bold ${
                avgConfidence >= 80 ? 'text-green-600' : avgConfidence >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {avgConfidence}%
              </span>
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
                  Não foi possível analisar automaticamente.
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
            Meta mínima: {challenge.goal_value + 1} {goalLabel}
          </p>
        )}
        <p className="text-sm text-blue-600 mt-1">
          Recompensa: {challenge.coins_reward} corações
        </p>
      </div>

      {/* Regras de meta (desafios físicos) */}
      {!isAtosAmor && challenge.goal_value && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg space-y-2">
          <p className="text-xs text-blue-800 font-medium">
            📋 <strong>Regras:</strong>
          </p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Você precisa bater a meta de <strong>{challenge.goal_value}</strong> e fazer <strong>no mínimo +1</strong></li>
            <li>Quanto mais fizer, melhor! Quem fizer mais será reconhecido como <strong>recordista</strong> 👑</li>
          </ul>
        </div>
      )}

      {/* Aviso: apenas o dono da conta (desafios físicos) */}
      {!isAtosAmor && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
          <p className="text-xs text-amber-800 font-medium">
            ⚠️ <strong>O dono da conta é quem precisa enviar o vídeo.</strong> Não serão aceitos vídeos de terceiros.
          </p>
        </div>
      )}

      {/* Resultado (apenas para desafios físicos) */}
      {!isAtosAmor && (
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
      )}

      {/* Instruções do Ato de Amor */}
      {isAtosAmor && challenge.action_instructions && (
        <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💝</span>
            <div>
              <p className="font-semibold text-rose-800 mb-1">O que fazer:</p>
              <p className="text-sm text-rose-700 whitespace-pre-line">
                {challenge.action_instructions}
              </p>
            </div>
          </div>
        </div>
      )}

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
        {/* Erro específico para Shorts */}
        {formData.proofUrl && isYouTubeShorts(formData.proofUrl) && (
          <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-xs text-red-700 font-medium">
              ❌ <strong>YouTube Shorts não é aceito!</strong> Envie um vídeo completo (não Shorts).
            </p>
          </div>
        )}
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Regras do vídeo:</strong>
          </p>
          <ul className="text-xs text-yellow-700 mt-1 space-y-0.5 list-disc list-inside">
            <li>🎤 <strong>DIGA SEU NOME E A DATA</strong> no início da gravação</li>
            <li>Deve ser <strong>PÚBLICO</strong> no YouTube</li>
            <li><strong>NÃO</strong> aceitamos YouTube Shorts (vídeo deve ser completo)</li>
            <li>Grave com <strong>BOA ILUMINAÇÃO</strong></li>
            <li>Instagram é <strong>OPCIONAL</strong></li>
          </ul>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Nossa IA vai assistir seu vídeo e validar se você bateu a meta!
        </p>
      </div>

      {/* Link do Instagram (apenas para Atos de Amor) */}
      {isAtosAmor && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link do post/reel no Instagram *
          </label>
          <Input
            type="url"
            value={formData.instagramUrl}
            onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
            placeholder="https://instagram.com/p/... ou /reel/..."
            required
          />
          <div className="mt-2 p-2 bg-pink-50 border border-pink-200 rounded-lg">
            <p className="text-xs text-pink-800">
              📸 <strong>Instagram:</strong> Compartilhe seu ato de amor no Instagram também!
              Poste ou faça um reel público mostrando sua participação.
            </p>
          </div>
        </div>
      )}

      {/* Checkbox de vídeo público */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isVideoPublic}
            onChange={(e) => setFormData({ ...formData, isVideoPublic: e.target.checked })}
            className="mt-1 w-5 h-5 text-green-600 rounded border-green-300 focus:ring-green-500"
          />
          <div>
            <span className="font-semibold text-green-800">
              ✅ Confirmo que meu vídeo é PÚBLICO
            </span>
            <p className="text-xs text-green-700 mt-1">
              Vídeos privados ou não listados não valem corações. O vídeo precisa estar visível para todos no YouTube.
            </p>
          </div>
        </label>
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
