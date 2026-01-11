'use client';

import { useState, useTransition } from 'react';
import { Card, Button } from '@/components/ui';
import { updateMultipleSiteSettings } from '@/actions/settings';
import type { SiteSetting, SiteSettingKey } from '@/lib/config/site';

interface SeoSettingsProps {
  initialSettings: SiteSetting[];
}

// Estrutura das paginas para SEO
interface SeoPage {
  name: string;
  path: string;
  titleKey: SiteSettingKey;
  descriptionKey: SiteSettingKey;
}

// Paginas estaticas
const STATIC_PAGES: SeoPage[] = [
  { name: 'Home', path: '/', titleKey: 'seo_home_title', descriptionKey: 'seo_home_description' },
  { name: 'Eventos', path: '/eventos', titleKey: 'seo_eventos_title', descriptionKey: 'seo_eventos_description' },
  { name: 'Desafios', path: '/desafios', titleKey: 'seo_desafios_title', descriptionKey: 'seo_desafios_description' },
  { name: 'Ranking', path: '/ranking', titleKey: 'seo_ranking_title', descriptionKey: 'seo_ranking_description' },
  { name: 'Premios', path: '/premios', titleKey: 'seo_premios_title', descriptionKey: 'seo_premios_description' },
  { name: 'Login', path: '/login', titleKey: 'seo_login_title', descriptionKey: 'seo_login_description' },
  { name: 'Registro', path: '/registro', titleKey: 'seo_registro_title', descriptionKey: 'seo_registro_description' },
  { name: 'Seja Arena', path: '/seja-arena', titleKey: 'seo_seja_arena_title', descriptionKey: 'seo_seja_arena_description' },
];

// Templates dinamicos
const DYNAMIC_TEMPLATES: SeoPage[] = [
  { name: 'Pagina de Evento', path: '/eventos/[id]', titleKey: 'seo_evento_title_template', descriptionKey: 'seo_evento_description_template' },
  { name: 'Pagina de Desafio', path: '/desafios/[id]', titleKey: 'seo_desafio_title_template', descriptionKey: 'seo_desafio_description_template' },
];

/**
 * Componente para configuracoes de SEO por pagina
 */
export function SeoSettings({ initialSettings }: SeoSettingsProps) {
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

  const getValue = (key: SiteSettingKey): string => {
    return editedValues[key] || '';
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

      {/* Paginas Estaticas */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📄</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Paginas Estaticas</h2>
            <p className="text-sm text-gray-500">SEO das paginas principais do site</p>
          </div>
        </div>

        <div className="space-y-6">
          {STATIC_PAGES.map(page => (
            <div key={page.path} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-medium text-gray-900">{page.name}</h3>
                <span className="text-xs text-gray-400 font-mono bg-gray-200 px-2 py-0.5 rounded">
                  {page.path}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titulo
                  </label>
                  <input
                    type="text"
                    value={getValue(page.titleKey)}
                    onChange={(e) => handleValueChange(page.titleKey, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={`Titulo da pagina ${page.name}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descricao
                  </label>
                  <textarea
                    value={getValue(page.descriptionKey)}
                    onChange={(e) => handleValueChange(page.descriptionKey, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    placeholder={`Descricao da pagina ${page.name} (max 160 caracteres)`}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {getValue(page.descriptionKey).length}/160 caracteres
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Templates Dinamicos */}
      <Card className="p-6 border-blue-200 bg-blue-50/30">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📝</span>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Templates Dinamicos</h2>
            <p className="text-sm text-gray-500">SEO para paginas com conteudo dinamico</p>
          </div>
        </div>

        <div className="p-3 bg-blue-100 rounded-lg mb-4">
          <p className="text-sm text-blue-800">
            <strong>Variaveis disponiveis:</strong> Use <code className="bg-blue-200 px-1 rounded">{'{{titulo}}'}</code> e{' '}
            <code className="bg-blue-200 px-1 rounded">{'{{descricao}}'}</code> para inserir dados dinamicos do conteudo.
          </p>
        </div>

        <div className="space-y-6">
          {DYNAMIC_TEMPLATES.map(page => (
            <div key={page.path} className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-medium text-gray-900">{page.name}</h3>
                <span className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-0.5 rounded">
                  {page.path}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template do Titulo
                  </label>
                  <input
                    type="text"
                    value={getValue(page.titleKey)}
                    onChange={(e) => handleValueChange(page.titleKey, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: {{titulo}} | Eventos Arena Te Amo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template da Descricao
                  </label>
                  <textarea
                    value={getValue(page.descriptionKey)}
                    onChange={(e) => handleValueChange(page.descriptionKey, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    placeholder="Ex: {{descricao}}"
                  />
                </div>
              </div>
            </div>
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
