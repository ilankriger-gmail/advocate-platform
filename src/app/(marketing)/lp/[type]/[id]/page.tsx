import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trophy, Target, Clock, Repeat, Gift, Package, Users, Sparkles } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { getLandingPageData, LandingPageData } from '@/actions/landing-pages';
import { getSiteSettings } from '@/lib/config/site';
import { Button } from '@/components/ui';
import { CountdownTimer, ScarcityIndicator, FadeInSection } from '@/components/landing';

// Função para sanitizar HTML e prevenir XSS
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 's', 'strike', 'span', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

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
    const typeConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: React.ReactNode }> = {
      engajamento: { label: 'Engajamento', bgColor: 'bg-primary-100', textColor: 'text-primary-700', icon: <Target className="w-4 h-4" /> },
      fisico: { label: 'Desafio Físico', bgColor: 'bg-blue-100', textColor: 'text-blue-700', icon: <Sparkles className="w-4 h-4" /> },
      participe: { label: 'Participe & Ganhe', bgColor: 'bg-amber-100', textColor: 'text-amber-700', icon: <Gift className="w-4 h-4" /> },
      atos_amor: { label: 'Atos de Amor', bgColor: 'bg-pink-100', textColor: 'text-pink-700', icon: <Heart className="w-4 h-4" /> },
    };

    const config = typeConfig[data.challengeType || 'engajamento'];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
        {config.icon}
        {config.label}
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

// Componente para contador de participantes (social proof)
function ParticipantCounter({ count, type }: { count: number; type: 'challenge' | 'reward' }) {
  if (count === 0) return null;

  const label = type === 'challenge'
    ? `${count} ${count === 1 ? 'pessoa já participou' : 'pessoas já participaram'}`
    : `${count} ${count === 1 ? 'pessoa já resgatou' : 'pessoas já resgataram'}`;

  return (
    <div className="flex items-center justify-center gap-2 text-gray-600 py-3">
      <Users className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// Gerar headline impactante baseado no tipo
function getHeadline(data: LandingPageData): { headline: string; subheadline: string } {
  if (data.type === 'challenge') {
    const headlines: Record<string, { headline: string; subheadline: string }> = {
      fisico: {
        headline: `Ganhe ${data.coinsReward || 0} corações com este desafio!`,
        subheadline: 'Supere seus limites e seja recompensado',
      },
      engajamento: {
        headline: `Complete o desafio e ganhe ${data.coinsReward || 0} corações!`,
        subheadline: 'Participe, engaje e acumule recompensas',
      },
      participe: {
        headline: 'Participe e concorra a prêmios incríveis!',
        subheadline: 'É simples, rápido e gratuito',
      },
      atos_amor: {
        headline: 'Faça a diferença com um ato de amor!',
        subheadline: `Ajude alguém e ganhe ${data.coinsReward || 0} corações`,
      },
    };
    return headlines[data.challengeType || 'engajamento'];
  }

  // Para prêmios
  return {
    headline: 'Resgate seu prêmio exclusivo!',
    subheadline: `Use seus corações e garanta o seu`,
  };
}

// Gerar CTA orientado a ação baseado no tipo
function getCTAText(data: LandingPageData): { primary: string; secondary: string } {
  if (data.type === 'challenge') {
    const ctas: Record<string, { primary: string; secondary: string }> = {
      fisico: {
        primary: 'Começar Agora',
        secondary: 'Cadastre-se e complete o desafio para ganhar corações',
      },
      engajamento: {
        primary: 'Participar do Desafio',
        secondary: 'É rápido, simples e você ganha corações',
      },
      participe: {
        primary: 'Garantir Minha Vaga',
        secondary: 'Cadastre-se gratuitamente e concorra',
      },
      atos_amor: {
        primary: 'Quero Ajudar',
        secondary: 'Faça um ato de amor e seja recompensado',
      },
    };
    return ctas[data.challengeType || 'engajamento'];
  }

  // Para prêmios
  if (data.quantityAvailable && data.quantityAvailable <= 5) {
    return {
      primary: 'Resgatar Agora',
      secondary: `Corra! Apenas ${data.quantityAvailable} ${data.quantityAvailable === 1 ? 'unidade disponível' : 'unidades disponíveis'}`,
    };
  }

  return {
    primary: 'Quero Este Prêmio',
    secondary: `Use ${data.coinsRequired || 0} corações para resgatar`,
  };
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

  // Obter textos dinâmicos
  const { headline, subheadline } = getHeadline(data);
  const ctaText = getCTAText(data);
  const participantsCount = data.type === 'challenge' ? data.participantsCount : data.redemptionsCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
        {/* Headline impactante acima da dobra */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {headline}
          </h2>
          <p className="text-lg text-gray-600">{subheadline}</p>
        </div>

        {/* Hero Image */}
        {data.imageUrl ? (
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl mb-6">
            <Image
              src={data.imageUrl}
              alt={data.title}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
              priority
              quality={85}
            />
          </div>
        ) : data.type === 'challenge' && data.icon ? (
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-6 shadow-xl">
            <span className="text-8xl">{data.icon}</span>
          </div>
        ) : (
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-6 shadow-xl">
            {data.type === 'challenge' ? (
              <Target className="w-24 h-24 text-white" />
            ) : (
              <Gift className="w-24 h-24 text-white" />
            )}
          </div>
        )}

        {/* Contador de participantes (social proof) */}
        <ParticipantCounter count={participantsCount || 0} type={data.type} />

        {/* Countdown timer para desafios com data limite */}
        {data.type === 'challenge' && data.endsAt && (
          <div className="mb-6">
            <CountdownTimer endsAt={data.endsAt} />
          </div>
        )}

        {/* Badges de urgência/escassez */}
        <ScarcityIndicator
          quantityAvailable={data.quantityAvailable}
          participantsCount={data.participantsCount}
          endsAt={data.endsAt}
          type={data.type}
          className="mb-4"
        />

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
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.description) }}
          />
        )}

        {/* Informações específicas */}
        <FadeInSection delay={100}>
          {data.type === 'challenge' ? (
            <ChallengeInfo data={data} />
          ) : (
            <RewardInfo data={data} />
          )}
        </FadeInSection>

        {/* CTA Button */}
        <FadeInSection delay={200}>
          <div className="mt-8 space-y-4">
            <Link href={npsUrl}>
              <Button
                size="lg"
                className="cta-button w-full py-6 text-lg font-semibold shadow-lg animate-pulse-ring"
              >
                {ctaText.primary}
              </Button>
            </Link>
            <p className="text-center text-sm text-gray-500">
              {ctaText.secondary}
            </p>
          </div>
        </FadeInSection>

        {/* Badge de segurança */}
        <FadeInSection delay={300}>
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Cadastro seguro e gratuito</span>
            </div>
          </div>
        </FadeInSection>
      </main>

      {/* Footer simples */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} {settings.site_name}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
