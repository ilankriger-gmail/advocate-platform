/**
 * Análise de toxicidade com Google Perspective API
 * Detecta: toxicidade, insultos, ameaças, ataques de identidade
 *
 * GRATUITA: 1M requisições/dia
 * Docs: https://perspectiveapi.com
 */

import type { ToxicityAnalysisResult, ToxicityScores } from '@/types/moderation';

// Labels para os tipos de toxicidade detectada
const TOXICITY_LABELS: Record<keyof ToxicityScores, string> = {
  toxicity: 'Conteúdo tóxico',
  severe_toxicity: 'Conteúdo extremamente tóxico',
  insult: 'Insultos ou ofensas',
  threat: 'Ameaças de violência',
  identity_attack: 'Ataque a grupos ou identidades',
  profanity: 'Linguagem profana ou palavrões',
};

// Thresholds padrão para cada categoria
const DEFAULT_THRESHOLDS: Record<keyof ToxicityScores, number> = {
  toxicity: 0.7,
  severe_toxicity: 0.5,
  insult: 0.7,
  threat: 0.5, // mais rigoroso com ameaças
  identity_attack: 0.6,
  profanity: 0.9, // mais tolerante com palavrões leves
};

interface PerspectiveRequest {
  comment: {
    text: string;
  };
  languages: string[];
  requestedAttributes: Record<string, Record<string, never>>;
}

interface PerspectiveResponse {
  attributeScores?: {
    TOXICITY?: { summaryScore: { value: number } };
    SEVERE_TOXICITY?: { summaryScore: { value: number } };
    INSULT?: { summaryScore: { value: number } };
    THREAT?: { summaryScore: { value: number } };
    IDENTITY_ATTACK?: { summaryScore: { value: number } };
    PROFANITY?: { summaryScore: { value: number } };
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Analisa texto usando Google Perspective API
 */
export async function analyzeToxicity(
  text: string,
  thresholds: Partial<Record<keyof ToxicityScores, number>> = {}
): Promise<ToxicityAnalysisResult> {
  const apiKey = process.env.PERSPECTIVE_API_KEY;

  // Se não configurado, envia para revisão manual (não aprova automaticamente)
  if (!apiKey) {
    console.warn('[Moderation] Perspective API não configurada - enviando para revisão manual');
    return {
      safe: false,
      score: 0.35, // Acima do review_threshold (0.3) para forçar revisão
      scores: {
        toxicity: 0,
        severe_toxicity: 0,
        insult: 0,
        threat: 0,
        identity_attack: 0,
        profanity: 0,
      },
      blocked_reasons: [],
      skipped: true,
      skip_reason: 'Perspective API não configurada',
    };
  }

  // Texto muito curto não precisa de análise
  if (!text || text.trim().length < 3) {
    return {
      safe: true,
      score: 0,
      scores: {
        toxicity: 0,
        severe_toxicity: 0,
        insult: 0,
        threat: 0,
        identity_attack: 0,
        profanity: 0,
      },
      blocked_reasons: [],
    };
  }

  try {
    const requestBody: PerspectiveRequest = {
      comment: {
        text: stripHtmlTags(text).substring(0, 3000), // limite de 3000 chars
      },
      languages: ['pt'], // português
      requestedAttributes: {
        TOXICITY: {},
        SEVERE_TOXICITY: {},
        INSULT: {},
        THREAT: {},
        IDENTITY_ATTACK: {},
        PROFANITY: {},
      },
    };

    const response = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perspective API error: ${response.status} - ${errorText}`);
    }

    const data: PerspectiveResponse = await response.json();

    if (data.error) {
      throw new Error(`Perspective error: ${data.error.message}`);
    }

    // Extrair scores
    const scores: ToxicityScores = {
      toxicity: data.attributeScores?.TOXICITY?.summaryScore?.value ?? 0,
      severe_toxicity: data.attributeScores?.SEVERE_TOXICITY?.summaryScore?.value ?? 0,
      insult: data.attributeScores?.INSULT?.summaryScore?.value ?? 0,
      threat: data.attributeScores?.THREAT?.summaryScore?.value ?? 0,
      identity_attack: data.attributeScores?.IDENTITY_ATTACK?.summaryScore?.value ?? 0,
      profanity: data.attributeScores?.PROFANITY?.summaryScore?.value ?? 0,
    };

    // Aplicar thresholds e identificar bloqueios
    const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    const blocked_reasons: string[] = [];

    for (const [key, value] of Object.entries(scores)) {
      const threshold = mergedThresholds[key as keyof ToxicityScores];
      if (value >= threshold) {
        blocked_reasons.push(TOXICITY_LABELS[key as keyof ToxicityScores]);
      }
    }

    // Score geral (maior score entre todas as categorias)
    const score = Math.max(...Object.values(scores));
    const safe = blocked_reasons.length === 0;

    return {
      safe,
      score,
      scores,
      blocked_reasons,
      raw_response: data,
    };
  } catch (error) {
    console.error('[Moderation] Erro ao analisar toxicidade:', error);

    // Em caso de erro, envia para revisão manual (não aprova automaticamente)
    return {
      safe: false,
      score: 0.35, // Acima do review_threshold (0.3) para forçar revisão
      scores: {
        toxicity: 0,
        severe_toxicity: 0,
        insult: 0,
        threat: 0,
        identity_attack: 0,
        profanity: 0,
      },
      blocked_reasons: [],
      skipped: true,
      skip_reason: `Erro na API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Remove tags HTML do texto para análise limpa
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ') // remove tags
    .replace(/&nbsp;/g, ' ')  // remove nbsp
    .replace(/&amp;/g, '&')   // decode &
    .replace(/&lt;/g, '<')    // decode <
    .replace(/&gt;/g, '>')    // decode >
    .replace(/&quot;/g, '"')  // decode "
    .replace(/\s+/g, ' ')     // normaliza espaços
    .trim();
}

/**
 * Combina título e conteúdo para análise completa
 */
export async function analyzeTextContent(
  title: string,
  content: string,
  thresholds?: Partial<Record<keyof ToxicityScores, number>>
): Promise<ToxicityAnalysisResult> {
  // Combina título e conteúdo com separador
  const fullText = `${title}\n\n${content}`;
  return analyzeToxicity(fullText, thresholds);
}
