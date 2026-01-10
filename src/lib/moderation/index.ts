/**
 * Engine de Moderação de Conteúdo
 *
 * Combina análises de:
 * - Sightengine (imagens)
 * - Perspective API (toxicidade)
 * - Gemini (classificação de conteúdo)
 *
 * Retorna decisão unificada: approved | pending_review | blocked
 */

import { analyzeImages } from './image-analysis';
import { analyzeTextContent } from './toxicity-analysis';
import { classifyContent, hasMoneyRequestIndicators } from './content-classification';
import type {
  ModerationResult,
  ModerationDecision,
  ModerationInput,
  ModerationConfig,
} from '@/types/moderation';

// Configuração padrão
const DEFAULT_CONFIG: ModerationConfig = {
  enabled: true,
  image_block_threshold: 0.7,
  text_block_threshold: 0.7,
  review_threshold: 0.3,
};

/**
 * Modera um post completo (texto + imagens)
 * Retorna decisão e detalhes da análise
 */
export async function moderatePost(
  input: ModerationInput,
  config: Partial<ModerationConfig> = {}
): Promise<ModerationResult> {
  const startTime = Date.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Se moderação desativada, aprova tudo
  if (!mergedConfig.enabled) {
    return {
      decision: 'approved',
      overall_score: 0,
      content_category: 'normal',
      blocked_reasons: [],
      processing_time_ms: Date.now() - startTime,
    };
  }

  const blocked_reasons: string[] = [];
  const review_reasons: string[] = [];
  let maxScore = 0;

  // Executar análises em paralelo para performance
  const [imageResult, toxicityResult, classificationResult] = await Promise.all([
    // Análise de imagens (se houver)
    input.images && input.images.length > 0
      ? analyzeImages(input.images)
      : Promise.resolve(null),

    // Análise de toxicidade do texto
    analyzeTextContent(input.title, input.content),

    // Classificação de conteúdo (pedido de dinheiro)
    classifyContent(input.title, input.content),
  ]);

  // Processar resultado de imagens
  if (imageResult) {
    const imgScore = imageResult.combined.score;
    maxScore = Math.max(maxScore, imgScore);

    if (imgScore >= mergedConfig.image_block_threshold) {
      blocked_reasons.push(...imageResult.combined.blocked_reasons);
    } else if (imgScore >= mergedConfig.review_threshold) {
      review_reasons.push('Imagem requer revisão manual');
    }
  }

  // Processar resultado de toxicidade
  const toxScore = toxicityResult.score;
  maxScore = Math.max(maxScore, toxScore);

  if (toxScore >= mergedConfig.text_block_threshold) {
    blocked_reasons.push(...toxicityResult.blocked_reasons);
  } else if (toxScore >= mergedConfig.review_threshold) {
    review_reasons.push('Texto pode conter conteúdo inadequado');
  }

  // Determinar categoria do conteúdo
  const content_category = classificationResult.category;

  // Determinar decisão final
  let decision: ModerationDecision;

  if (blocked_reasons.length > 0) {
    decision = 'blocked';
  } else if (review_reasons.length > 0 || maxScore >= mergedConfig.review_threshold) {
    decision = 'pending_review';
  } else {
    decision = 'approved';
  }

  return {
    decision,
    overall_score: maxScore,
    content_category,
    image_result: imageResult?.combined,
    toxicity_result: toxicityResult,
    classification_result: classificationResult,
    blocked_reasons,
    review_reasons: review_reasons.length > 0 ? review_reasons : undefined,
    processing_time_ms: Date.now() - startTime,
  };
}

/**
 * Modera apenas texto (útil para comentários)
 */
export async function moderateText(
  text: string,
  config: Partial<ModerationConfig> = {}
): Promise<ModerationResult> {
  return moderatePost(
    { title: '', content: text },
    config
  );
}

/**
 * Modera apenas uma imagem
 */
export async function moderateImage(
  imageUrl: string,
  config: Partial<ModerationConfig> = {}
): Promise<ModerationResult> {
  return moderatePost(
    { title: '', content: '', images: [imageUrl] },
    config
  );
}

/**
 * Verifica rapidamente se texto tem indicadores de pedido de dinheiro
 * Usado para pré-filtro sem chamar APIs
 */
export function quickMoneyCheck(title: string, content: string): boolean {
  const fullText = `${title} ${content}`;
  return hasMoneyRequestIndicators(fullText);
}

/**
 * Gera mensagem de bloqueio amigável para o usuário
 */
export function getBlockedMessage(blocked_reasons: string[]): string {
  if (blocked_reasons.length === 0) {
    return 'Conteúdo bloqueado por violar nossas diretrizes.';
  }

  const reasonsText = blocked_reasons.join(', ').toLowerCase();
  return `Sua publicação foi bloqueada porque detectamos: ${reasonsText}. Por favor, revise o conteúdo e tente novamente.`;
}

/**
 * Gera mensagem para posts que precisam de revisão
 */
export function getPendingReviewMessage(): string {
  return 'Sua publicação foi enviada para revisão e será publicada após aprovação da moderação.';
}

// Re-exportar tipos úteis
export type { ModerationResult, ModerationDecision, ModerationInput, ModerationConfig };
