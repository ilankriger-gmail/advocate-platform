import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/admin';

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
  type: 'fisico' | 'engajamento' | 'participe';
  icon: string;
  goal_type?: 'repetitions' | 'time' | null;
  goal_value?: number | null;
  coins_reward: number;
  prize_amount?: number | null;
}

/**
 * Gera uma thumbnail para um desafio usando DALL-E 3
 * @returns URL permanente no Supabase Storage ou null em caso de erro
 */
export async function generateChallengeThumbnail(
  input: ChallengeThumbnailInput
): Promise<{ success: boolean; url?: string; error?: string }> {
  const client = getOpenAIClient();

  if (!client) {
    return {
      success: false,
      error: 'API OpenAI não configurada',
    };
  }

  try {
    console.log('[AI Thumbnail] Gerando thumbnail para desafio:', input.title);

    // 1. Construir prompt baseado nos dados do desafio
    const prompt = buildThumbnailPrompt(input);

    // 2. Chamar DALL-E 3 para gerar imagem
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
    });

    const imageData = response.data;
    if (!imageData || imageData.length === 0 || !imageData[0].url) {
      console.error('[AI Thumbnail] DALL-E não retornou URL da imagem');
      return {
        success: false,
        error: 'DALL-E não retornou imagem',
      };
    }

    const imageUrl = imageData[0].url;

    console.log('[AI Thumbnail] Imagem gerada, fazendo upload para Storage...');

    // 3. Baixar imagem da URL temporária
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Erro ao baixar imagem: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const imageArrayBuffer = await imageBlob.arrayBuffer();

    // 4. Upload para Supabase Storage (usando admin client para bypassar RLS)
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

    // 5. Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('challenge-thumbnails')
      .getPublicUrl(fileName);

    console.log('[AI Thumbnail] Thumbnail salva com sucesso:', publicUrlData.publicUrl);

    return {
      success: true,
      url: publicUrlData.publicUrl,
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
 */
function buildThumbnailPrompt(input: ChallengeThumbnailInput): string {
  // Mapear tipo para tema visual
  const themeByType: Record<string, string> = {
    fisico: 'A person doing dynamic exercise (push-ups, squats, running, jumping). Athletic and energetic pose. Fitness and sports theme.',
    engajamento: 'Social media engagement icons like hearts, comments, shares, and connections. Digital community and interaction theme.',
    participe: 'Celebration elements like confetti, gift boxes, prize ribbons, and lottery elements. Winning and giveaway theme.',
  };

  // Mapear ícones comuns para elementos visuais
  const iconHints: Record<string, string> = {
    '💪': 'muscular arm, strength, bicep flex',
    '🏋️': 'weightlifting, barbell, gym equipment',
    '🏃': 'running person, jogging, cardio',
    '🚴': 'cycling, bicycle, spinning',
    '🧘': 'yoga pose, meditation, stretching',
    '🤸': 'gymnastics, acrobatics, flexibility',
    '⚡': 'energy bolt, power, speed',
    '🔥': 'flames, fire, intensity',
    '🎁': 'gift box, present, surprise',
    '🎯': 'target, bullseye, goal',
    '⭐': 'star, achievement, excellence',
    '🏆': 'trophy, championship, winner',
    '❤️': 'heart, love, passion',
    '💬': 'speech bubble, comments, conversation',
    '📸': 'camera, photo, social media',
  };

  const iconHint = iconHints[input.icon] || `stylized representation of ${input.icon} emoji`;
  const theme = themeByType[input.type] || themeByType.fisico;

  // Adicionar contexto baseado no tipo
  let contextHint = '';
  if (input.type === 'fisico' && input.goal_type) {
    if (input.goal_type === 'repetitions' && input.goal_value) {
      contextHint = `The challenge involves completing ${input.goal_value} repetitions of an exercise.`;
    } else if (input.goal_type === 'time' && input.goal_value) {
      contextHint = `The challenge involves maintaining a position for ${input.goal_value} seconds.`;
    }
  }

  if (input.type === 'participe' && input.prize_amount) {
    contextHint = 'This is a prize giveaway challenge with exciting rewards.';
  }

  return `Create a vibrant, modern digital illustration for a fitness/social challenge app.

STYLE REQUIREMENTS:
- Flat design with bold, saturated colors
- Clean and minimalist composition
- Professional app-quality artwork
- Soft gradient background
- NO TEXT, NO WORDS, NO LETTERS in the image
- NO realistic human faces (use stylized/abstract figures if needed)

THEME AND ELEMENTS:
${theme}

MAIN VISUAL ELEMENT:
Incorporate a ${iconHint} as a central or prominent design element.

COLOR PALETTE:
Energetic and motivational colors - use vibrant combinations of:
- Pinks, magentas, and reds for energy
- Purples and indigos for premium feel
- Cyans and teals for freshness
- Oranges and yellows for warmth

MOOD:
Empowering, achievable, fun, and motivational.

CHALLENGE CONTEXT:
Title: "${input.title}"
${contextHint}

IMPORTANT:
- Keep the design abstract and iconographic
- Suitable for a mobile app card/banner
- The image should work well as a 16:9 thumbnail when cropped`;
}
