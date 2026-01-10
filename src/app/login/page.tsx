import { getSiteSettings } from '@/lib/config/site';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  // Buscar configurações do site
  const settings = await getSiteSettings(['login_title', 'login_subtitle']);

  return (
    <LoginForm
      siteName={settings.login_title}
      subtitle={settings.login_subtitle}
    />
  );
}
