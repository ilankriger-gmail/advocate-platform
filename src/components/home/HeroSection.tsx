import Link from 'next/link';
import { Avatar } from '@/components/ui';
import type { CreatorProfile } from '@/lib/supabase/types';

interface HeroSectionProps {
  creator: CreatorProfile | null;
  isLoggedIn: boolean;
}

export function HeroSection({ creator, isLoggedIn }: HeroSectionProps) {
  if (!creator) {
    return (
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Comunidade NextLOVERS
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
            Comunidade oficial de O Moco do Te Amo | NextlevelDJ
          </p>
          {!isLoggedIn && (
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            >
              Entrar na NextLOVERS
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Avatar do criador */}
          <div className="relative">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/20 p-1">
              <Avatar
                src={creator.avatar_url || undefined}
                name={creator.full_name || 'Criador'}
                size="xl"
                className="w-full h-full text-4xl"
              />
            </div>
            {/* Badge de criador */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
              Criador
            </div>
          </div>

          {/* Info do criador */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {creator.full_name || 'Criador'}
            </h1>
            {creator.bio && (
              <p className="text-base text-white/80 mb-4 max-w-xl">
                {creator.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold">{creator.posts_count}</p>
                <p className="text-white/60 text-xs">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{creator.fans_count}</p>
                <p className="text-white/60 text-xs">Fas</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{creator.total_likes}</p>
                <p className="text-white/60 text-xs">Curtidas</p>
              </div>
            </div>

            {/* Social links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {creator.instagram_handle && (
                <a
                  href={`https://instagram.com/${creator.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>@{creator.instagram_handle}</span>
                </a>
              )}
              {creator.tiktok_handle && (
                <a
                  href={`https://tiktok.com/@${creator.tiktok_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <span>@{creator.tiktok_handle}</span>
                </a>
              )}
              {creator.youtube_handle && (
                <a
                  href={`https://youtube.com/@${creator.youtube_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>@{creator.youtube_handle}</span>
                </a>
              )}
            </div>
          </div>

          {/* CTA */}
          {!isLoggedIn && (
            <div className="md:self-start">
              <Link
                href="/login"
                className="inline-flex items-center px-5 py-2.5 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg text-sm"
              >
                Entrar na NextLOVERS
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
