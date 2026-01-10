'use client';

import { useState, useEffect, useTransition } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input, Skeleton } from '@/components/ui';
import { fetchAllSiteSettings, updateMultipleSiteSettings } from '@/actions/settings';
import type { SiteSetting, SiteSettingKey } from '@/lib/config/site';

// Configurações do Email 1 (aprovação)
const EMAIL_1_KEYS = [
  'email_approval_subject',
  'email_approval_greeting',
  'email_approval_message',
  'email_approval_benefits',
  'email_approval_cta',
  'email_approval_footer',
];

// Configurações do Email 2 (follow-up)
const EMAIL_2_KEYS = [
  'email_followup_subject',
  'email_followup_greeting',
  'email_followup_message',
  'email_followup_benefits',
  'email_followup_cta',
  'email_followup_footer',
];

// Todas as configurações de email
const ALL_EMAIL_KEYS = ['email_from_name', ...EMAIL_1_KEYS, ...EMAIL_2_KEYS];

// Labels amigaveis para cada campo
const FIELD_LABELS: Record<string, { label: string; description: string; placeholder: string }> = {
  // Email comum
  email_from_name: {
    label: 'Nome do Remetente',
    description: 'Nome que aparece como remetente do email',
    placeholder: 'Arena Te Amo',
  },
  // Email 1 - Aprovação
  email_approval_subject: {
    label: 'Assunto do Email',
    description: 'Use {{site_name}} para inserir o nome do site',
    placeholder: 'Voce foi aprovado para o {{site_name}}!',
  },
  email_approval_greeting: {
    label: 'Saudação',
    description: 'Use {{name}} para inserir o nome da pessoa',
    placeholder: 'Ola {{name}}!',
  },
  email_approval_message: {
    label: 'Mensagem Principal',
    description: 'Texto principal do email de aprovação',
    placeholder: 'Sua solicitação foi aprovada!',
  },
  email_approval_benefits: {
    label: 'Lista de Beneficios',
    description: 'Separe os itens por virgula',
    placeholder: 'Desafios exclusivos,Eventos especiais,Prêmios incríveis',
  },
  email_approval_cta: {
    label: 'Texto do Botao',
    description: 'Texto que aparece no botao de acao',
    placeholder: 'Criar Minha Conta',
  },
  email_approval_footer: {
    label: 'Texto do Rodape',
    description: 'Mensagem de encerramento do email',
    placeholder: 'Te esperamos lá!',
  },
  // Email 2 - Follow-up
  email_followup_subject: {
    label: 'Assunto do Email',
    description: 'Use {{site_name}} para inserir o nome do site',
    placeholder: 'Ainda da tempo de entrar no {{site_name}}!',
  },
  email_followup_greeting: {
    label: 'Saudação',
    description: 'Use {{name}} para inserir o nome da pessoa',
    placeholder: 'Ola {{name}}!',
  },
  email_followup_message: {
    label: 'Mensagem Principal',
    description: 'Texto de urgencia para quem ainda não se cadastrou',
    placeholder: 'Percebemos que você ainda não criou sua conta...',
  },
  email_followup_benefits: {
    label: 'Lista de Beneficios',
    description: 'Separe os itens por virgula',
    placeholder: 'Últimas vagas,Beneficios exclusivos,Comunidade ativa',
  },
  email_followup_cta: {
    label: 'Texto do Botao',
    description: 'Texto que aparece no botao de acao',
    placeholder: 'Criar Minha Conta Agora',
  },
  email_followup_footer: {
    label: 'Texto do Rodape',
    description: 'Mensagem de encerramento do email',
    placeholder: 'Não perca essa oportunidade!',
  },
};

type EmailTab = 'email1' | 'email2';

