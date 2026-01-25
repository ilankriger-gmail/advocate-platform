import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui';
import { SettingsTabs } from './SettingsTabs';
import type { SiteSetting } from '@/lib/config/site';


export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Configurações | Admin',
  description: 'Personalize as configurações da plataforma',
};

/**
 * Pagina de Configuracoes do Admin
 * Server Component - dados buscados no servidor
 * Auth verificada pelo AdminAuthCheck no layout pai
 */
export default async function AdminConfiguracoesPage() {
  const supabase = await createClient();

  // Buscar todas as configuracoes
  const { data: settings, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('key');

  // Buscar logo, favicon e avatar do criador separadamente para passar como props
  const logoSetting = settings?.find(s => s.key === 'logo_url');
  const faviconSetting = settings?.find(s => s.key === 'favicon_url');
  const creatorAvatarSetting = settings?.find(s => s.key === 'creator_avatar_url');

  const logoUrl = logoSetting?.value || '/logo.png';
  const faviconUrl = faviconSetting?.value || '/favicon.svg';
  const creatorAvatarUrl = creatorAvatarSetting?.value || '';

  // Filtrar settings para remover imagens (gerenciadas separadamente)
  const textSettings = (settings || []).filter(
    s => s.key !== 'logo_url' && s.key !== 'favicon_url' && s.key !== 'creator_avatar_url'
  ) as SiteSetting[];

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Configurações do Site"
          description="Personalize o nome, descrição e textos da sua comunidade"
        />
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">Erro ao carregar configurações: {error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações do Site"
        description="Personalize o nome, descrição e textos da sua comunidade"
      />

      <SettingsTabs
        settings={textSettings}
        logoUrl={logoUrl}
        faviconUrl={faviconUrl}
        creatorAvatarUrl={creatorAvatarUrl}
      />
    </div>
  );
}
