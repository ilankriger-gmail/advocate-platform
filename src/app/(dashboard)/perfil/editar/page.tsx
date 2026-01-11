'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input, Textarea, Skeleton } from '@/components/ui';
import { useProfile } from '@/hooks';
import { createClient } from '@/lib/supabase/client';
import ChangePasswordSection from '@/components/auth/ChangePasswordSection';

export default function EditarPerfilPage() {
  const router = useRouter();
  const { update, isPending, error } = useProfile();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    instagram_handle: '',
    tiktok_handle: '',
    avatar_url: '',
  });

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setFormData({
            full_name: data.full_name || user.user_metadata?.full_name || '',
            bio: data.bio || '',
            instagram_handle: data.instagram_handle || '',
            tiktok_handle: data.tiktok_handle || '',
            avatar_url: data.avatar_url || user.user_metadata?.avatar_url || '',
          });
        }
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await update({
      full_name: formData.full_name,
      bio: formData.bio || undefined,
      instagram_handle: formData.instagram_handle || undefined,
      tiktok_handle: formData.tiktok_handle || undefined,
      avatar_url: formData.avatar_url || undefined,
    });

    if (result.success) {
      router.push('/perfil');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Editar Perfil"
        breadcrumbs={[
          { label: 'Perfil', href: '/perfil' },
          { label: 'Editar' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Informacoes Basicas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Informacoes Basicas
            </h3>
            <div className="space-y-4">
              <Input
                label="Nome Completo"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />

              <Textarea
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Conte um pouco sobre voce..."
                hint="Opcional - máximo 160 caracteres"
                maxLength={160}
              />

              <Input
                label="URL do Avatar"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                placeholder="https://..."
                hint="Opcional - URL de uma imagem de perfil"
              />
            </div>
          </div>

          {/* Redes Sociais */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Redes Sociais
            </h3>
            <div className="space-y-4">
              <Input
                label="Instagram"
                name="instagram_handle"
                value={formData.instagram_handle}
                onChange={handleChange}
                placeholder="seu_usuario"
                hint="Sem o @"
              />

              <Input
                label="TikTok"
                name="tiktok_handle"
                value={formData.tiktok_handle}
                onChange={handleChange}
                placeholder="seu_usuario"
                hint="Sem o @"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending || !formData.full_name}
            >
              {isPending ? 'Salvando...' : 'Salvar Alteracoes'}
            </Button>
          </div>
        </Card>
      </form>

      {/* Secao de Alteracao de Senha */}
      <ChangePasswordSection />
    </div>
  );
}
