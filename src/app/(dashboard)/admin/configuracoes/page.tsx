'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input, Skeleton } from '@/components/ui';
import { fetchAllSiteSettings, updateMultipleSiteSettings } from '@/actions/settings';
import type { SiteSetting, SiteSettingKey } from '@/lib/config/site';

export default function AdminConfiguracoesPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Verificar autenticação e carregar dados
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Verificar se é admin ou creator
      const { data: profile } = await supabase
        .from('users')
        .select('role, is_creator')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin' && !profile?.is_creator) {
        router.push('/');
        return;
      }

      // Carregar configurações
      const result = await fetchAllSiteSettings();

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setSettings(result.data);
        // Inicializar valores editados
        const initialValues: Record<string, string> = {};
        result.data.forEach(setting => {
          initialValues[setting.key] = setting.value;
        });
        setEditedValues(initialValues);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Criar lista de configurações alteradas
    const changedSettings = settings
      .filter(setting => editedValues[setting.key] !== setting.value)
      .map(setting => ({
        key: setting.key as SiteSettingKey,
        value: editedValues[setting.key],
      }));

    if (changedSettings.length === 0) {
      setSuccess('Nenhuma alteração para salvar.');
      setSaving(false);
      return;
    }

    startTransition(async () => {
      const result = await updateMultipleSiteSettings(changedSettings);

      if (result.success) {
        setSuccess(`${result.updated} configuração(ões) atualizada(s) com sucesso!`);
        // Atualizar valores originais
        setSettings(prev =>
          prev.map(setting => ({
            ...setting,
            value: editedValues[setting.key],
          }))
        );
      } else {
        setError(result.error || 'Erro ao salvar configurações');
      }

      setSaving(false);
    });
  };

  const hasChanges = settings.some(
    setting => editedValues[setting.key] !== setting.value
  );

  // Agrupar configurações por categoria
  const groupedSettings = {
    branding: settings.filter(s =>
      ['site_name', 'site_description', 'creator_name', 'creator_handle'].includes(s.key)
    ),
    hero: settings.filter(s =>
      ['hero_title', 'hero_subtitle'].includes(s.key)
    ),
    login: settings.filter(s =>
      ['login_title', 'login_subtitle'].includes(s.key)
    ),
    seo: settings.filter(s =>
      ['meta_title', 'meta_description'].includes(s.key)
    ),
    apis: settings.filter(s =>
      ['openai_api_key', 'resend_api_key', 'meta_pixel_id', 'meta_access_token', 'whatsapp_phone_number_id', 'whatsapp_access_token'].includes(s.key)
    ),
    outros: settings.filter(s =>
      ['email_from_name', 'footer_text'].includes(s.key)
    ),
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuracoes do Site"
        description="Personalize o nome, descricao e textos da sua comunidade"
      />

      {/* Mensagens de feedback */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-green-700">{success}</p>
        </Card>
      )}

      {/* Branding */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Marca e Identidade
        </h2>
        <div className="space-y-4">
          {groupedSettings.branding.map(setting => (
            <SettingField
              key={setting.key}
              setting={setting}
              value={editedValues[setting.key] || ''}
              onChange={(value) => handleValueChange(setting.key, value)}
            />
          ))}
        </div>
      </Card>

      {/* Hero Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pagina Inicial (Hero)
        </h2>
        <div className="space-y-4">
          {groupedSettings.hero.map(setting => (
            <SettingField
              key={setting.key}
              setting={setting}
              value={editedValues[setting.key] || ''}
              onChange={(value) => handleValueChange(setting.key, value)}
            />
          ))}
        </div>
      </Card>

      {/* Login */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pagina de Login
        </h2>
        <div className="space-y-4">
          {groupedSettings.login.map(setting => (
            <SettingField
              key={setting.key}
              setting={setting}
              value={editedValues[setting.key] || ''}
              onChange={(value) => handleValueChange(setting.key, value)}
            />
          ))}
        </div>
      </Card>

      {/* SEO */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          SEO (Mecanismos de Busca)
        </h2>
        <div className="space-y-4">
          {groupedSettings.seo.map(setting => (
            <SettingField
              key={setting.key}
              setting={setting}
              value={editedValues[setting.key] || ''}
              onChange={(value) => handleValueChange(setting.key, value)}
            />
          ))}
        </div>
      </Card>

      {/* APIs e Integrações */}
      <Card className="p-6 border-amber-200 bg-amber-50/30">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          APIs e Integracoes
        </h2>
        <p className="text-sm text-amber-700 mb-4">
          Chaves de API para servicos externos. Mantenha essas informacoes seguras.
        </p>
        <div className="space-y-4">
          {groupedSettings.apis.map(setting => (
            <SettingField
              key={setting.key}
              setting={setting}
              value={editedValues[setting.key] || ''}
              onChange={(value) => handleValueChange(setting.key, value)}
              isSecret
            />
          ))}
        </div>
      </Card>

      {/* Outros */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Outros
        </h2>
        <div className="space-y-4">
          {groupedSettings.outros.map(setting => (
            <SettingField
              key={setting.key}
              setting={setting}
              value={editedValues[setting.key] || ''}
              onChange={(value) => handleValueChange(setting.key, value)}
            />
          ))}
        </div>
      </Card>

      {/* Botao Salvar (fixo no rodape) */}
      <div className="sticky bottom-4 flex justify-end gap-4 p-4 bg-white rounded-lg shadow-lg border">
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={saving || isPending}
          disabled={!hasChanges || saving || isPending}
        >
          {hasChanges ? 'Salvar Alteracoes' : 'Sem alteracoes'}
        </Button>
      </div>
    </div>
  );
}

// Componente para campo de configuracao
function SettingField({
  setting,
  value,
  onChange,
  isSecret = false,
}: {
  setting: SiteSetting;
  value: string;
  onChange: (value: string) => void;
  isSecret?: boolean;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const isTextarea = setting.field_type === 'textarea';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {setting.label || setting.key}
      </label>
      {setting.description && (
        <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
      )}
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
      ) : isSecret ? (
        <div className="relative">
          <Input
            type={showSecret ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pr-10"
            placeholder="sk-..."
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showSecret ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      )}
    </div>
  );
}
