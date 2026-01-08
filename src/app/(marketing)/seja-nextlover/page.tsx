import { getSiteSettings } from '@/lib/config/site';
import { NPSForm } from './NPSForm';

export default async function SejaNextloverPage() {
  const settings = await getSiteSettings([
    'site_name',
    'creator_name',
    'footer_text',
  ]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo/Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Seja um {settings.site_name.replace('LOVERS', 'LOVER')}
        </h1>
        <p className="mt-3 text-gray-600 max-w-md leading-relaxed">
          Ganhe produtos, dinheiro e participe de experiencias exclusivas para os maiores fas do {settings.creator_name}
        </p>
      </div>

      {/* Card do formulario */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <NPSForm />
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-400">
        {settings.footer_text}
      </p>
    </main>
  );
}
