import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trophy, Target, Clock, Repeat, Gift, Package } from 'lucide-react';
import { getLandingPageData, LandingPageData } from '@/actions/landing-pages';
import { getSiteSettings } from '@/lib/config/site';
import { Button } from '@/components/ui';

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

// Validar tipo da URL
function isValidType(type: string): type is 'desafio' | 'premio' {
  return type === 'desafio' || type === 'premio';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type, id } = await params;

  if (!isValidType(type)) {
    return { title: 'Página não encontrada' };
  }

  const result = await getLandingPageData(type, id);

  if (result.error || !result.data) {
    return { title: 'Página não encontrada' };
  }

  const data = result.data;
  const settings = await getSiteSettings(['site_name']);

  return {
    title: `${data.title} | ${settings.site_name}`,
    description: data.description || `Participe deste ${type === 'desafio' ? 'desafio' : 'prêmio'} exclusivo!`,
    openGraph: {
      title: data.title,
      description: data.description || undefined,
      images: data.imageUrl ? [{ url: data.imageUrl }] : undefined,
    },
  };
}

// Componente para o badge de tipo
function TypeBadge({ data }: { data: LandingPageData }) {
  if (data.type === 'challenge') {
    const typeLabels = {
      engajamento: 'Engajamento',
      fisico: 'Desafio Físico',
      participe: 'Participe & Ganhe',
    };

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
        <Target className="w-4 h-4" />
        {typeLabels[data.challengeType || 'engajamento']}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
      {data.rewardType === 'physical' ? (
        <>
          <Package className="w-4 h-4" />
          Prêmio Físico
        </>
      ) : (
        <>
          <Gift className="w-4 h-4" />
          Prêmio Digital
        </>
      )}
    </span>
  );
}

// Componente para informações do desafio
function ChallengeInfo({ data }: { data: LandingPageData }) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      {data.coinsReward && data.coinsReward > 0 && (
        <div className="bg-pink-50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-pink-600 mb-1">
            <Heart className="w-5 h-5 fill-current" />
            <span className="text-2xl font-bold">{data.coinsReward}</span>
          </div>
          <p className="text-sm text-pink-700">Corações de recompensa</p>
        </div>
      )}

      {data.goalType && data.goalValue && (
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
            {data.goalType === 'repetitions' ? (
              <Repeat className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
            <span className="text-2xl font-bold">
              {data.goalType === 'time'
                ? `${data.goalValue}s`
                : data.goalValue
              }
            </span>
          </div>
          <p className="text-sm text-blue-700">
            {data.goalType === 'repetitions' ? 'Repetições' : 'Segundos'}
          </p>
        </div>
      )}
    </div>
  );
}

// Componente para informações do prêmio
function RewardInfo({ data }: { data: LandingPageData }) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      {data.coinsRequired && (
        <div className="bg-pink-50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-pink-600 mb-1">
            <Heart className="w-5 h-5 fill-current" />
            <span className="text-2xl font-bold">{data.coinsRequired}</span>
          </div>
          <p className="text-sm text-pink-700">Corações necessários</p>
        </div>
      )}

      {data.quantityAvailable !== undefined && data.quantityAvailable !== null && (
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
            <Trophy className="w-5 h-5" />
            <span className="text-2xl font-bold">
              {data.quantityAvailable > 0 ? data.quantityAvailable : 'Esgotado'}
            </span>
          </div>
          <p className="text-sm text-green-700">
            {data.quantityAvailable > 0 ? 'Disponíveis' : 'Em breve'}
          </p>
        </div>
      )}
    </div>
  );
}

export default async function LandingPage({ params }: PageProps) {
  const { type, id } = await params;

  if (!isValidType(type)) {
    notFound();
  }

  const result = await getLandingPageData(type, id);

  if (result.error || !result.data) {
    notFound();
  }

  const data = result.data;
  const settings = await getSiteSettings(['site_name', 'logo_url']);

  // Construir URL de redirecionamento para o formulário NPS
  const sourceType = data.type === 'challenge' ? 'landing_challenge' : 'landing_reward';
  const npsUrl = `/seja-arena?source=${sourceType}&id=${data.id}&name=${encodeURIComponent(data.title)}`;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {settings.logo_url ? (
              <Image
                src={settings.logo_url}
                alt={settings.site_name}
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            ) : (
              <span className="text-xl font-bold text-primary-600">{settings.site_name}</span>
            )}
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero Image */}
        {data.imageUrl ? (
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl mb-8">
            <Image
              src={data.imageUrl}
              alt={data.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : data.type === 'challenge' && data.icon ? (
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-8 shadow-xl">
            <span className="text-8xl">{data.icon}</span>
          </div>
        ) : (
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-8 shadow-xl">
            {data.type === 'challenge' ? (
              <Target className="w-24 h-24 text-white" />
            ) : (
              <Gift className="w-24 h-24 text-white" />
            )}
          </div>
        )}

        {/* Badge de tipo */}
        <div className="mb-4">
          <TypeBadge data={data} />
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {data.title}
        </h1>

        {/* Descrição */}
        {data.description && (
          <div
            className="prose prose-lg text-gray-600 mb-6"
            dangerouslySetInnerHTML={{ __html: data.description }}
          />
        )}

        {/* Informações específicas */}
        {data.type === 'challenge' ? (
          <ChallengeInfo data={data} />
        ) : (
          <RewardInfo data={data} />
        )}

        {/* CTA Button */}
        <div className="mt-8">
          <Link href={npsUrl}>
            <Button
              size="lg"
              className="w-full py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Quero Participar!
            </Button>
          </Link>
          <p className="text-center text-sm text-gray-500 mt-3">
            Cadastre-se para participar e ganhar recompensas exclusivas
          </p>
        </div>
      </main>

      {/* Footer simples */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} {settings.site_name}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
