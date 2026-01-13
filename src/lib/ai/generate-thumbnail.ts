import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/admin';

// Timeout wrapper para evitar loading infinito
function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout: ${operation} demorou mais de ${ms / 1000}s`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Cliente OpenAI inicializado lazily
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[AI Thumbnail] OPENAI_API_KEY não configurada');
    return null;
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/**
 * Interface para dados do desafio para geração de thumbnail
 */
export interface ChallengeThumbnailInput {
  challengeId: string;
  title: string;
  description?: string | null;
  type: 'fisico' | 'engajamento' | 'participe' | 'atos_amor';
  icon: string;
  goal_type?: 'repetitions' | 'time' | null;
  goal_value?: number | null;
  coins_reward: number;
  prize_amount?: number | null;
}

/**
 * Gera um emoji adequado para um desafio usando GPT
 * @returns Emoji sugerido ou emoji padrão em caso de erro
 */
export async function generateChallengeEmoji(
  title: string,
  description: string | null,
  type: 'fisico' | 'engajamento' | 'participe' | 'atos_amor'
): Promise<string> {
  const client = getOpenAIClient();

  if (!client) {
    console.error('[AI Emoji] OpenAI não configurada, usando emoji padrão');
    return getDefaultEmoji(type);
  }

  try {
    console.log('[AI Emoji] Gerando emoji para desafio:', title);

    const response = await withTimeout(
      client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente que sugere emojis para desafios de uma plataforma fitness/gamificação.
Retorne APENAS um único emoji, sem texto adicional, sem explicação.

Tipos de desafio e emojis sugeridos:
- fisico: exercícios físicos - use emojis como 💪🏋️🏃🚴🧘🤸⚡🔥🏆
- engajamento: redes sociais - use emojis como ❤️💬📸🔥⭐✨📱
- participe: sorteios/prêmios - use emojis como 🎁🎯🏆⭐🎉🎊🎰

Escolha o emoji que melhor representa o desafio baseado no título e descrição.`,
          },
          {
            role: 'user',
            content: `Título: ${title}
Descrição: ${description || 'Sem descrição'}
Tipo: ${type}`,
          },
        ],
        max_tokens: 10,
        temperature: 0.7,
      }),
      15000,
      'Geração de emoji GPT'
    );

    const emoji = response.choices[0]?.message?.content?.trim();

    // Validar se é um emoji válido (verificação básica)
    if (emoji && emoji.length <= 4) {
      console.log('[AI Emoji] Emoji gerado:', emoji);
      return emoji;
    }

    console.warn('[AI Emoji] Resposta inválida, usando padrão');
    return getDefaultEmoji(type);
  } catch (error) {
    console.error('[AI Emoji] Erro ao gerar emoji:', error);
    return getDefaultEmoji(type);
  }
}

/**
 * Retorna emoji padrão baseado no tipo de desafio
 */
function getDefaultEmoji(type: 'fisico' | 'engajamento' | 'participe' | 'atos_amor'): string {
  const defaults: Record<string, string> = {
    fisico: '💪',
    engajamento: '❤️',
    participe: '🎁',
    atos_amor: '💝',
  };
  return defaults[type] || '🎯';
}

/**
 * Gera uma thumbnail para um desafio usando DALL-E 3 e também gera emoji
 * @returns URL permanente no Supabase Storage e emoji sugerido
 */
