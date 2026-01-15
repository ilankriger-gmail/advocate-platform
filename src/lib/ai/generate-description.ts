import OpenAI from 'openai';

// Cliente OpenAI inicializado lazily (compartilhado com analyze-lead.ts)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[AI] OPENAI_API_KEY não configurada');
    return null;
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/**
 * Interface para dados do desafio para geração de descrição
 */
export interface ChallengeDescriptionInput {
  title: string;
  type: 'fisico' | 'engajamento' | 'participe' | 'atos_amor';
  icon?: string;
  coinsReward?: number;
  goalType?: 'repetitions' | 'time' | null;
  goalValue?: number | null;
  hashtag?: string;
  profileToTag?: string;
  prizeAmount?: number | null;
  numWinners?: number | null;
  actionInstructions?: string;
}

/**
 * Gera uma descrição de desafio usando OpenAI GPT-4o mini
 */
export async function generateChallengeDescription(
  input: ChallengeDescriptionInput
): Promise<{ success: boolean; description?: string; error?: string }> {
  const client = getOpenAIClient();

  if (!client) {
    return {
      success: false,
      error: 'API OpenAI não configurada',
    };
  }

  try {
    const prompt = buildDescriptionPrompt(input);

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Você é um copywriter especializado em criar descrições motivacionais e engajantes para desafios de uma plataforma de advocate marketing fitness. Responda apenas com a descrição, sem explicações.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const textResponse = response.choices[0]?.message?.content;

    if (!textResponse) {
      return {
        success: false,
        error: 'Resposta vazia da IA',
      };
    }

    return {
      success: true,
      description: textResponse.trim(),
    };
  } catch (error) {
    console.error('[AI] Erro ao gerar descrição:', error);
    return {
      success: false,
      error: 'Erro ao gerar descrição',
    };
  }
}

function buildDescriptionPrompt(input: ChallengeDescriptionInput): string {
  const typeLabels = {
    fisico: 'Desafio Físico',
    engajamento: 'Desafio de Engajamento',
    participe: 'Desafio Participe (Sorteio)',
    atos_amor: 'Atos de Amor',
  };

  let contextDetails = '';

  if (input.type === 'fisico') {
    if (input.goalType === 'repetitions' && input.goalValue) {
      contextDetails += `\n- Meta: ${input.goalValue} repetições`;
    } else if (input.goalType === 'time' && input.goalValue) {
      contextDetails += `\n- Meta: ${input.goalValue} segundos`;
    }
    if (input.hashtag) {
      contextDetails += `\n- Hashtag oficial: ${input.hashtag}`;
    }
    if (input.profileToTag) {
      contextDetails += `\n- Perfil para marcar: ${input.profileToTag}`;
    }
  }

  if ((input.type === 'engajamento' || input.type === 'participe') && input.prizeAmount) {
    contextDetails += `\n- Prêmio: R$ ${input.prizeAmount.toFixed(2)}`;
    if (input.numWinners) {
      contextDetails += ` (${input.numWinners} ganhador${input.numWinners > 1 ? 'es' : ''})`;
    }
  }

  if (input.coinsReward) {
    contextDetails += `\n- Recompensa em corações: ${input.coinsReward}`;
  }

  // Instruções específicas por tipo de desafio
  if (input.type === 'fisico') {
    return `Crie uma descrição para este desafio físico:

DADOS:
Título: ${input.title}
Tipo: ${typeLabels[input.type]}${contextDetails}

ESTRUTURA (use quebras de linha entre cada seção):

Parágrafo 1: Duas frases motivacionais sobre o desafio.

Parágrafo 2: Como participar (gravar vídeo com boa iluminação, postar no YouTube).

Parágrafo 3: Passo a passo numerado:
1. Realize o exercício
2. Grave um vídeo com BOA ILUMINAÇÃO (ambiente bem iluminado)
3. Publique o vídeo COMPLETO no YouTube (NÃO aceitamos Shorts!)
4. O vídeo deve estar como PÚBLICO no YouTube
5. Postar no Instagram é OPCIONAL (pode editar como quiser)${input.hashtag ? `\n6. Use a hashtag ${input.hashtag}` : ''}${input.profileToTag ? `\n${input.hashtag ? '7' : '6'}. Marque ${input.profileToTag}` : ''}
${input.hashtag && input.profileToTag ? '8' : input.hashtag || input.profileToTag ? '7' : '6'}. Envie o link do YouTube aqui na plataforma

Parágrafo 4: Aviso de segurança começando com "IMPORTANTE:" sobre consultar profissional de saúde, respeitar limites, e que a plataforma não se responsabiliza por lesões.

REGRAS OBRIGATÓRIAS:
- PROIBIDO usar emojis (nenhum emoji!)
- PROIBIDO usar formatação markdown (nada de ** ou * ou #)
- PROIBIDO usar traços ou bullets
- Use apenas texto simples com quebras de linha
- Tom profissional e motivador`;
  }

  // Instruções para engajamento/participe (desafios de comentário em vídeos)
  return `Crie uma descrição para este desafio de engajamento:

DADOS DO DESAFIO:
- Título: ${input.title}
- Tipo: ${typeLabels[input.type]}
- Ícone: ${input.icon || '💬'}${contextDetails}

ESTRUTURA OBRIGATÓRIA (use quebras de linha entre cada seção):

Parágrafo 1: Uma frase motivacional convidando a participar.

Parágrafo 2: COMO PARTICIPAR:
- Clique no link do desafio para acessar a publicação
- Assista o vídeo completo
- Deixe um comentário criativo que tenha a ver com o tema do vídeo
- Capriche! Comentários genéricos têm menos chances

Parágrafo 3: REGRAS:
- Apenas 1 comentário por pessoa vale para o sorteio
- Comentários duplicados serão desconsiderados

Parágrafo 4: IMPORTANTE (Segurança):
- Os ganhadores serão contatados APENAS por DM da conta verificada @nextleveldj1 (mais de 8.1 milhões de seguidores)
- Nenhuma outra conta entrará em contato com você
- NUNCA pedimos pagamento, pix, dados bancários ou qualquer valor

REGRAS DE FORMATAÇÃO:
- Use emojis com moderação (máximo 2-3)
- Tom amigável e encorajador
- NÃO use formatação markdown (nada de ** ou *)
- NÃO mencione valores de prêmios em dinheiro
- Mantenha o aviso de segurança SEMPRE no final`;
}
