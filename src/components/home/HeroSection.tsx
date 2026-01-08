import Link from 'next/link';

interface HeroSectionProps {
  isLoggedIn: boolean;
}

export function HeroSection({ isLoggedIn }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Comunidade NextLOVERS
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-6 max-w-2xl mx-auto">
          Comunidade oficial de O Moço do Te Amo | NextlevelDJ
        </p>
        {!isLoggedIn && (
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            Entrar na NextLOVERS
          </Link>
        )}
      </div>
    </section>
  );
}
