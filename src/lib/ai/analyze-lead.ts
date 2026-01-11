import OpenAI from 'openai';
import { logger, sanitizeError } from '@/lib';

// Logger contextualizado para o módulo de AI
const aiLogger = logger.withContext('[AI]');

// Cliente OpenAI inicializado lazily
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) {
    aiLogger.debug('Usando cliente OpenAI existente');
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // CRÍTICO: Nunca logar API keys ou prefixos!
  // Apenas verificar se está presente
  if (!apiKey) {
    aiLogger.error('OpenAI API key não configurada');
    return null;
  }

  aiLogger.debug('Criando novo cliente OpenAI');
  openaiClient = new OpenAI({ apiKey });
  aiLogger.debug('Cliente OpenAI criado com sucesso');
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
  aiLogger.debug('Iniciando análise de lead', {
    score: lead.score,
    reasonLength: lead.reason?.length,
    // Não logar nome do lead (PII)
  });

  const client = getOpenAIClient();

  if (!client) {
    aiLogger.error('Cliente OpenAI não disponível - abortando análise');
    return null;
  }

  aiLogger.debug('Cliente OpenAI obtido, preparando requisição');

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
    aiLogger.debug('Enviando requisição para OpenAI', { model: 'gpt-4o-mini' });
    const startTime = Date.now();

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

    const elapsed = Date.now() - startTime;
    aiLogger.debug('Resposta recebida', {
      elapsed: `${elapsed}ms`,
      usage: response.usage,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      aiLogger.error('Resposta vazia da OpenAI');
      return null;
    }

    aiLogger.debug('Resposta da OpenAI recebida', {
      contentLength: content.length,
    });

    const analysis = JSON.parse(content) as LeadAnalysis;
    aiLogger.debug('Análise parseada com sucesso', {
      score: analysis.score,
      sentiment: analysis.sentiment,
      recommendation: analysis.recommendation,
    });

    // Validacao basica do resultado
    if (
      typeof analysis.score !== 'number' ||
      analysis.score < 0 ||
      analysis.score > 100
    ) {
      aiLogger.error('Score inválido retornado pela AI', { score: analysis.score });
      return null;
    }

    if (!['positivo', 'neutro', 'negativo'].includes(analysis.sentiment)) {
      aiLogger.error('Sentimento inválido retornado pela AI', {
        sentiment: analysis.sentiment,
      });
      return null;
    }

    if (!['aprovar', 'analisar', 'rejeitar'].includes(analysis.recommendation)) {
      aiLogger.error('Recomendação inválida retornada pela AI', {
        recommendation: analysis.recommendation,
      });
      return null;
    }

    aiLogger.debug('Análise concluída com sucesso');
    return analysis;
  } catch (error) {
    // Sanitizar erro para não expor stack traces ou detalhes internos em produção
    const sanitized = sanitizeError(error);
    aiLogger.error('Erro na análise de lead', { error: sanitized });
    return null;
  }
}
