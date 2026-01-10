/**
 * Tipos para o sistema de moderação de conteúdo
 */

// ============================================
// Análise de Imagem (Sightengine)
// ============================================

export interface ImageModerationFlags {
  nudity: number;      // 0-1: conteúdo sexual/nudez
  weapon: number;      // 0-1: armas de fogo, facas
  alcohol: number;     // 0-1: bebidas alcoólicas
  drugs: number;       // 0-1: drogas, parafernália
  gore: number;        // 0-1: violência gráfica, sangue
  offensive: number;   // 0-1: símbolos de ódio
}

export interface ImageAnalysisResult {
  safe: boolean;
  score: number; // 0-1 (maior = mais perigoso)
  flags: ImageModerationFlags;
  blocked_reasons: string[];
  raw_response?: unknown; // resposta original da API
}

// ============================================
// Análise de Toxicidade (Perspective API)
// ============================================

export interface ToxicityScores {
  toxicity: number;        // 0-1: toxicidade geral
  severe_toxicity: number; // 0-1: toxicidade grave
  insult: number;          // 0-1: insultos
  threat: number;          // 0-1: ameaças
  identity_attack: number; // 0-1: ataque a identidade
  profanity: number;       // 0-1: linguagem profana
}

export interface ToxicityAnalysisResult {
  safe: boolean;
  score: number; // 0-1 (maior = mais tóxico)
  scores: ToxicityScores;
  blocked_reasons: string[];
  raw_response?: unknown;
}

// ============================================
// Categoria de Conteúdo
// ============================================

export type ContentCategory = 'normal' | 'help_request';

// ============================================
// Engine de Decisão
// ============================================

export type ModerationDecision =
  | 'approved'       // conteúdo limpo, pode publicar
  | 'pending_review' // precisa revisão manual
  | 'blocked';       // bloqueado automaticamente

export interface ModerationResult {
  decision: ModerationDecision;
  overall_score: number; // 0-1 (score combinado)
  content_category: ContentCategory;
  image_result?: ImageAnalysisResult;
  toxicity_result?: ToxicityAnalysisResult;
  blocked_reasons: string[];
  review_reasons?: string[]; // motivos para revisão manual
  processing_time_ms: number;
}

// ============================================
// Configurações de Moderação
// ============================================

export interface ModerationConfig {
  enabled: boolean;
  image_block_threshold: number;  // default: 0.7
  text_block_threshold: number;   // default: 0.7
  review_threshold: number;       // default: 0.3
  sightengine_api_user?: string;
  sightengine_api_secret?: string;
  perspective_api_key?: string;
}

// ============================================
// Logs de Moderação
// ============================================

export interface ModerationLog {
  id: string;
  post_id: string;
  decision: ModerationDecision;
  score: number;
  flags: ImageModerationFlags & ToxicityScores;
  blocked_reasons: string[];
  content_category: ContentCategory;
  created_at: string;
}

// ============================================
// Input para Moderação
// ============================================

export interface ModerationInput {
  title: string;
  content: string;
  images?: string[]; // URLs das imagens
}
