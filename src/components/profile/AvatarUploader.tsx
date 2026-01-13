'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui';
import { uploadAvatar, removeAvatar } from '@/actions/profile';

interface AvatarUploaderProps {
  currentUrl: string | null;
  userName: string;
}

/**
 * Componente para upload de avatar do perfil
 */
export function AvatarUploader({ currentUrl, userName }: AvatarUploaderProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadAvatar(formData);

    if (result.success && result.url) {
      setAvatarUrl(result.url);
      setMessage({ type: 'success', text: 'Foto atualizada com sucesso!' });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao fazer upload' });
    }

    setUploading(false);
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setMessage(null);

    const result = await removeAvatar();

    if (result.success) {
      setAvatarUrl(null);
      setMessage({ type: 'success', text: 'Foto removida!' });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao remover foto' });
    }

    setRemoving(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Foto de Perfil
      </label>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Preview do avatar atual */}
        <div className="flex flex-col items-center gap-2">
          <Avatar
            src={avatarUrl}
            name={userName}
            size="xl"
            className="!w-20 !h-20"
          />
          <span className="text-xs text-gray-500">
            {avatarUrl ? 'Foto atual' : 'Sem foto'}
          </span>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
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
                  <LoadingSpinner />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadIcon />
                  {avatarUrl ? 'Trocar foto' : 'Enviar foto'}
                </>
              )}
            </span>
          </label>

          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                removing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {removing ? (
                <>
                  <LoadingSpinner />
                  Removendo...
                </>
              ) : (
                <>
                  <TrashIcon />
                  Remover foto
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Aceita PNG, JPEG ou WebP. Máximo 2MB.
      </p>
    </div>
  );
}

// Icons
function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
