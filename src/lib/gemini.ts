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
  isSuspicious?: boolean; // Flag para conteúdo suspeito que precisa revisão humana
}

// Resultado de análise do Instagram
export interface InstagramVerdict {
  isValid: boolean;
  confidence: number; // 0-100
  reason: string;
  analyzedAt: string;
  isSuspicious: boolean;
}

interface GeminiAnalysisResult {
  isValid: boolean;
  confidence: number;
  reason: string;
  observedValue?: number;
  isSuspicious?: boolean;
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
      reason: 'API Gemini não configurada - verificação manual necessaria',
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
      confidence: Math.min(100, Math.max(0, parseInt(parsed.confidence, 10) || 0)),
      reason: String(parsed.reason || 'Sem detalhes'),
      observedValue: parsed.observedValue ? parseInt(parsed.observedValue, 10) : undefined,
      isSuspicious: Boolean(parsed.isSuspicious),
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
 * Analisa um vídeo de "Atos de Amor" usando Gemini
 * ASSISTE o vídeo do YouTube e verifica se o ato de amor foi realizado
 *
 * @param videoUrl URL do vídeo do YouTube (deve ser público)
 * @param challengeTitle Título do desafio (ex: "Ajudar um idoso")
 * @param actionInstructions Instruções específicas do ato de amor
 */
export async function analyzeAtosAmorChallenge(
  videoUrl: string,
  challengeTitle: string,
  actionInstructions?: string | null
): Promise<AIVerdict> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Se não tem API key, retorna verificação manual
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return {
      isValid: false,
      confidence: 0,
      reason: 'API Gemini não configurada - verificação manual necessária',
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
    const prompt = `Você é um verificador de desafios de "Atos de Amor". ASSISTA este vídeo completo e analise:

DESAFIO: ${challengeTitle}
${actionInstructions ? `O QUE A PESSOA DEVE FAZER: ${actionInstructions}` : ''}

INSTRUÇÕES DE ANÁLISE:
1. A pessoa está realizando EXATAMENTE o que o desafio "${challengeTitle}" pede?
2. ${actionInstructions ? `A pessoa seguiu as instruções: "${actionInstructions}"?` : 'A pessoa realizou o ato de amor proposto?'}
3. A ação é claramente visível no vídeo?
4. A reação das pessoas (se houver) é genuína?

CRITÉRIOS DE VALIDAÇÃO:
- O ato deve corresponder ESPECIFICAMENTE ao desafio proposto
- A ação deve ser claramente visível e identificável no vídeo
- Deve haver evidência clara de que o desafio foi cumprido
- Ser justo mas criterioso na avaliação

MARQUE COMO SUSPEITO SE:
- Conteúdo parece ser spam ou propaganda
- Vídeo não relacionado ao desafio específico
- Possível conteúdo ofensivo ou inapropriado
- Tentativa de fraude ou manipulação
- Vídeo claramente reciclado/repostado
- Qualquer coisa que precise avaliação humana

Responda EXATAMENTE neste formato JSON (apenas o JSON, sem markdown):
{
  "isValid": true ou false (se cumpriu o desafio específico),
  "confidence": 0-100 (quão confiante você está),
  "reason": "Explicação breve do que foi observado no vídeo",
  "isSuspicious": true ou false (se precisa revisão humana)
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
            temperature: 0.3, // Um pouco mais flexível que desafios físicos
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error (Atos de Amor):', response.status, errorText);

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

    console.log('Gemini Atos de Amor analysis response:', textResponse);

    const result = parseGeminiResponse(textResponse);

    return {
      ...result,
      isSuspicious: result.isSuspicious || false,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analyzing Atos de Amor video:', error);
    return {
      isValid: false,
      confidence: 0,
      reason: 'Erro ao analisar vídeo. Verifique se o vídeo é público.',
      analyzedAt: new Date().toISOString(),
      isSuspicious: false,
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

  // BLOQUEIO: Nao aceitar YouTube Shorts (apenas videos completos)
  if (/youtube\.com\/shorts\//i.test(trimmedUrl)) {
    return false;
  }

  // Verificar formato da URL (apenas watch e youtu.be - videos completos)
  return /youtube\.com\/watch\?v=|youtu\.be\//.test(trimmedUrl);
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

/**
 * Verifica se uma URL é do Instagram
 * SEGURANCA: Validacao rigorosa para prevenir URLs maliciosas
 */
export function isValidInstagramUrl(url: string): boolean {
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

  // SEGURANCA: Verificar dominio exato (previne instagram.com.malicious.com)
  try {
    const urlObj = new URL(trimmedUrl);
    const validHosts = ['www.instagram.com', 'instagram.com', 'm.instagram.com'];
    if (!validHosts.includes(urlObj.hostname)) {
      return false;
    }
  } catch {
    return false;
  }

  // Verificar formato da URL (post ou reel)
  return /instagram\.com\/(p|reel|reels)\/[A-Za-z0-9_-]+/.test(trimmedUrl);
}

/**
 * Extrai o código do post/reel do Instagram da URL
 */
function extractInstagramCode(url: string): string | null {
  const match = url.match(/instagram\.com\/(p|reel|reels)\/([A-Za-z0-9_-]+)/);
  return match ? match[2] : null;
}

/**
 * Analisa um link do Instagram usando Gemini
 * ACESSA o post/reel e verifica se corresponde ao desafio
 *
 * @param instagramUrl URL do post/reel do Instagram (deve ser público)
 * @param challengeTitle Título do desafio
 * @param actionInstructions Instruções específicas do ato de amor
 */
export async function analyzeInstagramLink(
  instagramUrl: string,
  challengeTitle: string,
  actionInstructions?: string | null
): Promise<InstagramVerdict> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Se não tem API key, retorna verificação manual
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return {
      isValid: false,
      confidence: 0,
      reason: 'API Gemini não configurada - verificação manual necessária',
      analyzedAt: new Date().toISOString(),
      isSuspicious: false,
    };
  }

  // Validar que é URL do Instagram
  if (!isValidInstagramUrl(instagramUrl)) {
    return {
      isValid: false,
      confidence: 0,
      reason: 'URL do Instagram inválida. Use instagram.com/p/... ou instagram.com/reel/...',
      analyzedAt: new Date().toISOString(),
      isSuspicious: false,
    };
  }

  const instagramCode = extractInstagramCode(instagramUrl);
  if (!instagramCode) {
    return {
      isValid: false,
      confidence: 0,
      reason: 'Não foi possível extrair o código do post/reel do Instagram',
      analyzedAt: new Date().toISOString(),
      isSuspicious: false,
    };
  }

  try {
    const prompt = `Você é um verificador de desafios de "Atos de Amor". Analise este conteúdo do Instagram:

DESAFIO: ${challengeTitle}
${actionInstructions ? `O QUE A PESSOA DEVE FAZER: ${actionInstructions}` : ''}

INSTRUÇÕES DE ANÁLISE:
1. A pessoa está realizando EXATAMENTE o que o desafio "${challengeTitle}" pede?
2. ${actionInstructions ? `A pessoa seguiu as instruções: "${actionInstructions}"?` : 'A pessoa realizou o ato de amor proposto?'}
3. A ação é claramente visível no conteúdo?
4. A reação das pessoas (se houver) é genuína?

CRITÉRIOS DE VALIDAÇÃO:
- O ato deve corresponder ESPECIFICAMENTE ao desafio proposto
- A ação deve ser claramente visível e identificável
- Deve haver evidência clara de que o desafio foi cumprido
- Ser justo mas criterioso na avaliação

MARQUE COMO SUSPEITO SE:
- Perfil parece ser fake ou bot
- Conteúdo não relacionado ao desafio específico
- Possível spam ou propaganda
- Conta privada ou conteúdo inacessível
- Conteúdo ofensivo ou inapropriado
- Qualquer coisa que precise avaliação humana

Responda EXATAMENTE neste formato JSON (apenas o JSON, sem markdown):
{
  "isValid": true ou false (se cumpriu o desafio específico),
  "confidence": 0-100 (quão confiante você está),
  "reason": "Explicação breve do que foi observado no Instagram",
  "isSuspicious": true ou false (se precisa revisão humana)
}`;

    // SEGURANCA: AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    // Usar gemini-2.0-flash - passar a URL do Instagram diretamente
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
                // Tentar acessar a URL do Instagram diretamente
                {
                  file_data: {
                    file_uri: instagramUrl,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error (Instagram):', response.status, errorText);

      // Se o Gemini não consegue acessar o Instagram diretamente,
      // marcar como suspeito para revisão humana
      if (errorText.includes('INVALID_ARGUMENT') || errorText.includes('file_uri')) {
        return {
          isValid: false,
          confidence: 0,
          reason: 'Não foi possível acessar o link do Instagram automaticamente. Será revisado manualmente.',
          analyzedAt: new Date().toISOString(),
          isSuspicious: true, // Marcar para revisão humana
        };
      }

      return {
        isValid: false,
        confidence: 0,
        reason: 'Erro ao conectar com API Gemini. Tente novamente.',
        analyzedAt: new Date().toISOString(),
        isSuspicious: false,
      };
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('Gemini Instagram analysis response:', textResponse);

    const result = parseGeminiResponse(textResponse);

    return {
      isValid: result.isValid,
      confidence: result.confidence,
      reason: result.reason,
      isSuspicious: result.isSuspicious || false,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analyzing Instagram link:', error);
    return {
      isValid: false,
      confidence: 0,
      reason: 'Erro ao analisar link do Instagram. Será revisado manualmente.',
      analyzedAt: new Date().toISOString(),
      isSuspicious: true, // Marcar para revisão humana
    };
  }
}
