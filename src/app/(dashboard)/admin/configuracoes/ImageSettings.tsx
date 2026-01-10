'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui';
import { uploadLogo, resetLogo, uploadFavicon, resetFavicon } from '@/actions/settings';

interface ImageSettingsProps {
  initialLogoUrl: string;
  initialFaviconUrl: string;
}

/**
 * Componente para upload de logo e favicon
 */
export function ImageSettings({ initialLogoUrl, initialFaviconUrl }: ImageSettingsProps) {
  return (
    <div className="space-y-6">
      <LogoUploader initialUrl={initialLogoUrl} />
      <FaviconUploader initialUrl={initialFaviconUrl} />
    </div>
  );
}

// ============ Logo Uploader ============
function LogoUploader({ initialUrl }: { initialUrl: string }) {
  const router = useRouter();
  const [currentLogo, setCurrentLogo] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      router.refresh(); // Atualizar Server Components (Header)
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
      setMessage({ type: 'success', text: 'Logo restaurada para o padrao!' });
      router.refresh(); // Atualizar Server Components (Header)
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
                  <LoadingSpinner />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadIcon />
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
                  <LoadingSpinner />
                  Restaurando...
                </>
              ) : (
                <>
                  <ResetIcon />
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

// ============ Favicon Uploader ============
function FaviconUploader({ initialUrl }: { initialUrl: string }) {
  const router = useRouter();
  const [currentFavicon, setCurrentFavicon] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      router.refresh(); // Atualizar Server Components
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

    const result = await resetFavicon();

    if (result.success) {
      setCurrentFavicon('/favicon.svg');
      setMessage({ type: 'success', text: 'Favicon restaurado para o padrao!' });
      router.refresh(); // Atualizar Server Components
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
            {isCustomFavicon ? 'Personalizado' : 'Padrao'}
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
                  <LoadingSpinner />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadIcon />
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
                  <LoadingSpinner />
                  Restaurando...
                </>
              ) : (
                <>
                  <ResetIcon />
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

// ============ Icons ============
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

function ResetIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
