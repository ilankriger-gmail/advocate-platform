/**
 * Integracao com Google Gemini para verificação de vídeos de desafios
 *
 * Fluxo:
 * 1. Usuário envia link do vídeo
 * 2. Gemini analisa o conteudo
 * 3. Retorna veredito (válido/inválido + confianca + motivo)
 * 4. Admin ve o veredito e decide aprovar/rejeitar
 */

export interface AIVerdict {
  isValid: boolean;
  confidence: number; // 0-100
  reason: string;
  analyzedAt: string;
}

interface GeminiAnalysisResult {
  isValid: boolean;
  confidence: number;
  reason: string;
}

/**
 * Analisa um vídeo de desafio usando Gemini
 *
 * @param vídeoUrl URL do vídeo (YouTube, Instagram, TikTok)
 * @param challengeType Tipo do desafio (repetitions ou time)
 * @param goalValue Meta a ser atingida
 * @param challengeTitle Título do desafio para contexto
 */
export async function analyzeVídeoChallenge(
  vídeoUrl: string,
  challengeType: 'repetitions' | 'time' | null,
  goalValue: number | null,
  challengeTitle: string
): Promise<AIVerdict> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Se não tem API key, retorna verificação manual
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return {
      isValid: false,
      confidence: 0,
      reason: 'API Gemini nao configurada - verificação manual necessaria',
      analyzedAt: new Date().toISOString(),
    };
  }

  try {
    const prompt = buildAnalysisPrompt(vídeoUrl, challengeType, goalValue, challengeTitle);

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
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text());
      return {
        isValid: false,
        confidence: 0,
        reason: 'Erro ao conectar com API Gemini',
        analyzedAt: new Date().toISOString(),
      };
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const result = parseGeminiResponse(textResponse);

    return {
      ...result,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analyzing vídeo:', error);
    return {
      isValid: false,
      confidence: 0,
      reason: 'Erro ao analisar vídeo',
      analyzedAt: new Date().toISOString(),
    };
  }
}

function buildAnalysisPrompt(
  vídeoUrl: string,
  challengeType: 'repetitions' | 'time' | null,
  goalValue: number | null,
  challengeTitle: string
): string {
  const goalDescription = challengeType === 'time'
    ? `${goalValue} segundos`
    : `${goalValue} repeticoes`;

  return `Voce e um verificador de desafios fisicos. Analise a URL do vídeo abaixo e determine se o participante completou o desafio de forma legitima.

DESAFIO: ${challengeTitle}
META: ${goalValue ? goalDescription : 'Nao especificada'}
URL DO VIDEO: ${vídeoUrl}

Avalie os seguintes criterios:
1. O vídeo parece ser de uma plataforma legitima (YouTube, Instagram, TikTok)?
2. A URL parece valida e acessivel?
3. O formato da URL corresponde a um vídeo de exercicio/desafio?

IMPORTANTE: Voce NAO pode assistir ao vídeo diretamente, entao faca uma analise baseada na URL.
- URLs de Instagram (instagram.com/reel/, instagram.com/p/) sao validas
- URLs de YouTube (youtube.com/watch, youtu.be/) sao validas
- URLs de TikTok (tiktok.com/@, vm.tiktok.com/) sao validas

Responda EXATAMENTE neste formato JSON:
{
  "isValid": true/false,
  "confidence": 0-100,
  "reason": "Explicacao breve do veredito"
}

Se a URL parece valida e de uma plataforma conhecida, dê isValid: true com confianca baseada na qualidade da URL.
Se a URL parece suspeita ou invalida, dê isValid: false.

APENAS o JSON, sem texto adicional.`;
}

function parseGeminiResponse(text: string): GeminiAnalysisResult {
  try {
    // Limpar o texto para extrair JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'Resposta da IA não foi possível interpretar',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      isValid: Boolean(parsed.isValid),
      confidence: Math.min(100, Math.max(0, parseInt(parsed.confidence) || 0)),
      reason: String(parsed.reason || 'Sem detalhes'),
    };
  } catch {
    return {
      isValid: false,
      confidence: 0,
      reason: 'Erro ao processar resposta da IA',
    };
  }
}

/**
 * Verifica se uma URL e de uma plataforma de vídeo valida
 */
export function isValidVídeoUrl(url: string): boolean {
  const patterns = [
    /instagram\.com\/(p|reel|reels|tv)\//,
    /youtube\.com\/watch/,
    /youtu\.be\//,
    /tiktok\.com\/@/,
    /vm\.tiktok\.com\//,
    /facebook\.com\/.*\/vídeos/,
    /fb\.watch\//,
  ];

  return patterns.some(pattern => pattern.test(url));
}

/**
 * Extrai o tipo de plataforma da URL
 */
export function getVídeoPlatform(url: string): string | null {
  if (/instagram\.com/.test(url)) return 'Instagram';
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
  if (/tiktok\.com/.test(url)) return 'TikTok';
  if (/facebook\.com|fb\.watch/.test(url)) return 'Facebook';
  return null;
}

/**
 * Interface para dados do desafio para geração de descrição
 */
export interface ChallengeDescriptionInput {
  title: string;
  idea: string; // O que a pessoa precisa gravar/publicar
  type: 'fisico' | 'engajamento' | 'participe';
  icon?: string;
  coinsReward?: number;
  goalType?: 'repetitions' | 'time' | null;
  goalValue?: number | null;
  hashtag?: string;
  profileToTag?: string;
  prizeAmount?: number | null;
  numWinners?: number | null;
}

/**
 * Gera uma descrição de desafio usando Gemini AI
 */
export async function generateChallengeDescription(
  input: ChallengeDescriptionInput
): Promise<{ success: boolean; description?: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return {
      success: false,
      error: 'API Gemini não configurada',
    };
  }

  try {
    const prompt = buildDescriptionPrompt(input);

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
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return {
        success: false,
        error: 'Erro ao conectar com API Gemini',
      };
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

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
    console.error('Error generating description:', error);
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

  return `Você é um copywriter especializado em criar descrições motivacionais e engajantes para desafios de uma plataforma de advocate marketing fitness.

DADOS DO DESAFIO:
- Título: ${input.title}
- Tipo: ${typeLabels[input.type]}
- Ícone: ${input.icon || '💪'}
- Ideia/O que fazer: ${input.idea}${contextDetails}

INSTRUÇÕES:
1. Crie uma descrição CURTA e DIRETA (máximo 3-4 frases)
2. Use linguagem motivacional e energética
3. Seja claro sobre o que a pessoa precisa fazer
4. Inclua um CTA (call-to-action) no final
5. Use emojis com moderação (1-2 no máximo)
6. O tom deve ser amigável e encorajador
7. NÃO use hashtags na descrição (elas serão adicionadas separadamente)
8. NÃO mencione valores de prêmios em dinheiro diretamente

EXEMPLOS DE BOM TOM:
- "Mostre sua força! Faça X e compartilhe com a comunidade. Vamos ver do que você é capaz! 💪"
- "Hora de brilhar! Complete o desafio e conquiste seus pontos. Estamos torcendo por você!"

Escreva APENAS a descrição, sem explicações adicionais:`;
}
