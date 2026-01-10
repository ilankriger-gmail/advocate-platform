/**
 * Classificação de conteúdo com Google Gemini
 * Detecta: pedidos de dinheiro, vaquinhas, doações
 *
 * Usa Gemini já integrado no projeto
 */

import type {
  ContentClassificationResult,
  ContentCategory,
  MoneyRequestSubcategory,
} from '@/types/moderation';

interface GeminiClassificationResponse {
  category: 'normal' | 'money_request';
  confidence: number;
  subcategory?: string;
  details?: string;
}

/**
 * Classifica o conteúdo usando Gemini
 * Detecta se é um pedido de dinheiro/doação
 */
export async function classifyContent(
  title: string,
  content: string
): Promise<ContentClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Se não configurado, retorna como normal
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    console.warn('[Moderation] Gemini não configurado - pulando classificação de conteúdo');
    return {
      category: 'normal',
      confidence: 1,
    };
  }

  // Texto muito curto provavelmente não é pedido de dinheiro
  const fullText = `${title}\n${stripHtmlTags(content)}`;
  if (fullText.trim().length < 20) {
    return {
      category: 'normal',
      confidence: 1,
    };
  }

  try {
    const prompt = buildClassificationPrompt(title, content);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1, // baixa temperatura para consistência
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('[Moderation] Gemini API error:', response.status);
      return { category: 'normal', confidence: 0.5 };
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseClassificationResponse(textResponse);
  } catch (error) {
    console.error('[Moderation] Erro ao classificar conteúdo:', error);
    return { category: 'normal', confidence: 0.5 };
  }
}

/**
 * Constrói o prompt de classificação
 */
function buildClassificationPrompt(title: string, content: string): string {
  const cleanContent = stripHtmlTags(content).substring(0, 2000);

  return `Você é um classificador de conteúdo para uma plataforma de comunidade brasileira.

Analise o seguinte post e determine se é um PEDIDO DE DINHEIRO ou DOAÇÃO.

TÍTULO: ${title}
CONTEÚDO: ${cleanContent}

CLASSIFIQUE como "money_request" se o post:
- Pede PIX, transferência ou dinheiro diretamente
- É uma vaquinha ou crowdfunding
- Pede doações para causas pessoais (tratamento médico, contas, etc.)
- Pede doações para instituições ou ONGs
- Oferece chave PIX ou dados bancários
- Usa frases como "me ajudem", "preciso de ajuda financeira", "qualquer valor ajuda"

CLASSIFIQUE como "normal" se:
- É um post comum de interação
- Vende produto/serviço legítimo (não é pedido de doação)
- Compartilha conteúdo sem pedir dinheiro
- É uma pergunta ou discussão normal

Responda APENAS com JSON no formato:
{
  "category": "normal" ou "money_request",
  "confidence": 0.0 a 1.0,
  "subcategory": "crowdfunding" | "personal" | "charity" | "pix_request" (apenas se money_request),
  "details": "breve explicação"
}

APENAS o JSON, sem texto adicional.`;
}

/**
 * Faz parse da resposta do Gemini
 */
function parseClassificationResponse(text: string): ContentClassificationResult {
  try {
    // Extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { category: 'normal', confidence: 0.5 };
    }

    const parsed: GeminiClassificationResponse = JSON.parse(jsonMatch[0]);

    // Validar categoria
    const category: ContentCategory =
      parsed.category === 'money_request' ? 'money_request' : 'normal';

    // Validar subcategoria
    const validSubcategories: MoneyRequestSubcategory[] = [
      'crowdfunding',
      'personal',
      'charity',
      'pix_request',
    ];
    const subcategory =
      category === 'money_request' && validSubcategories.includes(parsed.subcategory as MoneyRequestSubcategory)
        ? (parsed.subcategory as MoneyRequestSubcategory)
        : undefined;

    return {
      category,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      subcategory,
      details: parsed.details,
    };
  } catch {
    return { category: 'normal', confidence: 0.5 };
  }
}

/**
 * Remove tags HTML do texto
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se o texto contém indicadores óbvios de pedido de dinheiro
 * Usado como pré-filtro rápido antes de chamar a API
 */
export function hasMoneyRequestIndicators(text: string): boolean {
  const lowerText = text.toLowerCase();

  const strongIndicators = [
    'pix',
    'chave pix',
    'me ajude',
    'me ajudem',
    'ajuda financeira',
    'preciso de ajuda',
    'vaquinha',
    'vakinha',
    'crowdfunding',
    'doação',
    'doações',
    'doar',
    'qualquer valor ajuda',
    'qualquer quantia',
    'conta bancária',
    'transferência',
    'cpf:',
    'cnpj:',
    'banco:',
    'agência:',
  ];

  return strongIndicators.some(indicator => lowerText.includes(indicator));
}
