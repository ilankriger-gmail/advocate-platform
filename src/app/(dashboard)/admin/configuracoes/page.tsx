'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input, Skeleton } from '@/components/ui';
import { fetchAllSiteSettings, updateMultipleSiteSettings, uploadFavicon, resetFavicon, uploadLogo, resetLogo } from '@/actions/settings';
import { getSiteSetting } from '@/lib/config/site';
import type { SiteSetting, SiteSettingKey } from '@/lib/config/site';
import Image from 'next/image';

export default function AdminConfiguraçõesPage() {
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
        title="Configurações do Site"
        description="Personalize o nome, descrição e textos da sua comunidade"
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

      {/* Logo */}
      <LogoUploader />

      {/* Favicon */}
      <FaviconUploader />

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
          Chavês de API para serviços externos. Mantenha essas informações seguras.
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
          {hasChanges ? 'Salvar Alteracoes' : 'Sem alterações'}
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

// Componente para upload de logo
function LogoUploader() {
  const [currentLogo, setCurrentLogo] = useState<string>('/logo.png');
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carregar logo atual
  useEffect(() => {
    async function loadLogo() {
      const supabase = createClient();
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();

      if (data?.value) {
        setCurrentLogo(data.value);
      }
    }
    loadLogo();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadLogo(formData);

    if (result.success && result.url) {
      setCurrentLogo(result.url);
      setMessage({ type: 'success', text: 'Logo atualizada com sucesso!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao fazer upload' });
    }

    setUploading(false);
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setMessage(null);

    const result = await resetLogo();

    if (result.success) {
      setCurrentLogo('/logo.png');
      setMessage({ type: 'success', text: 'Logo restaurada para o padrão!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao restaurar logo' });
    }

    setResetting(false);
  };

  const isCustomLogo = !currentLogo.startsWith('/');

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Logo
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        A logo que aparece no header, login e pagina de inscricao. Aceita PNG, JPG, WebP ou SVG (max 2MB).
      </p>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Preview da logo atual */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-40 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 p-2">
            {currentLogo.startsWith('/') ? (
              <Image
                src={currentLogo}
                alt="Logo atual"
                width={150}
                height={60}
                className="object-contain max-h-16"
              />
            ) : (
              <img
                src={currentLogo}
                alt="Logo atual"
                className="max-w-full max-h-16 object-contain"
              />
            )}
          </div>
          <span className="text-xs text-gray-500">
            {isCustomLogo ? 'Personalizada' : 'Padrao'}
          </span>
        </div>

        {/* Botoes de acao */}
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              uploading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
            }`}>
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Enviar nova logo
                </>
              )}
            </span>
          </label>

          {isCustomLogo && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                resetting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {resetting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Restaurando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restaurar padrao
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Componente para upload de favicon
function FaviconUploader() {
  const [currentFavicon, setCurrentFavicon] = useState<string>('/favicon.svg');
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Carregar favicon atual
  useEffect(() => {
    async function loadFavicon() {
      const supabase = createClient();
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'favicon_url')
        .single();

      if (data?.value) {
        setCurrentFavicon(data.value);
      }
    }
    loadFavicon();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadFavicon(formData);

    if (result.success && result.url) {
      setCurrentFavicon(result.url);
      setMessage({ type: 'success', text: 'Favicon atualizado com sucesso!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao fazer upload' });
    }

    setUploading(false);
    // Limpar input
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setMessage(null);

    const result = await resetFavicon();

    if (result.success) {
      setCurrentFavicon('/favicon.svg');
      setMessage({ type: 'success', text: 'Favicon restaurado para o padrão!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao restaurar favicon' });
    }

    setResetting(false);
  };

  const isCustomFavicon = currentFavicon !== '/favicon.svg';

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Favicon
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        O icone que aparece na aba do navegador. Aceita SVG, PNG ou ICO (max 500KB).
      </p>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Preview do favicon atual */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            {currentFavicon.startsWith('/') ? (
              <Image
                src={currentFavicon}
                alt="Favicon atual"
                width={48}
                height={48}
                className="object-contain"
              />
            ) : (
              <img
                src={currentFavicon}
                alt="Favicon atual"
                className="w-12 h-12 object-contain"
              />
            )}
          </div>
          <span className="text-xs text-gray-500">
            {isCustomFavicon ? 'Personalizado' : 'Padrão'}
          </span>
        </div>

        {/* Botoes de acao */}
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".svg,.png,.ico,image/svg+xml,image/png,image/x-icon"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              uploading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
            }`}>
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Enviar novo favicon
                </>
              )}
            </span>
          </label>

          {isCustomFavicon && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                resetting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {resetting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Restaurando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restaurar padrão
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
