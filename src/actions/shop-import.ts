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
 * Detalhes do produto extraídos da página individual
 */
export interface ProductDetails {
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  description: string;
  materials: string[];
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
    // Padrão 1: vueInitialData (Uma Penca usa products.hits)
    if (vueDataMatch) {
      try {
        const vueData = JSON.parse(vueDataMatch[1]);
        // Uma Penca: produtos estão em products.hits
        const productsList = vueData.products?.hits || vueData.products;
        if (productsList && Array.isArray(productsList)) {
          products = productsList.map((p: any) => ({
            id: p.id?.toString() || p.slug || `product-${Math.random()}`,
            name: p.name || p.title || 'Produto sem nome',
            price: parseFloat(p.price) || 0,
            priceOld: p.price_old && p.price_old > 0 ? parseFloat(p.price_old) : undefined,
            imageUrl: p.img_cover || p.image || p.img_male || '',
            productUrl: p.full_link || (p.link ? `https://umapenca.com${p.link}` : storeUrl),
            colors: p.fabrics?.map((f: any) => f.product_color_name || f.name) || [],
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

/**
 * Busca detalhes de um produto específico da Uma Penca
 * Extrai tamanhos, cores, descrição e materiais da página do produto
 */
export async function fetchProductDetails(productUrl: string): Promise<{
  success: boolean;
  data?: ProductDetails;
  error?: string;
}> {
  try {
    shopLogger.info('Buscando detalhes do produto', { productUrl });

    // Validar URL
    if (!productUrl.includes('umapenca.com')) {
      return { success: false, error: 'URL inválida - deve ser da loja Uma Penca' };
    }

    // Fetch da página do produto
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArenaTeAmo/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Erro ao acessar produto: ${response.status}`);
    }

    const html = await response.text();

    // Extrair window.initialScope que contém todos os dados do produto
    const initialScopeMatch = html.match(/window\.initialScope\s*=\s*({[\s\S]*?});[\s\n]*<\/script>/);

    const details: ProductDetails = {
      sizes: [],
      colors: [],
      description: '',
      materials: [],
    };

    if (initialScopeMatch) {
      try {
        // Limpar e parsear o JSON
        let jsonStr = initialScopeMatch[1];
        // Remover possíveis comentários e limpar
        jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');

        const scopeData = JSON.parse(jsonStr);

        // Extrair tamanhos únicos das variações
        if (scopeData.ELASTIC_PRODUCT?.variations) {
          const sizeSet = new Set<string>();
          const sizeOrder = ['PP', 'P', 'M', 'G', 'GG', '2GG', '3GG', '4GG', 'XPP', 'XP', 'XM', 'XG', 'XGG'];

          for (const variation of scopeData.ELASTIC_PRODUCT.variations) {
            if (variation.size_id) {
              // Extrair o tamanho do variation_id (ex: "322535-139-3-1" -> tamanho 3 = M)
              // Ou tentar mapear do size_id direto
              const sizeMap: Record<number, string> = {
                1: 'PP', 2: 'P', 3: 'M', 4: 'G', 5: 'GG', 6: '2GG', 7: '3GG', 8: '4GG'
              };
              if (sizeMap[variation.size_id]) {
                sizeSet.add(sizeMap[variation.size_id]);
              }
            }
          }

          // Ordenar tamanhos
          details.sizes = Array.from(sizeSet).sort((a, b) => {
            return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
          });
        }

        // Extrair cores dos fabrics
        if (scopeData.fabrics && Array.isArray(scopeData.fabrics)) {
          details.colors = scopeData.fabrics.map((fabric: any) => ({
            name: fabric.name || fabric.title || 'Cor',
            hex: fabric.hex || fabric.color || '#CCCCCC',
          }));
        }

        // Extrair descrição
        if (scopeData.ELASTIC_PRODUCT?.description) {
          details.description = scopeData.ELASTIC_PRODUCT.description;
        }

      } catch (parseError) {
        shopLogger.warn('Erro ao parsear initialScope', { error: sanitizeError(parseError) });
      }
    }

    // Fallback: tentar extrair de meta tags
    if (!details.description) {
      const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      if (metaDescMatch) {
        details.description = metaDescMatch[1];
      }
    }

    // Tentar extrair materiais do HTML
    const materialPatterns = [
      /100%\s*algodão\s*sustentável/gi,
      /100%\s*algodão/gi,
      /algodão\s*orgânico/gi,
      /poliéster/gi,
    ];

    for (const pattern of materialPatterns) {
      const match = html.match(pattern);
      if (match && !details.materials.includes(match[0])) {
        details.materials.push(match[0]);
      }
    }

    // Se não encontrou tamanhos, usar lista padrão para camisetas
    if (details.sizes.length === 0 && productUrl.includes('/camiseta/')) {
      details.sizes = ['PP', 'P', 'M', 'G', 'GG', '2GG', '3GG', '4GG'];
    }

    // Se não encontrou cores, tentar extrair do HTML
    if (details.colors.length === 0) {
      const colorDivs = html.match(/data-fabric-hex="([^"]+)"[^>]*data-fabric-name="([^"]+)"/gi);
      if (colorDivs) {
        for (const div of colorDivs) {
          const hexMatch = div.match(/data-fabric-hex="([^"]+)"/);
          const nameMatch = div.match(/data-fabric-name="([^"]+)"/);
          if (hexMatch && nameMatch) {
            const existing = details.colors.find(c => c.hex === hexMatch[1]);
            if (!existing) {
              details.colors.push({
                name: nameMatch[1],
                hex: hexMatch[1],
              });
            }
          }
        }
      }
    }

    shopLogger.info('Detalhes extraídos', {
      sizes: details.sizes.length,
      colors: details.colors.length,
      hasDescription: !!details.description,
    });

    return { success: true, data: details };

  } catch (error) {
    shopLogger.error('Erro ao buscar detalhes do produto', { error: sanitizeError(error) });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar detalhes',
    };
  }
}
