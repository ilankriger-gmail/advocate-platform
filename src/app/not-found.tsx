import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página não encontrada | Arena Te Amo',
  description: 'A página que você procura não existe ou foi movida.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Emoji grande */}
        <div className="text-8xl mb-6">💔</div>
        
        {/* Título */}
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Ops! Página não encontrada
        </h1>
        
        {/* Descrição */}
        <p className="text-gray-600 mb-8">
          A página que você procura não existe ou foi movida. 
          Mas não se preocupe, tem muito amor te esperando na página inicial!
        </p>
        
        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-red-600 transition-all shadow-lg shadow-pink-500/25"
          >
            ❤️ Ir para o início
          </Link>
          <Link
            href="/desafios"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
          >
            🎯 Ver desafios
          </Link>
        </div>
      </div>
    </div>
  );
}
