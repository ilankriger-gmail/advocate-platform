import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

// Cliente OpenAI inicializado lazily
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[AI Reward Thumbnail] OPENAI_API_KEY não configurada');
    return null;
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/**
 * Interface para dados da recompensa para geração de thumbnail
 */
export interface RewardThumbnailInput {
  rewardId: string;
  name: string;
  description?: string | null;
  type: 'digital' | 'physical';
  coins_required: number;
}

/**
 * Gera uma thumbnail para uma recompensa usando DALL-E 3
 * @returns URL permanente no Supabase Storage ou null em caso de erro
 */
export async function generateRewardThumbnail(
  input: RewardThumbnailInput
): Promise<{ success: boolean; url?: string; error?: string }> {
  const client = getOpenAIClient();

  if (!client) {
    return {
      success: false,
      error: 'API OpenAI não configurada',
    };
  }

  try {
    console.log('[AI Reward Thumbnail] Gerando thumbnail para recompensa:', input.name);

    // 1. Construir prompt baseado nos dados da recompensa
    const prompt = buildRewardThumbnailPrompt(input);

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
      console.error('[AI Reward Thumbnail] DALL-E não retornou URL da imagem');
      return {
        success: false,
        error: 'DALL-E não retornou imagem',
      };
    }

    const imageUrl = imageData[0].url;

    console.log('[AI Reward Thumbnail] Imagem gerada, fazendo upload para Storage...');

    // 3. Baixar imagem da URL temporária
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Erro ao baixar imagem: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const imageArrayBuffer = await imageBlob.arrayBuffer();

    // 4. Upload para Supabase Storage
    const supabase = await createClient();
    const fileName = `${input.rewardId}.png`;

    const { error: uploadError } = await supabase.storage
      .from('reward-images')
      .upload(fileName, imageArrayBuffer, {
        contentType: 'image/png',
        upsert: true, // Substituir se já existir
      });

    if (uploadError) {
      console.error('[AI Reward Thumbnail] Erro ao fazer upload:', uploadError);
      return {
        success: false,
        error: `Erro ao salvar imagem: ${uploadError.message}`,
      };
    }

    // 5. Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('reward-images')
      .getPublicUrl(fileName);

    console.log('[AI Reward Thumbnail] Thumbnail salva com sucesso:', publicUrlData.publicUrl);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error('[AI Reward Thumbnail] Erro ao gerar thumbnail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Constrói o prompt para DALL-E baseado nos dados da recompensa
 */
function buildRewardThumbnailPrompt(input: RewardThumbnailInput): string {
  // Determinar tema baseado no tipo
  const isPhysical = input.type === 'physical';

  const typeTheme = isPhysical
    ? 'A premium, exclusive physical product. Show elegant packaging, gift box with ribbon, or luxurious unboxing experience. Emphasize exclusivity and limited edition feel.'
    : 'A digital reward or virtual gift. Show glowing digital elements, virtual badges, digital certificates, or app icons with sparkles.';

  // Extrair palavras-chave da descrição
  let contextHint = '';
  if (input.description) {
    const desc = input.description.toLowerCase();
    if (desc.includes('camiseta') || desc.includes('camisa') || desc.includes('shirt')) {
      contextHint = 'Feature a stylish, premium t-shirt or clothing item.';
    } else if (desc.includes('caneca') || desc.includes('mug')) {
      contextHint = 'Feature a premium ceramic mug or drinkware.';
    } else if (desc.includes('boné') || desc.includes('cap') || desc.includes('hat')) {
      contextHint = 'Feature a stylish cap or headwear.';
    } else if (desc.includes('adesivo') || desc.includes('sticker')) {
      contextHint = 'Feature colorful, premium stickers or decals.';
    } else if (desc.includes('chaveiro') || desc.includes('keychain')) {
      contextHint = 'Feature an elegant keychain or accessory.';
    } else if (desc.includes('desconto') || desc.includes('cupom') || desc.includes('voucher')) {
      contextHint = 'Feature a golden ticket or discount voucher with sparkles.';
    } else if (desc.includes('acesso') || desc.includes('vip') || desc.includes('exclusivo')) {
      contextHint = 'Feature VIP pass, golden key, or exclusive access badge.';
    }
  }

  // Determinar valor/raridade baseado no custo
  let rarityHint = '';
  if (input.coins_required >= 1000) {
    rarityHint = 'Ultra premium and rare. Use gold, platinum, and diamond accents. Maximum luxury feel.';
  } else if (input.coins_required >= 500) {
    rarityHint = 'Premium and valuable. Use gold accents and rich colors.';
  } else if (input.coins_required >= 100) {
    rarityHint = 'Special edition. Use silver accents and vibrant colors.';
  } else {
    rarityHint = 'Starter reward. Use bronze accents and warm colors.';
  }

  return `Create a stunning, premium product visualization for a rewards/loyalty program app.

STYLE REQUIREMENTS:
- Photorealistic product photography style with soft studio lighting
- Clean white or gradient background
- Subtle shadows and reflections for depth
- Professional e-commerce quality
- NO TEXT, NO WORDS, NO LETTERS in the image
- NO realistic human faces

TYPE AND THEME:
${typeTheme}

SPECIFIC PRODUCT:
${contextHint || 'A beautifully wrapped mystery gift box with elegant ribbon.'}

RARITY AND VALUE:
${rarityHint}

IMPORTANT MESSAGING TO CONVEY:
- This is a LIMITED EDITION item
- Exclusive to loyal community members
- Physical items will be delivered to your home
- Premium quality and worth collecting

COLOR PALETTE:
- Rich purples and magentas for premium feel
- Gold and bronze metallic accents
- Deep indigos for luxury
- Soft pink highlights for warmth

MOOD:
Exclusive, desirable, premium, collectible, achievement unlocked.

REWARD CONTEXT:
Name: "${input.name}"
${input.description ? `Description: ${input.description}` : ''}
Cost: ${input.coins_required} hearts (loyalty points)

COMPOSITION:
- Center the product prominently
- Add subtle sparkles or glow effects
- Include small decorative elements suggesting exclusivity (ribbon, badge, seal)
- The image should work well as a product card thumbnail`;
}
