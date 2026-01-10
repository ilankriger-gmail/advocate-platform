import OpenAI from 'openai';

// Cliente OpenAI inicializado lazily
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) {
    console.log('[AI] Usando cliente OpenAI existente');
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  console.log('[AI] Verificando OPENAI_API_KEY...');
  console.log('[AI] API Key presente:', !!apiKey);
  console.log('[AI] API Key prefixo:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');

  if (!apiKey) {
    console.error('[AI] ERRO: OpenAI API key NAO configurada!');
    console.error('[AI] Variaveis de ambiente disponiveis:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API')));
    return null;
  }

  console.log('[AI] Criando novo cliente OpenAI...');
  openaiClient = new OpenAI({ apiKey });
  console.log('[AI] Cliente OpenAI criado com sucesso');
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
  console.log('[AI] === Iniciando analise de lead ===');
  console.log('[AI] Lead:', { name: lead.name, score: lead.score, reasonLength: lead.reason?.length });

  const client = getOpenAIClient();

  if (!client) {
    console.error('[AI] ERRO: Cliente OpenAI nao disponivel - abortando analise');
    return null;
  }

  console.log('[AI] Cliente OpenAI obtido, preparando requisicao...');

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
    console.log('[AI] Enviando requisicao para OpenAI (modelo: gpt-4o-mini)...');
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
    console.log(`[AI] Resposta recebida em ${elapsed}ms`);
    console.log('[AI] Usage:', response.usage);

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error('[AI] ERRO: Resposta vazia da OpenAI');
      return null;
    }

    console.log('[AI] Conteudo da resposta:', content.substring(0, 200) + '...');

    const analysis = JSON.parse(content) as LeadAnalysis;
    console.log('[AI] Analise parseada:', { score: analysis.score, sentiment: analysis.sentiment, recommendation: analysis.recommendation });

    // Validacao basica do resultado
    if (
      typeof analysis.score !== 'number' ||
      analysis.score < 0 ||
      analysis.score > 100
    ) {
      console.error('[AI] ERRO: Score invalido:', analysis.score);
      return null;
    }

    if (!['positivo', 'neutro', 'negativo'].includes(analysis.sentiment)) {
      console.error('[AI] ERRO: Sentimento invalido:', analysis.sentiment);
      return null;
    }

    if (!['aprovar', 'analisar', 'rejeitar'].includes(analysis.recommendation)) {
      console.error('[AI] ERRO: Recomendacao invalida:', analysis.recommendation);
      return null;
    }

    console.log('[AI] === Analise concluida com sucesso ===');
    return analysis;
  } catch (error) {
    console.error('[AI] === ERRO NA ANALISE ===');
    console.error('[AI] Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[AI] Mensagem:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && 'status' in error) {
      console.error('[AI] Status HTTP:', (error as { status: number }).status);
    }
    if (error instanceof Error && 'code' in error) {
      console.error('[AI] Codigo do erro:', (error as { code: string }).code);
    }
    console.error('[AI] Erro completo:', error);
    return null;
  }
}
