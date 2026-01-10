import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

/**
 * Chaves de configuração disponíveis no sistema
 */
export type SiteSettingKey =
  | 'site_name'
  | 'site_description'
  | 'creator_name'
  | 'creator_handle'
  | 'hero_title'
  | 'hero_subtitle'
  | 'login_title'
  | 'login_subtitle'
  | 'meta_title'
  | 'meta_description'
  | 'email_from_name'
  | 'footer_text'
  | 'openai_api_key'
  | 'resend_api_key'
  | 'meta_pixel_id'
  | 'meta_access_token'
  | 'whatsapp_phone_number_id'
  | 'whatsapp_access_token'
  | 'email_approval_subject'
  | 'email_approval_greeting'
  | 'email_approval_message'
  | 'email_approval_benefits'
  | 'email_approval_cta'
  | 'email_approval_footer'
  | 'favicon_url';

/**
 * Tipo para uma configuração do site
 */
export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  label: string | null;
  description: string | null;
  field_type: string;
  created_at: string;
  updated_at: string;
}

/**
 * Valores padrão caso o banco não tenha a configuração
 */
const DEFAULT_VALUES: Record<SiteSettingKey, string> = {
  site_name: 'Arena Te Amo',
  site_description: 'Comunidade oficial de O Moço do Te Amo | NextlevelDJ',
  creator_name: 'O Moço do Te Amo',
  creator_handle: 'NextlevelDJ',
  hero_title: 'Arena Te Amo',
  hero_subtitle: 'Comunidade oficial de O Moço do Te Amo | NextlevelDJ',
  login_title: 'Arena Te Amo',
  login_subtitle: 'Comunidade oficial de O Moço do Te Amo',
  meta_title: 'Arena Te Amo - Comunidade O Moço do Te Amo',
  meta_description: 'Comunidade oficial de O Moço do Te Amo | NextlevelDJ',
  email_from_name: 'Arena Te Amo',
  footer_text: 'O Moço do Te Amo - Arena Te Amo',
  // Chaves de API (sem valor padrao - devem ser configuradas no banco)
  openai_api_key: '',
  resend_api_key: '',
  meta_pixel_id: '',
  meta_access_token: '',
  whatsapp_phone_number_id: '',
  whatsapp_access_token: '',
  // Email de aprovacao
  email_approval_subject: 'Voce foi aprovado para o {{site_name}}!',
  email_approval_greeting: 'Ola {{name}}!',
  email_approval_message: 'Temos uma otima noticia! Sua solicitacao para fazer parte da comunidade foi APROVADA!',
  email_approval_benefits: 'Desafios exclusivos,Eventos especiais,Premios incriveis,Conteudos exclusivos',
  email_approval_cta: 'Criar Minha Conta',
  email_approval_footer: 'Te esperamos la!',
  // Favicon
  favicon_url: '/favicon.svg',
};

/**
 * Retorna o valor padrão para uma chave
 */
export function getDefaultValue(key: SiteSettingKey): string {
  return DEFAULT_VALUES[key] || '';
}

/**
 * Busca uma configuração específica do site (com cache do React)
 * Use em Server Components
 * Retorna valor padrão durante build estático (sem cookies)
 */
export const getSiteSetting = cache(async (key: SiteSettingKey): Promise<string> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) {
      return getDefaultValue(key);
    }

    return data.value;
  } catch {
    // Durante build estatico, cookies nao estao disponiveis
    return getDefaultValue(key);
  }
});

/**
 * Busca todas as configurações do site (com cache do React)
 * Use em Server Components
 * Retorna array vazio durante build estático (sem cookies)
 */
export const getAllSiteSettings = cache(async (): Promise<SiteSetting[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('key');

    if (error) {
      return [];
    }

    return (data as SiteSetting[]) || [];
  } catch {
    // Durante build estatico, cookies nao estao disponiveis
    return [];
  }
});

/**
 * Busca múltiplas configurações de uma vez (otimizado)
 * Use em Server Components
 * Retorna valores padrão durante build estático (sem cookies)
 */
export const getSiteSettings = cache(async (keys: SiteSettingKey[]): Promise<Record<SiteSettingKey, string>> => {
  // Retorna defaults - durante build ou se nao houver banco
  const getDefaults = () => keys.reduce((acc, key) => {
    acc[key] = getDefaultValue(key);
    return acc;
  }, {} as Record<SiteSettingKey, string>);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', keys);

    if (error) {
      // Retorna valores padrão silenciosamente
      return getDefaults();
    }

    // Monta objeto com valores do banco ou padrão
    const result = keys.reduce((acc, key) => {
      const found = data?.find(item => item.key === key);
      acc[key] = found?.value || getDefaultValue(key);
      return acc;
    }, {} as Record<SiteSettingKey, string>);

    return result;
  } catch {
    // Durante build estatico, cookies nao estao disponiveis
    // Retorna valores padrao silenciosamente
    return getDefaults();
  }
});

/**
 * Helper para gerar metadata dinâmico
 */
export async function generateSiteMetadata() {
  const settings = await getSiteSettings(['meta_title', 'meta_description']);

  return {
    title: settings.meta_title,
    description: settings.meta_description,
  };
}
