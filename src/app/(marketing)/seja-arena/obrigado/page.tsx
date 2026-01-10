import Link from 'next/link';
import { getSiteSettings } from '@/lib/config/site';

export default async function ObrigadoPage() {
  const settings = await getSiteSettings(['site_name', 'footer_text']);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Icone de sucesso */}
      <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Mensagem */}
      <div className="text-center max-w-md">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Obrigado!
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Seu cadastro foi enviado com sucesso.
        </p>
        <p className="text-gray-500 mb-8">
          Nossa equipe ira analisar sua solicitação e em breve entraremos em contato
          para informar se você foi aprovado para a comunidade {settings.site_name}.
        </p>

        {/* Icones de contato */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            E-mail
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            WhatsApp
          </div>
        </div>

        {/* Botao voltar */}
        <Link
          href="/seja-arena"
          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar ao início
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-12 text-sm text-gray-400">
        {settings.footer_text}
      </p>
    </main>
  );
}
