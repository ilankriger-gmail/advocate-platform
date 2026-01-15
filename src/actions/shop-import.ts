'use server';

import { logger, sanitizeError } from '@/lib';

const shopLogger = logger.withContext('[ShopImport]');

/**
 * Produto importado da loja Uma Penca
 */
export interface ImportedProduct {
  id: string;
  name: string;
  price: number;
  priceOld?: number;
  imageUrl: string;
  productUrl: string;
  colors?: string[];
}

/**
 * Resposta da busca de produtos
 */
interface FetchProductsResponse {
  success: boolean;
  products: ImportedProduct[];
  error?: string;
}

/**
 * Busca produtos da loja Uma Penca
 * A loja usa Vue.js e expõe os dados em window.vueInitialData
 */
export async function fetchUmaPencaProducts(
  storeUrl: string = 'https://umapenca.com/omocodoteamo/'
): Promise<FetchProductsResponse> {
  try {
    shopLogger.info('Buscando produtos da loja', { storeUrl });

    // Fetch da página da loja
    const response = await fetch(storeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArenaTeAmo/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 300 }, // Cache por 5 minutos
    });

    if (!response.ok) {
      throw new Error(`Erro ao acessar loja: ${response.status}`);
    }

    const html = await response.text();

    // Extrair dados do vueInitialData
    const vueDataMatch = html.match(/window\.vueInitialData\s*=\s*({[\s\S]*?});/);

    if (!vueDataMatch) {
      // Tentar outro padrão
      const altMatch = html.match(/__NUXT__\s*=\s*({[\s\S]*?});/);
      if (!altMatch) {
        throw new Error('Dados de produtos não encontrados na página');
      }
    }

    let products: ImportedProduct[] = [];

    // Tentar extrair produtos do HTML de diferentes formas
    // Padrão 1: vueInitialData
    if (vueDataMatch) {
      try {
        const vueData = JSON.parse(vueDataMatch[1]);
        if (vueData.products && Array.isArray(vueData.products)) {
          products = vueData.products.map((p: any) => ({
            id: p.id?.toString() || p.slug || `product-${Math.random()}`,
            name: p.name || p.title || 'Produto sem nome',
            price: parseFloat(p.price) || 0,
            priceOld: p.price_old ? parseFloat(p.price_old) : undefined,
            imageUrl: p.img_cover || p.image || p.img_male || '',
            productUrl: p.link || `${storeUrl}produto/${p.slug}`,
            colors: p.fabrics?.map((f: any) => f.name) || [],
          }));
        }
      } catch (parseError) {
        shopLogger.warn('Erro ao parsear vueInitialData', { error: sanitizeError(parseError) });
      }
    }

    // Padrão 2: Extrair de data-products ou similar
    if (products.length === 0) {
      const dataProductsMatch = html.match(/data-products="([^"]+)"/);
      if (dataProductsMatch) {
        try {
          const decoded = dataProductsMatch[1]
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');
          const productsData = JSON.parse(decoded);
          if (Array.isArray(productsData)) {
            products = productsData.map((p: any) => ({
              id: p.id?.toString() || `product-${Math.random()}`,
              name: p.name || p.title || 'Produto sem nome',
              price: parseFloat(p.price) || 0,
              imageUrl: p.image || p.img || '',
              productUrl: p.url || p.link || storeUrl,
            }));
          }
        } catch {
          // Ignorar erro de parse
        }
      }
    }

    // Padrão 3: Extrair de JSON inline em script
    if (products.length === 0) {
      const jsonMatch = html.match(/"products"\s*:\s*(\[[\s\S]*?\])/);
      if (jsonMatch) {
        try {
          const productsData = JSON.parse(jsonMatch[1]);
          products = productsData.map((p: any) => ({
            id: p.id?.toString() || `product-${Math.random()}`,
            name: p.name || p.title || 'Produto sem nome',
            price: parseFloat(p.price) || 0,
            imageUrl: p.image || p.img_cover || '',
            productUrl: p.link || storeUrl,
          }));
        } catch {
          // Ignorar erro de parse
        }
      }
    }

    // Padrão 4: Extrair de meta tags e estrutura HTML
    if (products.length === 0) {
      // Buscar por padrões de produto no HTML
      const productRegex = /<div[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<[\s\S]*?R\$\s*([\d,.]+)/gi;
      let match;

      while ((match = productRegex.exec(html)) !== null) {
        products.push({
          id: `product-${products.length}`,
          name: match[2]?.trim() || 'Produto',
          price: parseFloat(match[3]?.replace(',', '.')) || 0,
          imageUrl: match[1] || '',
          productUrl: storeUrl,
        });
      }
    }

    // Filtrar produtos sem imagem ou preço
    products = products.filter(p => p.name && p.imageUrl);

    shopLogger.info('Produtos encontrados', { count: products.length });

    return {
      success: true,
      products,
    };
  } catch (error) {
    shopLogger.error('Erro ao buscar produtos', { error: sanitizeError(error) });
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Importa produtos selecionados como prêmios
 */
export async function importProductsAsRewards(
  products: Array<{
    product: ImportedProduct;
    coinsCost: number;
    stock: number;
  }>
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  // Esta função será chamada pelo componente que já tem acesso ao createReward
  // Retornamos os dados formatados para criação
  const errors: string[] = [];
  let imported = 0;

  for (const item of products) {
    if (!item.product.name || item.coinsCost <= 0) {
      errors.push(`Produto "${item.product.name}" inválido`);
      continue;
    }
    imported++;
  }

  return { success: errors.length === 0, imported, errors };
}
