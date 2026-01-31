import Link from 'next/link';
import { getSiteSettings } from '@/lib/config/site';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Arena Te Amo — Voltamos em breve!',
  description: 'A comunidade Arena Te Amo está em pausa. Voltamos em breve com novidades!',
};

export default async function CommunityPausedPage() {
  const settings = await getSiteSettings([
    'community_pause_message',
    'community_pause_reopen_date',
    'site_name',
    'creator_name',
  ]);

  // Check if user is logged in to show personalized content
  let userName: string | null = null;
  let userHearts: number | null = null;
  let hasPendingClaims = false;
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('display_name, coins')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        userName = profile.display_name;
        userHearts = profile.coins;
      }

      // Check pending claims
      const { count } = await supabase
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved', 'shipped']);
      
      hasPendingClaims = (count ?? 0) > 0;
    }
  } catch {
    // Not logged in, that's fine
  }

  const reopenDate = settings.community_pause_reopen_date;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo / Brand */}
        <div className="space-y-2">
          <div className="text-6xl animate-pulse">❤️</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {settings.site_name}
          </h1>
        </div>

        {/* Personalized greeting */}
        {userName && (
          <div className="bg-purple-100/60 rounded-xl px-4 py-3 text-purple-800 text-sm">
            Oi, <strong>{userName}</strong>! 👋
            {userHearts !== null && userHearts > 0 && (
              <span className="block mt-1">
                Você tem <strong>{userHearts} ❤️</strong> — seus corações estão seguros!
              </span>
            )}
          </div>
        )}

        {/* Message */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Estamos em pausa! 🛠️
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {settings.community_pause_message}
          </p>
          
          {reopenDate && (
            <div className="pt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-sm text-purple-800">
                📅 Previsão de retorno: <strong>{reopenDate}</strong>
              </span>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3 text-left p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-xl flex-shrink-0">✅</span>
              <p className="text-sm text-green-800">
                <strong>Prêmios serão pagos!</strong> Todos os resgates aprovados serão processados normalmente.
              </p>
            </div>
            <div className="flex items-center gap-3 text-left p-3 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-xl flex-shrink-0">💰</span>
              <p className="text-sm text-amber-800">
                <strong>Seus corações estão seguros!</strong> Quando voltarmos, tudo estará do jeito que você deixou.
              </p>
            </div>
            <div className="flex items-center gap-3 text-left p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-xl flex-shrink-0">🔔</span>
              <p className="text-sm text-blue-800">
                <strong>Vamos avisar!</strong> Cadastre-se na newsletter para ser o primeiro a saber quando voltarmos.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/newsletter"
            className="block w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            📩 Cadastrar na Newsletter
          </Link>

          {hasPendingClaims && (
            <Link
              href="/premios"
              className="block w-full py-3 px-6 bg-white text-purple-700 rounded-xl font-semibold border-2 border-purple-200 hover:bg-purple-50 transition-all"
            >
              🎁 Acompanhar meus prêmios
            </Link>
          )}

          {userName ? (
            <Link
              href="/premios"
              className="block w-full py-3 px-6 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-all"
            >
              🎁 Ver meus prêmios
            </Link>
          ) : (
            <Link
              href="/login"
              className="block w-full py-3 px-6 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-all"
            >
              🔑 Entrar na minha conta
            </Link>
          )}
        </div>

        {/* Social links */}
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Acompanhe nas redes:</p>
          <div className="flex justify-center gap-4">
            <a
              href="https://instagram.com/nextleveldj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            <a
              href="https://youtube.com/@nextleveldj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a
              href="https://tiktok.com/@nextleveldj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-400">
          Com carinho, Equipe {settings.site_name} ❤️
        </p>
      </div>
    </div>
  );
}
