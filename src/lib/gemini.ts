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
