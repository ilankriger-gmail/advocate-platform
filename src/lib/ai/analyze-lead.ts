import OpenAI from 'openai';

// Cliente OpenAI inicializado lazily
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[AI] OpenAI API key not configured');
    return null;
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/**
 * Resultado da analise de sentimento do lead
 */
export interface LeadAnalysis {
  score: number; // 0-100: probabilidade de ser bom membro
  sentiment: 'positivo' | 'neutro' | 'negativo';
  recommendation: 'aprovar' | 'analisar' | 'rejeitar';
  summary: string; // resumo em 1-2 frases
  strengths: string[]; // pontos fortes
  concerns: string[]; // preocupacoes
}

/**
 * Dados do lead para analise
 */
export interface LeadForAnalysis {
  name: string;
  score: number; // NPS score 0-10
  reason: string; // texto explicando a nota
}

/**
 * Analisa um lead NPS usando OpenAI GPT-4 para determinar
 * se a pessoa seria um bom membro da comunidade
 */
export async function analyzeLeadWithAI(
  lead: LeadForAnalysis
): Promise<LeadAnalysis | null> {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  const prompt = `Voce e um analista de comunidade especializado em avaliar potenciais membros.
Analise este lead que respondeu uma pesquisa NPS para determinar se seria um bom membro
da comunidade de fas de um artista/criador de conteudo.

Lead:
- Nome: ${lead.name}
- Nota NPS: ${lead.score}/10
- Motivo/Feedback: "${lead.reason}"

Avalie considerando:
1. Tom da mensagem (positivo, construtivo, neutro, negativo, agressivo)
2. Nivel de engajamento demonstrado na resposta
3. Qualidade do feedback (detalhado e genuino vs generico ou superficial)
4. Alinhamento com valores de uma comunidade saudavel
5. Sinais de que seria um membro ativo e contributivo

IMPORTANTE:
- Score alto (9-10) com feedback positivo e detalhado = alta probabilidade de bom membro
- Score baixo (0-6) pode ser bom membro se o feedback for construtivo e nao agressivo
- Feedback generico ou muito curto sugere menor engajamento
- Tom agressivo, reclamacoes excessivas ou negatividade toxica = preocupacao

Retorne APENAS um JSON válido (sem markdown, sem explicacoes) no formato:
{
  "score": <número de 0 a 100 indicando probabilidade de ser bom membro>,
  "sentiment": "<positivo|neutro|negativo>",
  "recommendation": "<aprovar|analisar|rejeitar>",
  "summary": "<resumo da analise em 1-2 frases curtas>",
  "strengths": ["<ponto forte 1>", "<ponto forte 2>"],
  "concerns": ["<preocupacao 1>"]
}

Se nao houver preocupacoes, retorne concerns como array vazio [].
Se nao houver pontos fortes claros, retorne pelo menos um item generico.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Voce e um assistente que analisa leads e retorna apenas JSON válido, sem formatacao markdown.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // mais deterministico
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error('[AI] Empty response from OpenAI');
      return null;
    }

    const analysis = JSON.parse(content) as LeadAnalysis;

    // Validacao basica do resultado
    if (
      typeof analysis.score !== 'number' ||
      analysis.score < 0 ||
      analysis.score > 100
    ) {
      console.error('[AI] Invalid score in response:', analysis.score);
      return null;
    }

    if (!['positivo', 'neutro', 'negativo'].includes(analysis.sentiment)) {
      console.error('[AI] Invalid sentiment:', analysis.sentiment);
      return null;
    }

    if (!['aprovar', 'analisar', 'rejeitar'].includes(analysis.recommendation)) {
      console.error('[AI] Invalid recommendation:', analysis.recommendation);
      return null;
    }

    return analysis;
  } catch (error) {
    console.error('[AI] Error analyzing lead:', error);
    return null;
  }
}
