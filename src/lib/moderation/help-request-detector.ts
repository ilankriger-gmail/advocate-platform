/**
 * Detector de Pedidos de Ajuda
 *
 * Identifica posts onde usuários pedem ajuda financeira, médica, ou de emergência.
 * Esses posts são direcionados para um feed separado "Pedidos de Ajuda".
 *
 * Não usa API externa - apenas análise de palavras-chave.
 */

export interface HelpRequestDetectionResult {
  isHelpRequest: boolean;
  confidence: number; // 0-1
  matchedPatterns: string[];
  categories: HelpCategory[];
}

export type HelpCategory =
  | 'urgent'      // Emergência, situação crítica
  | 'financial'   // Dinheiro, contas, desemprego
  | 'health'      // Tratamento, cirurgia, remédios
  | 'family'      // Filhos, família
  | 'donation'    // Vaquinha, arrecadação
  | 'pix';        // Dados bancários

// Padrões por categoria com pesos
interface PatternGroup {
  category: HelpCategory;
  patterns: string[];
  weight: number; // Multiplicador de importância
}

const HELP_PATTERNS: PatternGroup[] = [
  // PIX/Dados bancários - alta confiança automática
  {
    category: 'pix',
    weight: 3.0,
    patterns: [
      'chave pix',
      'meu pix',
      'pix:',
      'preciso de pix',
      'preciso de um pix',
      'me manda pix',
      'me manda um pix',
      'manda um pix',
      'me ajuda com pix',
      'ajuda via pix',
      'pix para ajudar',
      'cpf:',
      'banco:',
      'agência:',
      'agencia:',
      'conta:',
      'nubank',
      'picpay',
      'mercado pago',
    ],
  },
  // Urgência
  {
    category: 'urgent',
    weight: 1.5,
    patterns: [
      'preciso de ajuda',
      'me ajuda',
      'me ajude',
      'me ajudem',
      'alguem me ajuda',
      'alguém me ajuda',
      'ajuda urgente',
      'socorro',
      'emergência',
      'emergencia',
      'situação crítica',
      'situacao critica',
      'não sei mais o que fazer',
      'nao sei mais o que fazer',
      'ajuda agora',
      'por favor me ajudem',
      'por favor ajudem',
      'estou desesperado',
      'estou desesperada',
    ],
  },
  // Financeiro
  {
    category: 'financial',
    weight: 1.2,
    patterns: [
      'ajuda financeira',
      'preciso de dinheiro',
      'não tenho dinheiro',
      'nao tenho dinheiro',
      'desempregado',
      'desempregada',
      'sem emprego',
      'contas atrasadas',
      'pagar aluguel',
      'aluguel atrasado',
      'dificuldade financeira',
      'passando necessidade',
      'não tenho como pagar',
      'nao tenho como pagar',
      'luz cortada',
      'água cortada',
      'agua cortada',
      'despejo',
      'ser despejado',
    ],
  },
  // Saúde
  {
    category: 'health',
    weight: 1.3,
    patterns: [
      'ajuda para tratamento',
      'preciso de cirurgia',
      'tratamento caro',
      'remédios caros',
      'remedios caros',
      'ajuda médica',
      'ajuda medica',
      'hospital',
      'doença',
      'doenca',
      'câncer',
      'cancer',
      'quimioterapia',
      'transplante',
      'hemodiálise',
      'hemodialise',
    ],
  },
  // Família
  {
    category: 'family',
    weight: 1.4,
    patterns: [
      'ajuda para meus filhos',
      'alimentar meus filhos',
      'ajuda para criança',
      'ajuda para crianca',
      'ajuda para bebê',
      'ajuda para bebe',
      'meus filhos estão',
      'meus filhos estao',
      'filhos passando fome',
      'não tenho leite',
      'nao tenho leite',
      'fralda',
      'fraldas',
    ],
  },
  // Vaquinhas/Doações
  {
    category: 'donation',
    weight: 1.0,
    patterns: [
      'vaquinha',
      'vakinha',
      'arrecadação',
      'arrecadacao',
      'doação',
      'doacao',
      'contribuição',
      'contribuicao',
      'quem puder ajudar',
      'qualquer ajuda',
      'qualquer valor',
      'qualquer quantia',
      'apelo',
      'rifinha',
      'rifa solidária',
      'rifa solidaria',
    ],
  },
];

// Threshold de confiança para classificar como pedido de ajuda
const CONFIDENCE_THRESHOLD = 0.3;

/**
 * Detecta se um post é um pedido de ajuda
 */
export function detectHelpRequest(
  title: string,
  content: string
): HelpRequestDetectionResult {
  // Normalizar texto para comparação
  const normalizedText = normalizeText(`${title} ${content}`);

  const matchedPatterns: string[] = [];
  const matchedCategories = new Set<HelpCategory>();
  let totalScore = 0;

  // Verificar cada grupo de padrões
  for (const group of HELP_PATTERNS) {
    for (const pattern of group.patterns) {
      if (normalizedText.includes(normalizeText(pattern))) {
        matchedPatterns.push(pattern);
        matchedCategories.add(group.category);
        totalScore += group.weight;
      }
    }
  }

  // Calcular confiança (0-1)
  // 1 match = ~0.3, 2 matches = ~0.5, 3+ = ~0.7-1.0
  // PIX sozinho = alta confiança
  let confidence = 0;

  if (matchedPatterns.length > 0) {
    // Base: quantidade de matches
    confidence = Math.min(0.3 + (totalScore - 1) * 0.2, 1);

    // Bônus por múltiplas categorias
    if (matchedCategories.size >= 2) {
      confidence = Math.min(confidence + 0.15, 1);
    }
    if (matchedCategories.size >= 3) {
      confidence = Math.min(confidence + 0.1, 1);
    }

    // PIX sempre tem alta confiança
    if (matchedCategories.has('pix')) {
      confidence = Math.max(confidence, 0.8);
    }
  }

  const isHelpRequest = confidence >= CONFIDENCE_THRESHOLD;

  return {
    isHelpRequest,
    confidence,
    matchedPatterns,
    categories: Array.from(matchedCategories),
  };
}

/**
 * Normaliza texto para comparação case-insensitive
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determina a categoria de conteúdo baseado na detecção
 */
export function getContentCategory(
  detectionResult: HelpRequestDetectionResult
): 'normal' | 'help_request' {
  return detectionResult.isHelpRequest ? 'help_request' : 'normal';
}
