import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

/**
 * Chavês de configuração disponíveis no sistema
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
  | 'favicon_url'
  | 'logo_url'
  // Email 2 (follow-up)
  | 'email_followup_subject'
  | 'email_followup_greeting'
  | 'email_followup_message'
  | 'email_followup_benefits'
  | 'email_followup_cta'
  | 'email_followup_footer'
  // SEO - Páginas estáticas
  | 'seo_home_title'
  | 'seo_home_description'
  | 'seo_eventos_title'
  | 'seo_eventos_description'
  | 'seo_desafios_title'
  | 'seo_desafios_description'
  | 'seo_ranking_title'
  | 'seo_ranking_description'
  | 'seo_premios_title'
  | 'seo_premios_description'
  | 'seo_login_title'
  | 'seo_login_description'
  | 'seo_registro_title'
  | 'seo_registro_description'
  | 'seo_seja_arena_title'
  | 'seo_seja_arena_description'
  // SEO - Templates dinâmicos
  | 'seo_evento_title_template'
  | 'seo_evento_description_template'
  | 'seo_desafio_title_template'
  | 'seo_desafio_description_template'
  // NPS Auto-Aprovacao
  | 'nps_auto_approval_enabled'
  | 'nps_auto_approval_min_score';

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
  site_description: 'Comunidade oficial do O Moço do Te Amo | NextlevelDJ',
  creator_name: 'O Moço do Te Amo',
  creator_handle: 'NextlevelDJ',
  hero_title: 'Arena Te Amo',
  hero_subtitle: 'Comunidade oficial do O Moço do Te Amo | NextlevelDJ',
  login_title: 'Arena Te Amo',
  login_subtitle: 'Comunidade oficial do O Moço do Te Amo',
  meta_title: 'Arena Te Amo - Comunidade O Moço do Te Amo',
  meta_description: 'Comunidade oficial do O Moço do Te Amo | NextlevelDJ',
  email_from_name: 'Arena Te Amo',
  footer_text: 'O Moço do Te Amo - Arena Te Amo',
  // Chavês de API (sem valor padrão - devem ser configuradas no banco)
  openai_api_key: '',
  resend_api_key: '',
  meta_pixel_id: '',
  meta_access_token: '',
  whatsapp_phone_number_id: '',
  whatsapp_access_token: '',
  // Email de aprovação
  email_approval_subject: 'Você foi aprovado para o {{site_name}}!',
  email_approval_greeting: 'Olá {{name}}!',
  email_approval_message: 'Temos uma ótima notícia! Sua solicitação para fazer parte da comunidade foi APROVADA!',
  email_approval_benefits: 'Desafios exclusivos,Eventos especiais,Prêmios incríveis,Conteúdos exclusivos',
  email_approval_cta: 'Criar Minha Conta',
  email_approval_footer: 'Te esperamos lá!',
  // Favicon
  favicon_url: '/favicon.svg',
  logo_url: '/logo.png',
  // Email 2 (follow-up)
  email_followup_subject: 'Ainda dá tempo de entrar no {{site_name}}!',
  email_followup_greeting: 'Olá {{name}}!',
  email_followup_message: 'Percebemos que você ainda não criou sua conta na nossa comunidade. Essa é sua última chance de garantir acesso a conteúdos exclusivos, desafios e prêmios incríveis!',
  email_followup_benefits: 'Conteúdos exclusivos do criador,Desafios com prêmios reais,Comunidade engajada,Acesso antecipado a novidades',
  email_followup_cta: 'Criar Minha Conta Agora',
  email_followup_footer: 'Não perca essa oportunidade única!',
  // SEO - Páginas estáticas
  seo_home_title: 'Arena Te Amo - Comunidade Oficial',
  seo_home_description: 'Participe da comunidade oficial do O Moço do Te Amo. Eventos exclusivos, desafios e prêmios!',
  seo_eventos_title: 'Eventos',
  seo_eventos_description: 'Participe de eventos exclusivos da comunidade Arena Te Amo. Encontros, lives, workshops e muito mais!',
  seo_desafios_title: 'Desafios',
  seo_desafios_description: 'Participe dos desafios da comunidade Arena Te Amo e ganhe corações, prêmios em Pix e recompensas exclusivas!',
  seo_ranking_title: 'Ranking',
  seo_ranking_description: 'Veja quem são os maiores fãs da comunidade Arena Te Amo. Suba no ranking e ganhe recompensas!',
  seo_premios_title: 'Prêmios',
  seo_premios_description: 'Troque seus corações por prêmios exclusivos na comunidade Arena Te Amo.',
  seo_login_title: 'Entrar',
  seo_login_description: 'Faça login na comunidade Arena Te Amo e participe de eventos, desafios e muito mais!',
  seo_registro_title: 'Criar Conta',
  seo_registro_description: 'Crie sua conta na comunidade Arena Te Amo e comece a participar de eventos e desafios exclusivos!',
  seo_seja_arena_title: 'Seja Arena',
  seo_seja_arena_description: 'Avalie sua experiência e faça parte da comunidade Arena Te Amo.',
  // SEO - Templates dinâmicos
  seo_evento_title_template: '{{titulo}} | Eventos',
  seo_evento_description_template: '{{descricao}}',
  seo_desafio_title_template: '{{titulo}} | Desafios',
  seo_desafio_description_template: '{{descricao}}',
  // NPS Auto-Aprovacao
  nps_auto_approval_enabled: 'true',
  nps_auto_approval_min_score: '70',
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
    // Durante build estático, cookies não estão disponíveis
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
    // Durante build estático, cookies não estão disponíveis
    return [];
  }
});

/**
 * Busca múltiplas configurações de uma vez (otimizado)
 * Use em Server Components
 * Retorna valores padrão durante build estático (sem cookies)
 */
export const getSiteSettings = cache(async (keys: SiteSettingKey[]): Promise<Record<SiteSettingKey, string>> => {
  // Retorna defaults - durante build ou se não houver banco
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
    // Durante build estático, cookies não estão disponíveis
    // Retorna valores padrão silenciosamente
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
