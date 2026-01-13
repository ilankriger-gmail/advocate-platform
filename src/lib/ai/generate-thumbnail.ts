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
  // Foco no MOVIMENTO e EXERCÍCIO, não no corpo da pessoa
  let specificExercise = '';
  const exerciseKeywords: Record<string, string> = {
    'flexão': 'push-up movement from side angle, hands on ground, focus on the exercise',
    'flexões': 'push-up movement from side angle, hands on ground, focus on the exercise',
    'flexoes': 'push-up movement from side angle, hands on ground, focus on the exercise',
    'push-up': 'push-up movement from side angle, hands on ground, focus on the exercise',
    'pushup': 'push-up movement from side angle, hands on ground, focus on the exercise',
    'abdominal': 'crunch exercise movement, person on mat doing sit-ups',
    'abdominais': 'crunch exercise movement, person on mat doing sit-ups',
    'agachamento': 'squat exercise movement, legs bent, focus on the position',
    'agachamentos': 'squat exercise movement, legs bent, focus on the position',
    'squat': 'squat exercise movement, legs bent, focus on the position',
    'prancha': 'plank position from side view, core exercise on mat',
    'plank': 'plank position from side view, core exercise on mat',
    'burpee': 'burpee jump movement, dynamic full body exercise',
    'burpees': 'burpee jump movement, dynamic full body exercise',
    'corrida': 'running outdoors, jogging in park or street',
    'correr': 'running outdoors, jogging in park or street',
    'running': 'running outdoors, jogging in park or street',
    'pular': 'jump rope exercise, skipping movement',
    'pulo': 'jump rope exercise, skipping movement',
    'jump': 'jump rope exercise, skipping movement',
    'bicicleta': 'cycling on bike, pedaling movement',
    'bike': 'cycling on bike, pedaling movement',
    'yoga': 'yoga pose, peaceful stretching moment',
    'alongamento': 'stretching movement, flexibility exercise',
    'stretch': 'stretching movement, flexibility exercise',
    'levantamento': 'weight lifting movement, dumbbells or barbell',
    'peso': 'dumbbell exercise, weight training movement',
    'haltere': 'dumbbell exercise, weight training movement',
    'barra': 'pull-up bar exercise, hanging movement',
    'pull-up': 'pull-up bar exercise, hanging movement',
    'polichinelo': 'jumping jacks movement, arms and legs spread',
    'jumping jack': 'jumping jacks movement, arms and legs spread',
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

  // Contexto baseado no tipo - foco no exercício, pessoas normais
  const themeByType: Record<string, string> = {
    fisico: specificExercise || 'Regular person doing exercise, focus on the movement not the body',
    engajamento: 'Person happily using smartphone, social media engagement moment',
    participe: 'Exciting prize presentation scene with gift boxes, celebration atmosphere',
    atos_amor: 'Heartwarming moment of kindness, person helping another or showing care',
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

  return `Create a SQUARE thumbnail image for a fitness challenge app.

CHALLENGE CONTEXT:
Title: "${input.title}"
Description: "${input.description || 'Fitness challenge'}"
${goalContext}

MAIN SUBJECT:
${theme}

LOCATION:
${locationContext}

BODY TYPE (VERY IMPORTANT):
- Show a REGULAR, EVERYDAY person with NORMAL/AVERAGE build
- NOT a bodybuilder, fitness model, or extremely muscular person
- NOT a professional athlete with visible six-pack abs
- Think: regular person who exercises casually, not a gym enthusiast
- Natural, relatable physique that everyday users can identify with

FOCUS:
- Emphasize the EXERCISE MOVEMENT and ACTION
- Do NOT focus on the person's physique or muscles
- Show the exercise being performed, not a pose showing off muscles
- Camera angle should highlight the movement, not the body

STYLE REQUIREMENTS:
- Clean, simple fitness photography
- Square composition optimized for thumbnail/icon use
- Bold, clear subject that reads well at small sizes
- Soft, natural lighting (not dramatic bodybuilding-style lighting)
- Clean background, no clutter
- Person shown from back, side, or partial view (no direct face)

IMAGE CHARACTERISTICS:
- Photorealistic, like a real photograph
- Warm, inviting colors (not harsh gym lighting)
- Sharp focus on the exercise movement
- Simple composition that works as small icon

CRITICAL RULES:
- NO text, words, letters, numbers, or watermarks
- NO logos or brand elements
- NO muscular/bodybuilder physiques
- NO fitness model poses
- Must feel approachable and achievable for regular people
- Image should clearly represent: ${input.title}`;
}
