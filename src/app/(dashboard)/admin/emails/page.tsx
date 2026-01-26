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

// Configurações do Email Onboarding 1 (boas-vindas)
const ONBOARDING_1_KEYS = [
  'email_onboarding1_subject',
  'email_onboarding1_greeting',
  'email_onboarding1_message',
  'email_onboarding1_benefits',
  'email_onboarding1_cta',
  'email_onboarding1_footer',
];

// Configurações do Email Onboarding 2 (engajamento)
const ONBOARDING_2_KEYS = [
  'email_onboarding2_subject',
  'email_onboarding2_greeting',
  'email_onboarding2_message',
  'email_onboarding2_benefits',
  'email_onboarding2_cta',
  'email_onboarding2_footer',
];

// Configurações do Email Onboarding 3 (reengajamento)
const ONBOARDING_3_KEYS = [
  'email_onboarding3_subject',
  'email_onboarding3_greeting',
  'email_onboarding3_message',
  'email_onboarding3_benefits',
  'email_onboarding3_cta',
  'email_onboarding3_footer',
];

// Todas as configurações de email
const ALL_EMAIL_KEYS = [
  'email_from_name',
  ...EMAIL_1_KEYS,
  ...EMAIL_2_KEYS,
  ...ONBOARDING_1_KEYS,
  ...ONBOARDING_2_KEYS,
  ...ONBOARDING_3_KEYS,
];

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
  // Onboarding 1 - Boas-vindas
  email_onboarding1_subject: {
    label: 'Assunto do Email',
    description: 'Use {{site_name}} para inserir o nome do site',
    placeholder: 'Bem-vindo à {{site_name}}!',
  },
  email_onboarding1_greeting: {
    label: 'Saudação',
    description: 'Use {{name}} para inserir o nome da pessoa',
    placeholder: 'Olá {{name}}!',
  },
  email_onboarding1_message: {
    label: 'Mensagem Principal',
    description: 'Texto de boas-vindas para novos membros',
    placeholder: 'Sua conta foi criada com sucesso!',
  },
  email_onboarding1_benefits: {
    label: 'Lista de Benefícios',
    description: 'Separe os itens por vírgula',
    placeholder: 'Participar de desafios,Ganhar corações,Trocar por prêmios',
  },
  email_onboarding1_cta: {
    label: 'Texto do Botão',
    description: 'Texto que aparece no botão de ação',
    placeholder: 'Explorar a Plataforma',
  },
  email_onboarding1_footer: {
    label: 'Texto do Rodapé',
    description: 'Mensagem de encerramento do email',
    placeholder: 'Qualquer dúvida, estamos aqui para ajudar!',
  },
  // Onboarding 2 - Engajamento
  email_onboarding2_subject: {
    label: 'Assunto do Email',
    description: 'Use {{name}} para inserir o nome da pessoa',
    placeholder: '{{name}}, já completou seu primeiro desafio?',
  },
  email_onboarding2_greeting: {
    label: 'Saudação',
    description: 'Use {{name}} para inserir o nome da pessoa',
    placeholder: 'E aí {{name}}!',
  },
  email_onboarding2_message: {
    label: 'Mensagem Principal',
    description: 'Incentivo para completar desafios',
    placeholder: 'Você já viu os desafios disponíveis?',
  },
  email_onboarding2_benefits: {
    label: 'Lista de Benefícios',
    description: 'Separe os itens por vírgula',
    placeholder: 'Desafios físicos,Desafios de engajamento,Sorteios especiais',
  },
  email_onboarding2_cta: {
    label: 'Texto do Botão',
    description: 'Texto que aparece no botão de ação',
    placeholder: 'Ver Desafios Disponíveis',
  },
  email_onboarding2_footer: {
    label: 'Texto do Rodapé',
    description: 'Mensagem de encerramento do email',
    placeholder: 'Quanto mais você participa, mais corações acumula!',
  },
  // Onboarding 3 - Reengajamento
  email_onboarding3_subject: {
    label: 'Assunto do Email',
    description: 'Use {{name}} para inserir o nome da pessoa',
    placeholder: '{{name}}, suas corações estão esperando!',
  },
  email_onboarding3_greeting: {
    label: 'Saudação',
    description: 'Use {{name}} para inserir o nome da pessoa',
    placeholder: 'Oi {{name}}!',
  },
  email_onboarding3_message: {
    label: 'Mensagem Principal',
    description: 'Incentivo para resgatar prêmios',
    placeholder: 'Você sabia que pode trocar suas corações por prêmios?',
  },
  email_onboarding3_benefits: {
    label: 'Lista de Benefícios',
    description: 'Separe os itens por vírgula',
    placeholder: 'Prêmios exclusivos,Novos desafios toda semana,Rankings especiais',
  },
  email_onboarding3_cta: {
    label: 'Texto do Botão',
    description: 'Texto que aparece no botão de ação',
    placeholder: 'Resgatar Prêmios',
  },
  email_onboarding3_footer: {
    label: 'Texto do Rodapé',
    description: 'Mensagem de encerramento do email',
    placeholder: 'Não perca a chance de ganhar prêmios!',
  },
};

