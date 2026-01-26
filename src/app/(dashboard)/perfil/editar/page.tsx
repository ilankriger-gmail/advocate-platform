'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input, Textarea, Skeleton } from '@/components/ui';
import { useProfile } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import ChangePasswordSection from '@/components/auth/ChangePasswordSection';
import { AvatarUploader } from '@/components/profile/AvatarUploader';

export default function EditarPerfilPage() {
  const router = useRouter();
  const { user, profile: authProfile, isLoading: authLoading } = useAuth();
  const { update, isPending, error } = useProfile();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    instagram_handle: '',
    tiktok_handle: '',
    youtube_handle: '',
    twitter_handle: '',
    avatar_url: '',
    website_url: '',
  });

  useEffect(() => {
    // Se ainda está carregando auth, espera
    if (authLoading) return;

    // Se não tem usuário, para de carregar
    if (!user) {
      setLoading(false);
      return;
    }

    // Carregar dados do perfil
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user!.id)
          .maybeSingle(); // maybeSingle ao invés de single para não dar erro se não existir

        if (queryError) {
          console.error('[EditarPerfil] Erro ao carregar perfil:', queryError);
        }

        // Usar dados do banco se existirem, senão usar dados do auth
        setFormData({
          full_name: data?.full_name || authProfile?.full_name || user!.user_metadata?.full_name || '',
          bio: data?.bio || '',
          instagram_handle: data?.instagram_handle || '',
          tiktok_handle: data?.tiktok_handle || '',
          youtube_handle: data?.youtube_handle || '',
          twitter_handle: data?.twitter_handle || '',
          avatar_url: data?.avatar_url || authProfile?.avatar_url || user!.user_metadata?.avatar_url || '',
          website_url: data?.website_url || '',
        });
      } catch (err) {
        console.error('[EditarPerfil] Erro inesperado:', err);
        // Em caso de erro, usa dados do auth como fallback
        setFormData({
          full_name: authProfile?.full_name || user!.user_metadata?.full_name || '',
          bio: '',
          instagram_handle: '',
          tiktok_handle: '',
          youtube_handle: '',
          twitter_handle: '',
          avatar_url: authProfile?.avatar_url || user!.user_metadata?.avatar_url || '',
          website_url: '',
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, authLoading, authProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await update({
      full_name: formData.full_name,
      bio: formData.bio || undefined,
      instagram_handle: formData.instagram_handle || undefined,
      tiktok_handle: formData.tiktok_handle || undefined,
      youtube_handle: formData.youtube_handle || undefined,
      twitter_handle: formData.twitter_handle || undefined,
      avatar_url: formData.avatar_url || undefined,
      website_url: formData.website_url || undefined,
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

  if (loading || authLoading) {
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
          {/* Upload de Foto - No topo, destacado quando não tem foto */}
          <AvatarUploader
            currentUrl={formData.avatar_url || null}
            userName={formData.full_name}
            highlighted={!formData.avatar_url}
          />

          {/* Informações Básicas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Informações Básicas
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
                rows={4}
                placeholder="Conte um pouco sobre você..."
                hint="Opcional - máximo 500 caracteres"
                maxLength={500}
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
                label="Link Pessoal"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                placeholder="https://seusite.com"
                hint="Seu site, portfólio ou link favorito"
              />

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

              <Input
                label="YouTube"
                name="youtube_handle"
                value={formData.youtube_handle}
                onChange={handleChange}
                placeholder="seu_canal"
                hint="Nome do canal ou @handle"
              />

              <Input
                label="Twitter / X"
                name="twitter_handle"
                value={formData.twitter_handle}
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
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </Card>
      </form>

      {/* Secao de Alteracao de Senha */}
      <ChangePasswordSection />
    </div>
  );
}
