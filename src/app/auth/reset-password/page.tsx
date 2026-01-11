import { Suspense } from 'react';
import { getSiteSettings } from '@/lib/config/site';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata = {
  title: 'Redefinir senha',
  description: 'Defina sua nova senha',
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );
}

export default async function ResetPasswordPage() {
  const settings = await getSiteSettings(['login_title', 'logo_url']);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm
        siteName={settings.login_title}
        logoUrl={settings.logo_url}
      />
    </Suspense>
  );
}
