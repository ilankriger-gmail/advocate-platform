import OpenAI from 'openai';
import { logger, sanitizeError } from '@/lib';

// Logger contextualizado para verificação de links
const linkLogger = logger.withContext('[LinkVerify]');

// Cliente OpenAI inicializado lazily
let openaiClient: OpenAI | null = null;

// SEGURANCA: Timeout para evitar requisicoes pendentes indefinidamente
const OPENAI_TIMEOUT_MS = 15000; // 15 segundos

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    linkLogger.error('OpenAI API key não configurada');
    return null;
  }

  openaiClient = new OpenAI({
    apiKey,
    timeout: OPENAI_TIMEOUT_MS,
    maxRetries: 2,
  });
  return openaiClient;
}

/**
 * Resultado da verificação de segurança do link
 */
export interface LinkVerification {
  isSafe: boolean;
  reason?: string;
  category: 'spam' | 'phishing' | 'malware' | 'adult' | 'suspicious' | 'safe';
}

/**
 * Verifica a segurança de um link usando OpenAI
 * Analisa: spam, phishing, malware, conteúdo adulto, domínios suspeitos
 */
export async function verifyLinkSafety(url: string): Promise<LinkVerification> {
  // Validação básica da URL
  if (!url || typeof url !== 'string') {
    return {
      isSafe: false,
      reason: 'URL inválida',
      category: 'suspicious',
    };
  }

  // Normalizar URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  // Validar formato da URL
  try {
    new URL(normalizedUrl);
  } catch {
    return {
      isSafe: false,
      reason: 'Formato de URL inválido',
      category: 'suspicious',
    };
  }

  linkLogger.debug('Verificando link', { urlLength: normalizedUrl.length });

  const client = getOpenAIClient();

  if (!client) {
    // Se não conseguir verificar com IA, permitir mas logar
    linkLogger.warn('Cliente OpenAI não disponível - permitindo link sem verificação');
    return {
      isSafe: true,
      category: 'safe',
    };
  }

  const prompt = `Analise este link e determine se é seguro para ser exibido em um perfil de usuário de uma comunidade online.

URL: ${normalizedUrl}

Verifique se o link:
1. É um site de SPAM ou marketing agressivo
2. Parece ser PHISHING (imitando sites legítimos)
3. Pode conter MALWARE ou downloads suspeitos
4. É um site de conteúdo ADULTO ou pornográfico
5. Tem características SUSPEITAS (domínio estranho, encurtador suspeito, etc.)

Considere SEGUROS:
- Redes sociais conhecidas (instagram.com, tiktok.com, youtube.com, twitter.com, linkedin.com, facebook.com)
- Serviços de hospedagem de código (github.com, gitlab.com, bitbucket.org)
- Plataformas de portfólio (behance.net, dribbble.com, medium.com)
- Sites pessoais com domínios normais (.com, .com.br, .net, .org, .io, etc.)
- Encurtadores conhecidos (bit.ly, linktr.ee, linktree.com)
- Plataformas de streaming (spotify.com, soundcloud.com, twitch.tv)

Considere SUSPEITOS:
- URLs com muitos números ou caracteres aleatórios
- Domínios que imitam sites conhecidos (go0gle.com, faceb00k.com)
- Sites com extensões incomuns (.xyz, .top, .click, .work combinados com nomes estranhos)
- Links com parâmetros excessivos ou codificados

Retorne APENAS um JSON válido:
{
  "isSafe": <true|false>,
  "reason": "<motivo curto se não for seguro, ou null se for seguro>",
  "category": "<spam|phishing|malware|adult|suspicious|safe>"
}`;

  try {
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em segurança web que analisa URLs e retorna apenas JSON válido.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // bem determinístico
      max_tokens: 200,
    });

    const elapsed = Date.now() - startTime;
    linkLogger.debug('Resposta recebida', { elapsed: `${elapsed}ms` });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      linkLogger.error('Resposta vazia da OpenAI');
      // Em caso de erro, permitir o link
      return { isSafe: true, category: 'safe' };
    }

    const result = JSON.parse(content) as LinkVerification;

    // Validação do resultado
    if (typeof result.isSafe !== 'boolean') {
      linkLogger.error('Resultado inválido da IA', { result });
      return { isSafe: true, category: 'safe' };
    }

    linkLogger.debug('Verificação concluída', {
      isSafe: result.isSafe,
      category: result.category,
    });

    return {
      isSafe: result.isSafe,
      reason: result.reason || undefined,
      category: result.category || 'safe',
    };
  } catch (error) {
    const sanitized = sanitizeError(error);
    linkLogger.error('Erro na verificação de link', { error: sanitized });
    // Em caso de erro, permitir o link
    return { isSafe: true, category: 'safe' };
  }
}
