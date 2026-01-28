import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Convite | Arena Te Amo',
  description: 'Você foi convidado para a comunidade Arena Te Amo! Entre e ganhe corações.',
};

interface ConvitePageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function ConvitePage({ searchParams }: ConvitePageProps) {
  const params = await searchParams;
  const referralCode = params.ref;

  // Se não tem código de referral, redirecionar pro cadastro
  if (!referralCode) {
    redirect('/seja-arena');
  }

  // Buscar quem indicou
  const supabase = await createClient();
  const { data: referrer } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .eq('referral_code', referralCode.toUpperCase())
    .single();

  const referrerName = referrer?.full_name || 'Um membro';

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="text-center py-6 px-4">
        <Link href="/" className="inline-block">
          <h1 className="text-2xl font-bold">
            <span className="text-gray-900">ARENA</span>
            <span className="text-pink-500">♥</span>
            <span className="text-gray-900">TE AMO</span>
          </h1>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-8 text-center">
        {/* Avatar do indicador */}
        <div className="mb-6">
          {referrer?.avatar_url ? (
            <img 
              src={referrer.avatar_url} 
              alt={referrerName}
              className="w-20 h-20 rounded-full mx-auto border-4 border-pink-200 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {referrerName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Mensagem */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Você foi convidado! 💜
        </h2>
        <p className="text-lg text-gray-600 mb-2">
          <strong>{referrerName}</strong> te convidou para fazer parte da
        </p>
        <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-8">
          Arena Te Amo
        </p>

        {/* Benefícios */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">O que você ganha? 🎁</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-2xl">❤️</span>
              <span className="text-gray-700">Corações por cada interação na comunidade</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <span className="text-gray-700">Desafios divertidos com prêmios reais</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <span className="text-gray-700">Troque corações por prêmios exclusivos</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <span className="text-gray-700">Comunidade do Moço do Te Amo</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <Link
          href={`/seja-arena?ref=${referralCode}`}
          className="inline-block w-full max-w-sm px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-lg font-bold rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          💜 Entrar na Comunidade
        </Link>
        
        <p className="text-sm text-gray-400 mt-4">
          É grátis! Cadastro em menos de 1 minuto.
        </p>
      </main>
    </div>
  );
}
