/**
 * Auto-responder do Moço do Te Amo
 * Usa GPT-4o mini para gerar respostas contextualizadas
 * Responde 67% dos comentários com ❤️‍🔥
 */

import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[AutoResponder] OPENAI_API_KEY não configurada');
    return null;
  }
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

const SYSTEM_PROMPT = `Você é o Moço do Te Amo, um criador de conteúdo brasileiro carismático, amoroso e motivador.
Você está respondendo comentários na sua comunidade "Arena Te Amo".

REGRAS:
1. Responda SEMPRE em português brasileiro informal e carinhoso
2. Use no MÁXIMO 2-3 frases curtas
3. SEMPRE inclua pelo menos um ❤️‍🔥 na resposta
4. Seja genuíno, empático e motivador
5. Se a pessoa fez uma pergunta, responda de forma útil mas breve
6. Se a pessoa está triste ou passando dificuldade, seja acolhedor
7. Se a pessoa fez um elogio, agradeça com carinho
8. Se a pessoa fez uma piada ou algo engraçado, ria junto (use kkkk)
9. NUNCA seja formal, robótico ou use linguagem corporativa
10. Finalize com algo como "Te amo!", "Tamo junto!", "❤️‍🔥" ou similar

EXEMPLOS DE RESPOSTAS:
- "Opa! Que comentário incrível ❤️‍🔥 Tamo junto sempre!"
- "Caramba, isso aí! ❤️‍🔥 Continue assim, te amo!"
- "Força! Você não tá sozinho ❤️‍🔥❤️‍🔥 Conte comigo!"
- "KKKK rachei! ❤️‍🔥 Você é demais!"`;

/**
 * Gera uma resposta usando GPT-4o mini
 */
export async function gerarRespostaIA(
  comentario: string,
  contextoPost?: string
): Promise<string> {
  const openai = getOpenAIClient();
  
  if (!openai) {
    // Fallback para resposta simples se OpenAI não configurada
    return gerarRespostaFallback(comentario);
  }

  try {
    const userMessage = contextoPost 
      ? `Post: "${contextoPost}"\n\nComentário para responder: "${comentario}"`
      : `Comentário para responder: "${comentario}"`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 150,
      temperature: 0.9, // Mais criativo
    });

    const resposta = response.choices[0]?.message?.content?.trim();
    
    if (!resposta) {
      return gerarRespostaFallback(comentario);
    }

    // Garantir que tem ❤️‍🔥 na resposta
    if (!resposta.includes('❤️‍🔥') && !resposta.includes('❤️')) {
      return resposta + ' ❤️‍🔥';
    }

    return resposta;
  } catch (error) {
    console.error('[AutoResponder] Erro ao gerar resposta com IA:', error);
    return gerarRespostaFallback(comentario);
  }
}

// Respostas de fallback caso a IA não funcione
const FALLBACK_RESPOSTAS = [
  'Opa! Amei isso ❤️‍🔥 Tamo junto!',
  'Que demais! ❤️‍🔥 Continue assim!',
  'Isso aí! ❤️‍🔥❤️‍🔥 Te amo!',
  'Show de bola! ❤️‍🔥 Valeu!',
  'Sensacional! ❤️‍🔥 Bora pra cima!',
  'Adorei! ❤️‍🔥 Tamo junto sempre!',
  'Você é demais! ❤️‍🔥',
  'Caramba! ❤️‍🔥 Muito bom!',
];

function gerarRespostaFallback(comentario: string): string {
  // Detectar contexto simples
  const lower = comentario.toLowerCase();
  
  if (lower.includes('?')) {
    return 'Boa pergunta! ❤️‍🔥 Vou pensar nisso!';
  }
  if (lower.includes('obrigad') || lower.includes('valeu')) {
    return 'Eu que agradeço! ❤️‍🔥 Te amo!';
  }
  if (lower.includes('triste') || lower.includes('difícil') || lower.includes('força')) {
    return 'Força! ❤️‍🔥 Tamo junto, você não tá sozinho!';
  }
  if (lower.includes('kk') || lower.includes('haha') || lower.includes('😂')) {
    return 'KKKK ❤️‍🔥 Adorei!';
  }
  
  return FALLBACK_RESPOSTAS[Math.floor(Math.random() * FALLBACK_RESPOSTAS.length)];
}

/**
 * Gera uma resposta (wrapper para compatibilidade)
 */
export function gerarResposta(comentario?: string): string {
  // Versão síncrona usa fallback
  return gerarRespostaFallback(comentario || '');
}

/**
 * Decide se deve responder (67% de chance)
 */
export function deveResponder(): boolean {
  return Math.random() < 0.67;
}

/**
 * Gera resposta se passar na probabilidade de 67%
 */
export function tentarGerarResposta(comentario?: string): string | null {
  if (!deveResponder()) return null;
  return gerarResposta(comentario);
}
