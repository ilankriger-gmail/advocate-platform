'use server';

import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

type SlugTable = 'challenges' | 'events' | 'rewards';

/**
 * Verifica se um slug já existe em uma tabela
 */
export async function checkSlugExists(
  slug: string,
  table: SlugTable,
  excludeId?: string
): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase.from(table).select('id').eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * Gera um slug único para uma tabela
 * Se o slug base já existir, adiciona sufixo numérico (-1, -2, etc)
 */
export async function generateUniqueSlug(
  title: string,
  table: SlugTable,
  excludeId?: string
): Promise<string> {
  const baseSlug = slugify(title);

  // Verificar se o slug base está disponível
  const exists = await checkSlugExists(baseSlug, table, excludeId);
  if (!exists) {
    return baseSlug;
  }

  // Tentar com sufixos numéricos
  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;

  while (await checkSlugExists(newSlug, table, excludeId)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;

    // Segurança: limitar tentativas
    if (counter > 100) {
      // Usar timestamp como fallback
      return `${baseSlug}-${Date.now()}`;
    }
  }

  return newSlug;
}

/**
 * Busca o slug de um registro pelo ID
 */
export async function getSlugById(
  table: SlugTable,
  id: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from(table)
    .select('slug')
    .eq('id', id)
    .single();

  return data?.slug ?? null;
}

/**
 * Busca o ID de um registro pelo slug
 */
export async function getIdBySlug(
  table: SlugTable,
  slug: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from(table)
    .select('id')
    .eq('slug', slug)
    .single();

  return data?.id ?? null;
}

/**
 * Valida formato de slug (apenas letras, números e hífens)
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}
