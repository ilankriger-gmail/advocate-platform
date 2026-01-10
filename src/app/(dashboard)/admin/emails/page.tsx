'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input, Skeleton } from '@/components/ui';
import { fetchAllSiteSettings, updateMultipleSiteSettings } from '@/actions/settings';
import type { SiteSetting, SiteSettingKey } from '@/lib/config/site';

// Configuracoes de email que queremos editar
const EMAIL_KEYS = [
  'email_approval_subject',
  'email_approval_greeting',
  'email_approval_message',
  'email_approval_benefits',
  'email_approval_cta',
  'email_approval_footer',
  'email_from_name',
];

// Labels amigaveis para cada campo
const FIELD_LABELS: Record<string, { label: string; description: string; placeholder: string }> = {
  email_from_name: {
    label: 'Nome do Remetente',
    description: 'Nome que aparece como remetente do email',
    placeholder: 'Arena Te Amo',
  },
  email_approval_subject: {
    label: 'Assunto do Email',
    description: 'Use {{site_name}} para inserir o nome do site',
    placeholder: 'Voce foi aprovado para o {{site_name}}!',
  },
  email_approval_greeting: {
    label: 'Saudacao',
    description: 'Use {{name}} para inserir o nome da pessoa',
    placeholder: 'Ola {{name}}!',
  },
  email_approval_message: {
    label: 'Mensagem Principal',
    description: 'Texto principal do email de aprovacao',
    placeholder: 'Sua solicitacao foi aprovada!',
  },
  email_approval_benefits: {
    label: 'Lista de Beneficios',
    description: 'Separe os itens por virgula',
    placeholder: 'Desafios exclusivos,Eventos especiais,Premios incriveis',
  },
  email_approval_cta: {
    label: 'Texto do Botao',
    description: 'Texto que aparece no botao de acao',
    placeholder: 'Criar Minha Conta',
  },
  email_approval_footer: {
    label: 'Texto do Rodape',
    description: 'Mensagem de encerramento do email',
    placeholder: 'Te esperamos la!',
  },
};

export default function AdminEmailsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('Arena Te Amo');

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Verificar se e admin ou creator
      const { data: profile } = await supabase
        .from('users')
        .select('role, is_creator')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin' && !profile?.is_creator) {
        router.push('/');
        return;
      }

      // Carregar configuracoes
      const result = await fetchAllSiteSettings();

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        // Filtrar apenas as configuracoes de email
        const emailSettings = result.data.filter(s => EMAIL_KEYS.includes(s.key));
        setSettings(emailSettings);

        // Inicializar valores editados
        const initialValues: Record<string, string> = {};
        emailSettings.forEach(setting => {
          initialValues[setting.key] = setting.value;
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
  }, [router]);

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

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

  // Funcao para substituir variaveis no preview
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario de edicao */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Email de Aprovacao
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Este email e enviado quando um lead e aprovado para fazer parte da comunidade.
            </p>
            <div className="space-y-4">
              {EMAIL_KEYS.map(key => {
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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

          {/* Botao Salvar */}
          <div className="flex justify-end">
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

        {/* Preview do email */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Preview do Email</h3>
          <div className="border rounded-lg overflow-hidden shadow-lg">
            {/* Header do preview */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-center">
              <h1 className="text-white text-xl font-bold">{siteName}</h1>
            </div>

            {/* Conteudo do preview */}
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
                Agora voce pode criar sua conta na plataforma e participar de:
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

            {/* Footer do preview */}
            <div className="bg-gray-50 p-4 text-center border-t">
              <p className="text-gray-500 text-sm">
                {editedValues['email_approval_footer'] || 'Te esperamos la!'}<br />
                <strong className="text-pink-500">Equipe {siteName}</strong>
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Preview com dados de exemplo. Variaveis como {'{{name}}'} serao substituidas pelos dados reais.
          </p>
        </div>
      </div>
    </div>
  );
}
