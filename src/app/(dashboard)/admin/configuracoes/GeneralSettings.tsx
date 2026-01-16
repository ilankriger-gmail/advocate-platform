'use client';

import { useState, useTransition } from 'react';
import { Card, Button } from '@/components/ui';
import { updateMultipleSiteSettings } from '@/actions/settings';
import { SettingField } from './SettingField';
import type { SiteSetting, SiteSettingKey } from '@/lib/config/site';

interface GeneralSettingsProps {
  initialSettings: SiteSetting[];
}

// Tipo para categorias
interface Category {
  title: string;
  keys: string[];
  description?: string;
  isSecret?: boolean;
  className?: string;
}

// Categorias de configuracoes
const CATEGORIES: Record<string, Category> = {
  branding: {
    title: 'Marca e Identidade',
    keys: ['site_name', 'site_description', 'creator_name', 'creator_handle'],
  },
  hero: {
    title: 'Pagina Inicial (Hero)',
    keys: ['hero_title', 'hero_subtitle'],
  },
  login: {
    title: 'Pagina de Login',
    keys: ['login_title', 'login_subtitle'],
  },
  seo: {
    title: 'SEO (Mecanismos de Busca)',
    keys: ['meta_title', 'meta_description'],
  },
  apis_ai: {
    title: 'Inteligência Artificial',
    description: 'APIs para análise de vídeos, geração de thumbnails e análise de leads.',
    keys: ['openai_api_key', 'gemini_api_key', 'perspective_api_key'],
    isSecret: true,
    className: 'border-purple-200 bg-purple-50/30',
  },
  apis_email: {
    title: 'Email (Resend)',
    description: 'Configurações para envio de emails transacionais.',
    keys: ['resend_api_key', 'resend_from_email'],
    isSecret: true,
    className: 'border-blue-200 bg-blue-50/30',
  },
  apis_whatsapp: {
    title: 'WhatsApp (Meta)',
    description: 'Configurações para envio de mensagens WhatsApp.',
    keys: ['whatsapp_phone_number_id', 'whatsapp_access_token', 'whatsapp_app_secret', 'whatsapp_webhook_verify_token'],
    isSecret: true,
    className: 'border-green-200 bg-green-50/30',
  },
  apis_youtube: {
    title: 'YouTube',
    description: 'Configurações para integração com YouTube.',
    keys: ['youtube_api_key', 'youtube_channel_handle'],
    isSecret: true,
    className: 'border-red-200 bg-red-50/30',
  },
  apis_meta: {
    title: 'Meta Pixel',
    description: 'Configurações para rastreamento de conversões.',
    keys: ['meta_pixel_id', 'meta_access_token'],
    isSecret: true,
    className: 'border-amber-200 bg-amber-50/30',
  },
  outros: {
    title: 'Outros',
    keys: ['email_from_name', 'footer_text'],
  },
};

/**
 * Componente para configuracoes gerais (texto)
 */
export function GeneralSettings({ initialSettings }: GeneralSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState<SiteSetting[]>(initialSettings);
  const [editedValues, setEditedValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    initialSettings.forEach(s => {
      initial[s.key] = s.value;
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Criar lista de configuracoes alteradas
    const changedSettings = settings
      .filter(setting => editedValues[setting.key] !== setting.value)
      .map(setting => ({
        key: setting.key as SiteSettingKey,
        value: editedValues[setting.key],
      }));

    if (changedSettings.length === 0) {
      setSuccess('Nenhuma alteracao para salvar.');
      setSaving(false);
      return;
    }

    startTransition(async () => {
      const result = await updateMultipleSiteSettings(changedSettings);

      if (result.success) {
        setSuccess(`${result.updated} configuracao(oes) atualizada(s) com sucesso!`);
        // Atualizar valores originais
        setSettings(prev =>
          prev.map(setting => ({
            ...setting,
            value: editedValues[setting.key],
          }))
        );
      } else {
        setError(result.error || 'Erro ao salvar configuracoes');
      }

      setSaving(false);
    });
  };

  const hasChanges = settings.some(
    setting => editedValues[setting.key] !== setting.value
  );

  // Agrupar settings por categoria
  const getSettingsForCategory = (keys: readonly string[]) => {
    return settings.filter(s => keys.includes(s.key));
  };

  return (
    <div className="space-y-6">
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

      {/* Categorias de configuracoes */}
      {Object.entries(CATEGORIES).map(([key, category]) => {
        const categorySettings = getSettingsForCategory(category.keys);
        if (categorySettings.length === 0) return null;

        return (
          <Card key={key} className={`p-6 ${category.className || ''}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {category.title}
            </h2>
            {category.description && (
              <p className="text-sm text-amber-700 mb-4">
                {category.description}
              </p>
            )}
            <div className="space-y-4">
              {categorySettings.map(setting => (
                <SettingField
                  key={setting.key}
                  setting={setting}
                  value={editedValues[setting.key] || ''}
                  onChange={(value) => handleValueChange(setting.key, value)}
                  isSecret={category.isSecret}
                />
              ))}
            </div>
          </Card>
        );
      })}

      {/* Botao Salvar (fixo no rodape) */}
      <div className="sticky bottom-4 flex justify-end gap-4 p-4 bg-white rounded-lg shadow-lg border">
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={saving || isPending}
          disabled={!hasChanges || saving || isPending}
        >
          {hasChanges ? 'Salvar Alterações' : 'Sem alterações'}
        </Button>
      </div>
    </div>
  );
}
