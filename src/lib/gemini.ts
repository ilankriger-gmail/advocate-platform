/**
 * Integracao com Google Gemini para verificação de vídeos de desafios
 *
 * NOVO: Gemini agora ASSISTE o vídeo do YouTube de verdade!
 * - Conta repetições
 * - Mede tempo
 * - Valida se a meta foi batida
 *
 * Requisitos:
 * - Vídeo deve ser PÚBLICO no YouTube (não funciona com unlisted/privado)
 * - Máximo 8h de vídeo/dia no plano gratuito
 */

// SEGURANCA: Timeout para evitar requisicoes pendentes indefinidamente
const GEMINI_TIMEOUT_MS = 60000; // 60 segundos (análise de vídeo pode demorar)

export interface AIVerdict {
  isValid: boolean;
  confidence: number; // 0-100
  reason: string;
  analyzedAt: string;
  observedValue?: number; // Repetições contadas ou segundos medidos
}

interface GeminiAnalysisResult {
  isValid: boolean;
  confidence: number;
  reason: string;
  observedValue?: number;
}

/**
 * Extrai o ID do vídeo do YouTube de várias formas de URL
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Analisa um vídeo de desafio usando Gemini
 * ASSISTE o vídeo do YouTube de verdade e valida se a meta foi batida
 *
 * @param videoUrl URL do vídeo do YouTube (deve ser público)
 * @param challengeType Tipo do desafio (repetitions ou time)
 * @param goalValue Meta a ser atingida
 * @param challengeTitle Título do desafio para contexto
 */
export async function analyzeVídeoChallenge(
  videoUrl: string,
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

  // Validar que é URL do YouTube
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) {
    return {
      isValid: false,
      confidence: 0,
      reason: 'URL do YouTube inválida. Use youtube.com/watch?v=... ou youtu.be/...',
      analyzedAt: new Date().toISOString(),
    };
  }

  try {
    const goalDescription = challengeType === 'time'
      ? `${goalValue} segundos`
      : `${goalValue} repetições`;

    const prompt = `Você é um verificador de desafios físicos. ASSISTA este vídeo completo e analise:

DESAFIO: ${challengeTitle}
META: ${goalValue ? goalDescription : 'Não especificada'}

INSTRUÇÕES DE ANÁLISE:
1. A pessoa está fazendo o exercício correto para o desafio "${challengeTitle}"?
2. O exercício está sendo feito com boa forma/técnica?
3. ${challengeType === 'time'
  ? 'Quanto tempo (em segundos) a pessoa manteve o exercício?'
  : 'Quantas repetições completas a pessoa fez? Conte cada repetição cuidadosamente.'}
4. A meta de ${goalValue ? goalDescription : 'não especificada'} foi atingida?

CRITÉRIOS DE VALIDAÇÃO:
- O exercício deve corresponder ao título do desafio
- Cada repetição deve ser completa (movimento completo)
- Para tempo, considere apenas o período de execução ativa
- Seja justo mas criterioso na avaliação

Responda EXATAMENTE neste formato JSON (apenas o JSON, sem markdown):
{
  "isValid": true ou false (se bateu a meta),
  "confidence": 0-100 (quão confiante você está),
  "reason": "Explicação breve do veredito",
  "observedValue": número (repetições contadas ou segundos medidos)
}`;

    // SEGURANCA: AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    // Usar gemini-2.0-flash com suporte a YouTube nativo
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                // Passar URL do YouTube como file_data
                {
                  file_data: {
                    file_uri: videoUrl,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);

      // Verificar se é erro de vídeo privado/não listado
      if (errorText.includes('private') || errorText.includes('unavailable')) {
        return {
          isValid: false,
          confidence: 0,
          reason: 'Vídeo não acessível. Verifique se o vídeo está PÚBLICO no YouTube.',
          analyzedAt: new Date().toISOString(),
        };
      }

      return {
        isValid: false,
        confidence: 0,
        reason: 'Erro ao conectar com API Gemini. Tente novamente.',
        analyzedAt: new Date().toISOString(),
      };
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('Gemini video analysis response:', textResponse);

    const result = parseGeminiResponse(textResponse);

    return {
      ...result,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analyzing video:', error);
    return {
      isValid: false,
      confidence: 0,
      reason: 'Erro ao analisar vídeo. Verifique se o vídeo é público.',
      analyzedAt: new Date().toISOString(),
    };
  }
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
      observedValue: parsed.observedValue ? parseInt(parsed.observedValue) : undefined,
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
 * Verifica se uma URL é do YouTube
 * SEGURANCA: Validacao rigorosa para prevenir URLs maliciosas
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Normalizar e limpar URL
  const trimmedUrl = url.trim();

  // SEGURANCA: Verificar protocolo (apenas https e http)
  if (!trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('http://')) {
    return false;
  }

  // SEGURANCA: Bloquear URLs com caracteres suspeitos
  if (/[<>"'`\\]/.test(trimmedUrl)) {
    return false;
  }

  // SEGURANCA: Verificar dominio exato (previne youtube.com.malicious.com)
  try {
    const urlObj = new URL(trimmedUrl);
    const validHosts = ['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com'];
    if (!validHosts.includes(urlObj.hostname)) {
      return false;
    }
  } catch {
    return false;
  }

  // Verificar formato da URL
  return /youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\//.test(trimmedUrl);
}

/**
 * Verifica se uma URL é de uma plataforma de vídeo válida (legado)
 */
export function isValidVídeoUrl(url: string): boolean {
  return isValidYouTubeUrl(url);
}

/**
 * Extrai o tipo de plataforma da URL
 */
export function getVídeoPlatform(url: string): string | null {
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
  return null;
}
