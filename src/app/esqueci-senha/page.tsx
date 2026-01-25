import { getSiteSettings } from '@/lib/config/site';
import ForgotPasswordForm from './ForgotPasswordForm';


export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Esqueci minha senha',
  description: 'Recupere sua senha',
};

export default async function ForgotPasswordPage() {
  const settings = await getSiteSettings(['login_title', 'logo_url']);

  return (
    <ForgotPasswordForm
      siteName={settings.login_title}
      logoUrl={settings.logo_url}
    />
  );
}