export async function generateChallengeThumbnail(
  input: ChallengeThumbnailInput
): Promise<{ success: boolean; url?: string; emoji?: string; error?: string }> {
  const client = getOpenAIClient();

  if (!client) {
    return {
      success: false,
      error: 'API OpenAI não configurada',
    };
  }

  try {
    console.log('[AI Thumbnail] Gerando thumbnail e emoji para desafio:', input.title);

    // 1. Gerar emoji em paralelo com a thumbnail
    const emojiPromise = generateChallengeEmoji(
      input.title,
      input.description || null,
      input.type
    );

    // 2. Construir prompt baseado nos dados do desafio
    const prompt = buildThumbnailPrompt(input);
    console.log('[AI Thumbnail] Prompt criado, chamando DALL-E 3...');

    // 3. Chamar DALL-E 3 para gerar imagem quadrada (com timeout de 60s)
    // Usa quality 'standard' para thumbnails menores e geração mais rápida
    const response = await withTimeout(
      client.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024', // Quadrado para thumbnail
        quality: 'standard', // Standard para thumbnails (mais rápido e menor)
        style: 'vivid', // Vivid para cores mais vibrantes em thumbnails
      }),
      60000,
      'Geração de imagem DALL-E'
    );

    console.log('[AI Thumbnail] Resposta DALL-E recebida');

    const imageData = response.data;
    if (!imageData || imageData.length === 0 || !imageData[0].url) {
      console.error('[AI Thumbnail] DALL-E não retornou URL da imagem');
      return {
        success: false,
        error: 'DALL-E não retornou imagem',
      };
    }

    const imageUrl = imageData[0].url;
    console.log('[AI Thumbnail] Imagem gerada, fazendo download...');

    // 4. Baixar imagem da URL temporária (com timeout de 30s)
    const imageResponse = await withTimeout(
      fetch(imageUrl),
      30000,
      'Download da imagem'
    );
    if (!imageResponse.ok) {
      throw new Error(`Erro ao baixar imagem: ${imageResponse.status}`);
    }

    console.log('[AI Thumbnail] Download concluído, fazendo upload para Storage...');

    const imageBlob = await imageResponse.blob();
    const imageArrayBuffer = await imageBlob.arrayBuffer();

    // 5. Upload para Supabase Storage (usando admin client para bypassar RLS)
    const supabase = createAdminClient();
    const fileName = `${input.challengeId}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('challenge-thumbnails')
      .upload(fileName, imageArrayBuffer, {
        contentType: 'image/png',
        upsert: true, // Substituir se já existir
      });

    if (uploadError) {
      console.error('[AI Thumbnail] Erro ao fazer upload:', uploadError);
      return {
        success: false,
        error: `Erro ao salvar imagem: ${uploadError.message}`,
      };
    }

    // 6. Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('challenge-thumbnails')
      .getPublicUrl(fileName);

    // 7. Aguardar geração do emoji
    const generatedEmoji = await emojiPromise;

    console.log('[AI Thumbnail] Thumbnail salva com sucesso:', publicUrlData.publicUrl);
    console.log('[AI Thumbnail] Emoji gerado:', generatedEmoji);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      emoji: generatedEmoji,
    };
  } catch (error) {
    console.error('[AI Thumbnail] Erro ao gerar thumbnail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Constrói o prompt para DALL-E baseado nos dados do desafio
 * Gera imagens REALISTAS inspiradas no título e descrição
 */
function buildThumbnailPrompt(input: ChallengeThumbnailInput): string {
  // Extrair palavras-chave do título e descrição para contextualizar a imagem
  const titleLower = input.title.toLowerCase();
  const descLower = (input.description || '').toLowerCase();
  const combinedText = `${titleLower} ${descLower}`;

  // Detectar exercícios específicos no texto
  let specificExercise = '';
  const exerciseKeywords: Record<string, string> = {
    'flexão': 'person doing push-ups on the ground, athletic form',
    'flexões': 'person doing push-ups on the ground, athletic form',
    'flexoes': 'person doing push-ups on the ground, athletic form',
    'push-up': 'person doing push-ups on the ground, athletic form',
    'pushup': 'person doing push-ups on the ground, athletic form',
    'abdominal': 'person doing crunches or sit-ups, core workout',
    'abdominais': 'person doing crunches or sit-ups, core workout',
    'agachamento': 'person doing deep squat, leg exercise',
    'agachamentos': 'person doing deep squat, leg exercise',
    'squat': 'person doing deep squat, leg exercise',
    'prancha': 'person holding plank position, core stability',
    'plank': 'person holding plank position, core stability',
    'burpee': 'person doing explosive burpee jump, full body exercise',
    'burpees': 'person doing explosive burpee jump, full body exercise',
    'corrida': 'athletic runner in motion outdoors, running',
    'correr': 'athletic runner in motion outdoors, running',
    'running': 'athletic runner in motion outdoors, running',
    'pular': 'person jumping rope or doing jump exercise',
    'pulo': 'person jumping rope or doing jump exercise',
    'jump': 'person jumping rope or doing jump exercise',
    'bicicleta': 'cyclist riding bike, cycling workout',
    'bike': 'cyclist riding bike, cycling workout',
    'yoga': 'person in yoga pose, peaceful fitness moment',
    'alongamento': 'person stretching, flexibility exercise',
    'stretch': 'person stretching, flexibility exercise',
    'levantamento': 'person lifting weights, strength training',
    'peso': 'person lifting dumbbells, weight training',
    'haltere': 'person lifting dumbbells, weight training',
    'barra': 'person doing pull-ups or barbell exercise',
    'pull-up': 'person doing pull-ups on bar',
    'polichinelo': 'person doing jumping jacks, cardio exercise',
    'jumping jack': 'person doing jumping jacks, cardio exercise',
  };

  // Procurar exercício específico no texto
  for (const [keyword, description] of Object.entries(exerciseKeywords)) {
    if (combinedText.includes(keyword)) {
      specificExercise = description;
      break;
    }
  }

  // Detectar contexto do local
  let locationContext = 'modern gym or outdoor fitness area';
  if (combinedText.includes('casa') || combinedText.includes('home')) {
    locationContext = 'home workout space, living room';
  } else if (combinedText.includes('ar livre') || combinedText.includes('parque') || combinedText.includes('outdoor')) {
    locationContext = 'outdoor park or nature setting';
  } else if (combinedText.includes('praia') || combinedText.includes('beach')) {
    locationContext = 'beach fitness setting';
  }

  // Contexto baseado no tipo
  const themeByType: Record<string, string> = {
    fisico: specificExercise || 'Athletic person performing exercise with perfect form',
    engajamento: 'Person happily using smartphone, social media engagement moment',
    participe: 'Exciting prize presentation scene with gift boxes, celebration atmosphere',
  };

  // Meta do desafio para contexto
  let goalContext = '';
  if (input.type === 'fisico' && input.goal_value) {
    if (input.goal_type === 'repetitions') {
      goalContext = `Challenge involves ${input.goal_value} repetitions - show intense workout moment`;
    } else if (input.goal_type === 'time') {
      goalContext = `Challenge involves holding position for ${input.goal_value} seconds - show endurance and focus`;
    }
  }

  const theme = themeByType[input.type] || themeByType.fisico;

  return `Create a SQUARE thumbnail image for a fitness challenge.

CHALLENGE CONTEXT:
Title: "${input.title}"
Description: "${input.description || 'Fitness challenge'}"
${goalContext}

MAIN SUBJECT:
${theme}

LOCATION:
${locationContext}

STYLE REQUIREMENTS:
- Professional fitness photography
- Square composition optimized for thumbnail/icon use
- Bold, clear subject that reads well at small sizes
- Dramatic lighting (golden hour or studio)
- Clean background, no clutter
- High contrast for visibility
- Person shown from back, side, or partial view (no direct face)

IMAGE CHARACTERISTICS:
- Photorealistic, like a real photograph
- Vibrant, energetic colors
- Sharp focus on main subject
- Simple composition that works as small icon

CRITICAL RULES:
- NO text, words, letters, numbers, or watermarks
- NO logos or brand elements
- Must be inspiring and motivational
- Image should clearly represent: ${input.title}`;
}
