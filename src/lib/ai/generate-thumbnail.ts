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

    // 2. Chamar DALL-E 3 para gerar imagem (natural = mais realista)
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
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
 * Gera imagens REALISTAS no estilo de fotografia profissional
 */
function buildThumbnailPrompt(input: ChallengeThumbnailInput): string {
  // Mapear tipo para cena realista
  const themeByType: Record<string, string> = {
    fisico: 'Athletic person performing exercise with perfect form. Professional fitness photography in modern gym or outdoor setting.',
    engajamento: 'Person happily using smartphone, social media engagement moment. Lifestyle photography with warm natural lighting.',
    participe: 'Exciting prize presentation scene with luxury gift boxes, golden confetti, celebration atmosphere. Product photography style.',
  };

  // Mapear ícones para descrições de cenas realistas
  const iconHints: Record<string, string> = {
    '💪': 'athletic person showing strong arm muscles, fitness model flexing bicep',
    '🏋️': 'person lifting heavy barbell in gym, professional weightlifting form',
    '🏃': 'athletic runner in motion outdoors, dynamic running photography',
    '🚴': 'cyclist riding bike on scenic road, cycling action shot',
    '🧘': 'person in peaceful yoga pose, serene meditation moment',
    '🤸': 'flexible athlete doing gymnastic move, acrobatic pose',
    '⚡': 'explosive workout moment, high intensity training action',
    '🔥': 'intense workout with sweat, athlete pushing limits',
    '🎁': 'beautiful wrapped gift box being revealed, luxury present',
    '🎯': 'achievement moment, person celebrating reaching goal',
    '⭐': 'winner moment, person celebrating success',
    '🏆': 'champion holding golden trophy, victory celebration',
    '❤️': 'person making heart gesture with hands, showing love',
    '💬': 'person engaged happily with phone, social conversation',
    '📸': 'content creator taking photo, smartphone photography moment',
  };

  const iconHint = iconHints[input.icon] || `realistic scene of ${input.icon}`;
  const theme = themeByType[input.type] || themeByType.fisico;

  // Contexto específico do exercício
  let exerciseContext = '';
  if (input.type === 'fisico' && input.goal_type) {
    if (input.goal_type === 'repetitions') {
      exerciseContext = 'Capture the dynamic moment of exercise repetition, showing effort and determination.';
    } else if (input.goal_type === 'time') {
      exerciseContext = 'Show someone holding a challenging position with focus and endurance.';
    }
  }

  if (input.type === 'participe') {
    exerciseContext = 'Create an exciting atmosphere of winning and prizes, luxurious and aspirational.';
  }

  return `Create a PHOTOREALISTIC, high-quality image for a fitness challenge app.

PHOTOGRAPHY STYLE:
- Professional stock photography quality
- Cinematic lighting with dramatic shadows and highlights
- Sharp focus, high resolution details
- Modern, aspirational aesthetic
- Real photograph look, NOT illustration or cartoon

SCENE:
${theme}

SUBJECT:
${iconHint}

${exerciseContext}

TECHNICAL REQUIREMENTS:
- Dramatic, motivational lighting (golden hour or professional studio)
- Shallow depth of field for cinematic look
- Clean, non-distracting background
- Person shown from back, side, or partial view (avoid direct face)

MOOD:
Inspiring, powerful, achievable, motivational

CHALLENGE TITLE: "${input.title}"

CRITICAL RULES:
- NO text, words, letters, or watermarks
- Must look like a real photograph
- Professional sports/fitness photography style
- Make viewers want to participate in this challenge`;
}
