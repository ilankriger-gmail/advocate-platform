/**
 * Análise de imagens com Sightengine API
 * Detecta: nudez, armas, drogas, violência, símbolos de ódio
 *
 * Docs: https://sightengine.com/docs
 */

import type { ImageAnalysisResult, ImageModerationFlags } from '@/types/moderation';

// Labels para os tipos de conteúdo detectado
const FLAG_LABELS: Record<keyof ImageModerationFlags, string> = {
  nudity: 'Conteúdo sexual ou nudez',
  weapon: 'Armas de fogo ou brancas',
  alcohol: 'Bebidas alcoólicas',
  drugs: 'Drogas ou substâncias ilícitas',
  gore: 'Violência gráfica ou sangue',
  offensive: 'Símbolos de ódio ou extremismo',
};

// Thresholds padrão para cada categoria
const DEFAULT_THRESHOLDS: Record<keyof ImageModerationFlags, number> = {
  nudity: 0.5,
  weapon: 0.7,
  alcohol: 0.9, // mais tolerante para álcool
  drugs: 0.6,
  gore: 0.5,
  offensive: 0.5,
};

interface SightengineResponse {
  status: string;
  request: {
    id: string;
  };
  nudity?: {
    sexual_activity: number;
    sexual_display: number;
    erotica: number;
    very_suggestive: number;
    suggestive: number;
    mildly_suggestive: number;
    none: number;
  };
  weapon?: number;
  alcohol?: number;
  drugs?: number;
  gore?: {
    prob: number;
  };
  offensive?: {
    prob: number;
    nazi: number;
    confederate: number;
    supremacist: number;
    terrorist: number;
    middle_finger: number;
  };
  error?: {
    type: string;
    message: string;
  };
}

/**
 * Analisa uma imagem usando Sightengine API
 */
export async function analyzeImage(
  imageUrl: string,
  thresholds: Partial<Record<keyof ImageModerationFlags, number>> = {}
): Promise<ImageAnalysisResult> {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  // Se não configurado, envia para revisão manual (não aprova automaticamente)
  if (!apiUser || !apiSecret) {
    console.warn('[Moderation] Sightengine não configurado - enviando para revisão manual');
    return {
      safe: false,
      score: 0.35, // Acima do review_threshold (0.3) para forçar revisão
      flags: {
        nudity: 0,
        weapon: 0,
        alcohol: 0,
        drugs: 0,
        gore: 0,
        offensive: 0,
      },
      blocked_reasons: [],
      skipped: true,
      skip_reason: 'Sightengine API não configurada',
    };
  }

  try {
    // Modelos a serem usados na análise
    const models = 'nudity-2.1,weapon,alcohol,recreational_drug,gore-2.0,offensive-2.0';

    const params = new URLSearchParams({
      url: imageUrl,
      models,
      api_user: apiUser,
      api_secret: apiSecret,
    });

    const response = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Sightengine API error: ${response.status}`);
    }

    const data: SightengineResponse = await response.json();

    if (data.error) {
      throw new Error(`Sightengine error: ${data.error.message}`);
    }

    // Extrair scores normalizados
    const flags: ImageModerationFlags = {
      nudity: extractNudityScore(data.nudity),
      weapon: data.weapon ?? 0,
      alcohol: data.alcohol ?? 0,
      drugs: data.drugs ?? 0,
      gore: data.gore?.prob ?? 0,
      offensive: extractOffensiveScore(data.offensive),
    };

    // Aplicar thresholds e identificar bloqueios
    const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    const blocked_reasons: string[] = [];

    for (const [key, value] of Object.entries(flags)) {
      const threshold = mergedThresholds[key as keyof ImageModerationFlags];
      if (value >= threshold) {
        blocked_reasons.push(FLAG_LABELS[key as keyof ImageModerationFlags]);
      }
    }

    // Score geral (maior score entre todas as categorias)
    const score = Math.max(...Object.values(flags));
    const safe = blocked_reasons.length === 0;

    return {
      safe,
      score,
      flags,
      blocked_reasons,
      raw_response: data,
    };
  } catch (error) {
    console.error('[Moderation] Erro ao analisar imagem:', error);

    // Em caso de erro, envia para revisão manual (não aprova automaticamente)
    return {
      safe: false,
      score: 0.35, // Acima do review_threshold (0.3) para forçar revisão
      flags: {
        nudity: 0,
        weapon: 0,
        alcohol: 0,
        drugs: 0,
        gore: 0,
        offensive: 0,
      },
      blocked_reasons: [],
      skipped: true,
      skip_reason: `Erro na API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Extrai score de nudez (usa o maior valor entre as categorias problemáticas)
 */
function extractNudityScore(nudity?: SightengineResponse['nudity']): number {
  if (!nudity) return 0;

  // Categorias que indicam conteúdo impróprio
  return Math.max(
    nudity.sexual_activity,
    nudity.sexual_display,
    nudity.erotica,
    nudity.very_suggestive * 0.7, // peso menor para sugestivo
  );
}

/**
 * Extrai score de conteúdo ofensivo (símbolos de ódio)
 */
function extractOffensiveScore(offensive?: SightengineResponse['offensive']): number {
  if (!offensive) return 0;

  // Usa o maior score entre todas as categorias ofensivas
  return Math.max(
    offensive.prob,
    offensive.nazi,
    offensive.confederate,
    offensive.supremacist,
    offensive.terrorist,
    offensive.middle_finger * 0.5, // dedo do meio tem peso menor
  );
}

/**
 * Analisa múltiplas imagens em paralelo
 */
export async function analyzeImages(
  imageUrls: string[],
  thresholds?: Partial<Record<keyof ImageModerationFlags, number>>
): Promise<{
  results: ImageAnalysisResult[];
  combined: ImageAnalysisResult;
}> {
  // Analisar todas as imagens em paralelo
  const results = await Promise.all(
    imageUrls.map(url => analyzeImage(url, thresholds))
  );

  // Combinar resultados (usar o pior score de cada categoria)
  const combinedFlags: ImageModerationFlags = {
    nudity: Math.max(...results.map(r => r.flags.nudity)),
    weapon: Math.max(...results.map(r => r.flags.weapon)),
    alcohol: Math.max(...results.map(r => r.flags.alcohol)),
    drugs: Math.max(...results.map(r => r.flags.drugs)),
    gore: Math.max(...results.map(r => r.flags.gore)),
    offensive: Math.max(...results.map(r => r.flags.offensive)),
  };

  const allBlockedReasons = Array.from(new Set(results.flatMap(r => r.blocked_reasons)));

  // Verificar se alguma análise foi pulada
  const anySkipped = results.some(r => r.skipped);
  const skipReasons = results.filter(r => r.skip_reason).map(r => r.skip_reason);

  const combined: ImageAnalysisResult = {
    safe: allBlockedReasons.length === 0 && !anySkipped,
    score: Math.max(...results.map(r => r.score)),
    flags: combinedFlags,
    blocked_reasons: allBlockedReasons,
    skipped: anySkipped,
    skip_reason: skipReasons.length > 0 ? skipReasons[0] : undefined,
  };

  return { results, combined };
}
