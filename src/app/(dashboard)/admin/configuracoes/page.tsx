import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui';
import { SettingsTabs } from './SettingsTabs';
import type { SiteSetting } from '@/lib/config/site';

export const metadata = {
  title: 'Configuracoes | Admin',
  description: 'Personalize as configuracoes da plataforma',
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

  // Buscar logo e favicon separadamente para passar como props
  const logoSetting = settings?.find(s => s.key === 'logo_url');
  const faviconSetting = settings?.find(s => s.key === 'favicon_url');

  const logoUrl = logoSetting?.value || '/logo.png';
  const faviconUrl = faviconSetting?.value || '/favicon.svg';

  // Filtrar settings para remover logo_url e favicon_url (gerenciados separadamente)
  const textSettings = (settings || []).filter(
    s => s.key !== 'logo_url' && s.key !== 'favicon_url'
  ) as SiteSetting[];

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Configuracoes do Site"
          description="Personalize o nome, descricao e textos da sua comunidade"
        />
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">Erro ao carregar configuracoes: {error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuracoes do Site"
        description="Personalize o nome, descricao e textos da sua comunidade"
      />

      <SettingsTabs
        settings={textSettings}
        logoUrl={logoUrl}
        faviconUrl={faviconUrl}
      />
    </div>
  );
}