type EmailTab = 'email1' | 'email2' | 'onboarding1' | 'onboarding2' | 'onboarding3';

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
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-4 min-w-max">
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
          <button
            onClick={() => setActiveTab('onboarding1')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'onboarding1'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎉 Onboarding 1 - Boas-vindas
          </button>
          <button
            onClick={() => setActiveTab('onboarding2')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'onboarding2'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎯 Onboarding 2 - Engajamento
          </button>
          <button
            onClick={() => setActiveTab('onboarding3')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'onboarding3'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎁 Onboarding 3 - Reengajamento
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
          {/* Email 1 - Aprovação */}
          {activeTab === 'email1' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Email de Aprovação
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enviado quando um lead é aprovado para fazer parte da comunidade.
              </p>
              <div className="space-y-4">
                {EMAIL_1_KEYS.map(key => {
                  const fieldInfo = FIELD_LABELS[key];
                  const isTextarea = key.includes('message') || key.includes('benefits');
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
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Email 2 - Follow-up */}
          {activeTab === 'email2' && (
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
                  const isTextarea = key.includes('message') || key.includes('benefits');
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
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Onboarding 1 - Boas-vindas */}
          {activeTab === 'onboarding1' && (
            <Card className="p-6 border-green-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Email de Boas-vindas
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enviado imediatamente após o usuário criar sua conta.
              </p>
              <div className="space-y-4">
                {ONBOARDING_1_KEYS.map(key => {
                  const fieldInfo = FIELD_LABELS[key];
                  const isTextarea = key.includes('message') || key.includes('benefits');
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                      ) : (
                        <Input
                          value={editedValues[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          placeholder={fieldInfo?.placeholder}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Onboarding 2 - Engajamento */}
          {activeTab === 'onboarding2' && (
            <Card className="p-6 border-blue-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Email de Engajamento
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enviado 24h após criar conta, incentivando a participar de desafios.
              </p>
              <div className="space-y-4">
                {ONBOARDING_2_KEYS.map(key => {
                  const fieldInfo = FIELD_LABELS[key];
                  const isTextarea = key.includes('message') || key.includes('benefits');
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      ) : (
                        <Input
                          value={editedValues[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          placeholder={fieldInfo?.placeholder}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Onboarding 3 - Reengajamento */}
          {activeTab === 'onboarding3' && (
            <Card className="p-6 border-purple-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Email de Reengajamento
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enviado 72h após criar conta, incentivando a resgatar prêmios.
              </p>
              <div className="space-y-4">
                {ONBOARDING_3_KEYS.map(key => {
                  const fieldInfo = FIELD_LABELS[key];
                  const isTextarea = key.includes('message') || key.includes('benefits');
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        />
                      ) : (
                        <Input
                          value={editedValues[key] || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          placeholder={fieldInfo?.placeholder}
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
              {hasChanges ? 'Salvar Alterações' : 'Sem alterações'}
            </Button>
          </div>
        </div>

        {/* Preview do email */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Preview do {
              activeTab === 'email1' ? 'Email de Aprovação' :
              activeTab === 'email2' ? 'Email de Follow-up' :
              activeTab === 'onboarding1' ? 'Email de Boas-vindas' :
              activeTab === 'onboarding2' ? 'Email de Engajamento' :
              'Email de Reengajamento'
            }
          </h3>

          {/* Preview Email 1 - Aprovação */}
          {activeTab === 'email1' && (
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
              </div>
              <div className="bg-gray-50 p-4 text-center border-t">
                <p className="text-gray-500 text-sm">
                  {editedValues['email_approval_footer'] || 'Te esperamos lá!'}<br />
                  <strong className="text-pink-500">Equipe {siteName}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Preview Email 2 - Follow-up */}
          {activeTab === 'email2' && (
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
              </div>
              <div className="bg-orange-50 p-4 text-center border-t border-orange-200">
                <p className="text-orange-700 text-sm">
                  {editedValues['email_followup_footer'] || 'Não perca essa oportunidade!'}<br />
                  <strong className="text-orange-600">Equipe {siteName}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Preview Onboarding 1 - Boas-vindas */}
          {activeTab === 'onboarding1' && (
            <div className="border border-green-200 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
                <h1 className="text-white text-xl font-bold">{siteName}</h1>
                <p className="text-green-100 text-sm mt-1">Bem-vindo à comunidade!</p>
              </div>
              <div className="bg-white p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  <strong>Assunto:</strong> {replaceVariables(editedValues['email_onboarding1_subject'] || '')}
                </p>
                <hr />
                <h2 className="text-xl font-semibold text-gray-900">
                  {replaceVariables(editedValues['email_onboarding1_greeting'] || '')}
                </h2>
                <p className="text-gray-700">
                  {replaceVariables(editedValues['email_onboarding1_message'] || '')}
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">O que você pode fazer:</p>
                  <ul className="list-disc list-inside text-green-700 space-y-1">
                    {(editedValues['email_onboarding1_benefits'] || '').split(',').map((benefit, i) => (
                      <li key={i}>{benefit.trim()}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-center py-4">
                  <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg">
                    {editedValues['email_onboarding1_cta'] || 'Explorar a Plataforma'}
                  </span>
                </div>
              </div>
              <div className="bg-green-50 p-4 text-center border-t border-green-200">
                <p className="text-green-700 text-sm">
                  {editedValues['email_onboarding1_footer'] || 'Qualquer dúvida, estamos aqui!'}<br />
                  <strong className="text-green-600">Equipe {siteName}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Preview Onboarding 2 - Engajamento */}
          {activeTab === 'onboarding2' && (
            <div className="border border-blue-200 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-center">
                <h1 className="text-white text-xl font-bold">{siteName}</h1>
                <p className="text-blue-100 text-sm mt-1">Complete desafios e ganhe!</p>
              </div>
              <div className="bg-white p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  <strong>Assunto:</strong> {replaceVariables(editedValues['email_onboarding2_subject'] || '')}
                </p>
                <hr />
                <h2 className="text-xl font-semibold text-gray-900">
                  {replaceVariables(editedValues['email_onboarding2_greeting'] || '')}
                </h2>
                <p className="text-gray-700">
                  {replaceVariables(editedValues['email_onboarding2_message'] || '')}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium mb-2">Tipos de desafios:</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {(editedValues['email_onboarding2_benefits'] || '').split(',').map((benefit, i) => (
                      <li key={i}>{benefit.trim()}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-center py-4">
                  <span className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg">
                    {editedValues['email_onboarding2_cta'] || 'Ver Desafios'}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 text-center border-t border-blue-200">
                <p className="text-blue-700 text-sm">
                  {editedValues['email_onboarding2_footer'] || 'Quanto mais participa, mais ganha!'}<br />
                  <strong className="text-blue-600">Equipe {siteName}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Preview Onboarding 3 - Reengajamento */}
          {activeTab === 'onboarding3' && (
            <div className="border border-purple-200 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center">
                <h1 className="text-white text-xl font-bold">{siteName}</h1>
                <p className="text-purple-100 text-sm mt-1">Resgate seus prêmios!</p>
              </div>
              <div className="bg-white p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  <strong>Assunto:</strong> {replaceVariables(editedValues['email_onboarding3_subject'] || '')}
                </p>
                <hr />
                <h2 className="text-xl font-semibold text-gray-900">
                  {replaceVariables(editedValues['email_onboarding3_greeting'] || '')}
                </h2>
                <p className="text-gray-700">
                  {replaceVariables(editedValues['email_onboarding3_message'] || '')}
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-purple-800 font-medium mb-2">O que está esperando por você:</p>
                  <ul className="list-disc list-inside text-purple-700 space-y-1">
                    {(editedValues['email_onboarding3_benefits'] || '').split(',').map((benefit, i) => (
                      <li key={i}>{benefit.trim()}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-center py-4">
                  <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg">
                    {editedValues['email_onboarding3_cta'] || 'Resgatar Prêmios'}
                  </span>
                </div>
              </div>
              <div className="bg-purple-50 p-4 text-center border-t border-purple-200">
                <p className="text-purple-700 text-sm">
                  {editedValues['email_onboarding3_footer'] || 'Não perca a chance de ganhar!'}<br />
                  <strong className="text-purple-600">Equipe {siteName}</strong>
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Preview com dados de exemplo. Variáveis como {'{{name}}'} serão substituídas pelos dados reais.
          </p>
        </div>
      </div>
    </div>
  );
}