export default function AdminEmailsPage() {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('Arena Te Amo');
  const [activeTab, setActiveTab] = useState<EmailTab>('email1');

  useEffect(() => {
    async function loadData() {
      // Carregar configurações (auth já verificada pelo AdminAuthCheck no layout)
      const result = await fetchAllSiteSettings();

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        // Filtrar apenas as configurações de email
        const emailSettings = result.data.filter(s => ALL_EMAIL_KEYS.includes(s.key));
        setSettings(emailSettings);

        // Inicializar valores editados com todos os campos (mesmo os que nao existem no banco)
        const initialValues: Record<string, string> = {};
        ALL_EMAIL_KEYS.forEach(key => {
          const setting = emailSettings.find(s => s.key === key);
          initialValues[key] = setting?.value || '';
        });
        setEditedValues(initialValues);

        // Pegar o nome do site para o preview
        const siteNameSetting = result.data.find(s => s.key === 'site_name');
        if (siteNameSetting) {
          setSiteName(siteNameSetting.value);
        }
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Verificar alterações em configurações existentes
    const changedExisting = settings
      .filter(setting => editedValues[setting.key] !== setting.value)
      .map(setting => ({
        key: setting.key as SiteSettingKey,
        value: editedValues[setting.key],
      }));

    // Verificar configurações novas (que nao existem no banco)
    const existingKeys = settings.map(s => s.key);
    const newSettings = ALL_EMAIL_KEYS
      .filter(key => !existingKeys.includes(key) && editedValues[key])
      .map(key => ({
        key: key as SiteSettingKey,
        value: editedValues[key],
      }));

    const changedSettings = [...changedExisting, ...newSettings];

    if (changedSettings.length === 0) {
      setSuccess('Nenhuma alteracao para salvar.');
      setSaving(false);
      return;
    }

    startTransition(async () => {
      const result = await updateMultipleSiteSettings(changedSettings);

      if (result.success) {
        setSuccess(`${result.updated} configuracao(oes) atualizada(s) com sucesso!`);
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

  // Verificar se ha alterações (existentes ou novas)
  const existingKeys = settings.map(s => s.key);
  const hasExistingChanges = settings.some(
    setting => editedValues[setting.key] !== setting.value
  );
  const hasNewSettings = ALL_EMAIL_KEYS.some(
    key => !existingKeys.includes(key) && editedValues[key]
  );
  const hasChanges = hasExistingChanges || hasNewSettings;

  // Função para substituir variaveis no preview
  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{site_name\}\}/g, siteName)
      .replace(/\{\{name\}\}/g, 'Maria')
      .replace(/\{\{email\}\}/g, 'maria@exemplo.com');
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Templates de Email"
        description="Personalize o conteudo dos emails enviados pela plataforma"
      />

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

      {/* Tabs de navegacao */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('email1')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'email1'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📧 Email 1 - Aprovação
          </button>
          <button
            onClick={() => setActiveTab('email2')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'email2'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔔 Email 2 - Follow-up (24h)
          </button>
        </nav>
      </div>

      {/* Configuracao comum - Nome do Remetente */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Nome do Remetente:
          </label>
          <Input
            value={editedValues['email_from_name'] || ''}
            onChange={(e) => handleValueChange('email_from_name', e.target.value)}
            placeholder="Arena Te Amo"
            className="max-w-xs"
          />
          <span className="text-xs text-gray-500">Usado em todos os emails</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario de edição */}
        <div className="space-y-6">
          {activeTab === 'email1' ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Email de Aprovação
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enviado quando um lead e aprovado para fazer parte da comunidade.
              </p>
              <div className="space-y-4">
                {EMAIL_1_KEYS.map(key => {
                  const fieldInfo = FIELD_LABELS[key];
                  const isTextarea = key === 'email_approval_message' || key === 'email_approval_benefits';

                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {fieldInfo?.label || key}
                      </label>
                      {fieldInfo?.description && (
                        <p className="text-xs text-gray-500 mb-2">{fieldInfo.description}</p>
                      )}
                      {isTextarea ? (
                        <textarea
                          value={editedValues[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          rows={3}
                          placeholder={fieldInfo?.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                        />
                      ) : (
                        <Input
                          value={editedValues[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          placeholder={fieldInfo?.placeholder}
                          className="w-full"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="p-6 border-orange-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Email de Follow-up
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enviado 24h depois do Email 1, se o lead ainda não criou a conta.
              </p>
              <div className="space-y-4">
                {EMAIL_2_KEYS.map(key => {
                  const fieldInfo = FIELD_LABELS[key];
                  const isTextarea = key === 'email_followup_message' || key === 'email_followup_benefits';

                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {fieldInfo?.label || key}
                      </label>
                      {fieldInfo?.description && (
                        <p className="text-xs text-gray-500 mb-2">{fieldInfo.description}</p>
                      )}
                      {isTextarea ? (
                        <textarea
                          value={editedValues[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          rows={3}
                          placeholder={fieldInfo?.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                      ) : (
                        <Input
                          value={editedValues[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          placeholder={fieldInfo?.placeholder}
                          className="w-full"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Botao Salvar */}
          <div className="flex justify-end">
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

        {/* Preview do email */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Preview do {activeTab === 'email1' ? 'Email 1' : 'Email 2'}
          </h3>

          {activeTab === 'email1' ? (
            /* Preview Email 1 - Aprovação */
            <div className="border rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-center">
                <h1 className="text-white text-xl font-bold">{siteName}</h1>
              </div>
              <div className="bg-white p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  <strong>Assunto:</strong> {replaceVariables(editedValues['email_approval_subject'] || '')}
                </p>
                <hr />
                <h2 className="text-xl font-semibold text-gray-900">
                  {replaceVariables(editedValues['email_approval_greeting'] || '')}
                </h2>
                <p className="text-gray-700">
                  {replaceVariables(editedValues['email_approval_message'] || '')}
                </p>
                <p className="text-gray-700">
                  Agora você pode criar sua conta na plataforma e participar de:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {(editedValues['email_approval_benefits'] || '').split(',').map((benefit, i) => (
                    <li key={i}>{benefit.trim()}</li>
                  ))}
                </ul>
                <div className="text-center py-4">
                  <span className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold">
                    {editedValues['email_approval_cta'] || 'Criar Minha Conta'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Use o email <strong>maria@exemplo.com</strong> para criar sua conta.
                </p>
              </div>
              <div className="bg-gray-50 p-4 text-center border-t">
                <p className="text-gray-500 text-sm">
                  {editedValues['email_approval_footer'] || 'Te esperamos lá!'}<br />
                  <strong className="text-pink-500">Equipe {siteName}</strong>
                </p>
              </div>
            </div>
          ) : (
            /* Preview Email 2 - Follow-up */
            <div className="border border-orange-200 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-center">
                <h1 className="text-white text-xl font-bold">{siteName}</h1>
                <p className="text-orange-100 text-sm mt-1">Não perca essa oportunidade!</p>
              </div>
              <div className="bg-white p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  <strong>Assunto:</strong> {replaceVariables(editedValues['email_followup_subject'] || '')}
                </p>
                <hr />
                <h2 className="text-xl font-semibold text-gray-900">
                  {replaceVariables(editedValues['email_followup_greeting'] || '')}
                </h2>
                <p className="text-gray-700">
                  {replaceVariables(editedValues['email_followup_message'] || '')}
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 font-medium mb-2">
                    O que você está perdendo:
                  </p>
                  <ul className="list-disc list-inside text-orange-700 space-y-1">
                    {(editedValues['email_followup_benefits'] || '').split(',').map((benefit, i) => (
                      <li key={i}>{benefit.trim()}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-center py-4">
                  <span className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg">
                    {editedValues['email_followup_cta'] || 'Criar Minha Conta Agora'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Use o email <strong>maria@exemplo.com</strong> para criar sua conta.
                </p>
              </div>
              <div className="bg-orange-50 p-4 text-center border-t border-orange-200">
                <p className="text-orange-700 text-sm">
                  {editedValues['email_followup_footer'] || 'Não perca essa oportunidade!'}<br />
                  <strong className="text-orange-600">Equipe {siteName}</strong>
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Preview com dados de exemplo. Variaveis como {'{{name}}'} serao substituidas pelos dados reais.
          </p>
        </div>
      </div>
    </div>
  );
}
