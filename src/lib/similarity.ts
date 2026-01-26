/**
 * Utilitários para detecção de similaridade de conteúdo
 * Usado para filtrar posts duplicados ou muito parecidos do feed
 */

/**
 * Remove acentos, pontuação e normaliza texto para comparação
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

/**
 * Extrai palavras significativas (remove stop words comuns)
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'a', 'o', 'e', 'de', 'da', 'do', 'em', 'um', 'uma', 'para', 'com',
    'que', 'na', 'no', 'os', 'as', 'por', 'se', 'ao', 'ou', 'mas',
    'foi', 'ser', 'tem', 'seu', 'sua', 'mais', 'como', 'quando',
    'muito', 'nos', 'ja', 'eu', 'tambem', 'so', 'pelo', 'pela',
    'ate', 'isso', 'ela', 'ele', 'entre', 'depois', 'sem', 'mesmo',
    'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles',
    'voce', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu',
    'the', 'is', 'are', 'was', 'be', 'to', 'of', 'and', 'in', 'that',
    'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
  ]);

  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter(w => w.length > 2);
  return words.filter(w => !stopWords.has(w));
}

/**
 * Calcula similaridade de Jaccard entre dois conjuntos de palavras
 * Retorna valor entre 0 (nada similar) e 1 (idêntico)
 */
function jaccardSimilarity(set1: string[], set2: string[]): number {
  if (set1.length === 0 && set2.length === 0) return 1;
  if (set1.length === 0 || set2.length === 0) return 0;

  const s1 = new Set(set1);
  const s2 = new Set(set2);

  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);

  return intersection.size / union.size;
}

/**
 * Calcula similaridade entre dois textos
 * Retorna valor entre 0 (nada similar) e 1 (idêntico)
 */
export function calculateSimilarity(text1: string, text2: string): number {
  // Textos muito curtos: comparação direta
  if (text1.length < 20 || text2.length < 20) {
    const n1 = normalizeText(text1);
    const n2 = normalizeText(text2);
    return n1 === n2 ? 1 : 0;
  }

  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);

  // Se um dos textos não tem palavras significativas
  if (keywords1.length === 0 || keywords2.length === 0) {
    return 0;
  }

  return jaccardSimilarity(keywords1, keywords2);
}

/**
 * Verifica se dois posts são similares demais
 * Considera título + conteúdo
 */
export function arePostsSimilar(
  post1: { title?: string | null; content?: string | null },
  post2: { title?: string | null; content?: string | null },
  threshold: number = 0.6 // 60% de similaridade
): boolean {
  const text1 = `${post1.title || ''} ${post1.content || ''}`.trim();
  const text2 = `${post2.title || ''} ${post2.content || ''}`.trim();

  if (!text1 || !text2) return false;

  const similarity = calculateSimilarity(text1, text2);
  return similarity >= threshold;
}

/**
 * Verifica se dois posts têm imagens em comum
 */
function hasMatchingMedia(
  media1: string[] | null | undefined,
  media2: string[] | null | undefined
): boolean {
  if (!media1 || !media2 || media1.length === 0 || media2.length === 0) return false;
  const set2 = new Set(media2);
  return media1.some(url => set2.has(url));
}

/**
 * Filtra posts duplicados/similares de uma lista
 * Só filtra duplicatas do MESMO USUÁRIO (texto similar OU mesma imagem)
 * Mantém o mais antigo (primeiro a aparecer) e remove os similares
 */
export function filterSimilarPosts<T extends { 
  id: string; 
  title?: string | null; 
  content?: string | null; 
  created_at?: string | null;
  user_id?: string | null;
  media_url?: string[] | null;
}>(
  posts: T[],
  threshold: number = 0.5
): T[] {
  if (posts.length <= 1) return posts;

  // Ordenar por data (mais antigos primeiro) para manter o original
  const sorted = [...posts].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });

  const filtered: T[] = [];
  // Agrupar posts aceitos por usuário para comparação eficiente
  const seenByUser = new Map<string, Array<{ title?: string | null; content?: string | null; media_url?: string[] | null }>>();

  for (const post of sorted) {
    const userId = post.user_id || 'unknown';
    const userSeen = seenByUser.get(userId) || [];
    
    // Verificar se é similar a algum post do MESMO usuário já aceito
    const isDuplicate = userSeen.some(seen => {
      // Mesma imagem?
      if (hasMatchingMedia(post.media_url, seen.media_url)) return true;
      // Texto similar?
      return arePostsSimilar(post, seen, threshold);
    });

    if (!isDuplicate) {
      filtered.push(post);
      userSeen.push({ 
        title: post.title ?? null, 
        content: post.content ?? null,
        media_url: post.media_url ?? null
      });
      seenByUser.set(userId, userSeen);
    }
  }

  // Reordenar pela ordem original (para manter a ordenação do feed)
  const originalOrder = new Map(posts.map((p, i) => [p.id, i]));
  return filtered.sort((a, b) => {
    const orderA = originalOrder.get(a.id) ?? 0;
    const orderB = originalOrder.get(b.id) ?? 0;
    return orderA - orderB;
  });
}

/**
 * Gera hash simples do conteúdo para detecção rápida de duplicatas exatas
 */
export function generateContentHash(text: string): string {
  const normalized = normalizeText(text);
  // Hash simples usando soma de códigos de caracteres
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para 32bit integer
  }
  return hash.toString(36);
}
