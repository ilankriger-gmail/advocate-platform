import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trophy, Target, Clock, Repeat, Gift, Package, Users, Sparkles, Banknote, Zap } from 'lucide-react';
import { getLandingPageData, LandingPageData } from '@/actions/landing-pages';
import { getSiteSettings } from '@/lib/config/site';
import { Button } from '@/components/ui';
import { CountdownTimer, ScarcityIndicator, FadeInSection } from '@/components/landing';

// Função para sanitizar HTML (sem dependência de JSDOM para funcionar no Vercel)
// Remove tags perigosas mantendo formatação básica
function sanitizeHtml(html: string): string {
  // Lista de tags permitidas
  const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 's', 'strike', 'span', 'h1', 'h2', 'h3'];

  // Remove scripts e event handlers
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  // Remove tags não permitidas mas mantém seu conteúdo
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  clean = clean.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Limpa atributos perigosos mas mantém href, target, rel, class
      return match.replace(/\s+(?!href|target|rel|class)[a-z-]+\s*=\s*["'][^"']*["']/gi, '');
    }
    return '';
  });

  return clean;
}

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
  searchParams?: Promise<{
    modo?: string;
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
  const hasGoal = data.goalType && data.goalValue;

  return (
    <div className={`grid ${hasGoal ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mt-6`}>
      {data.coinsReward && data.coinsReward > 0 && (
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-5 text-center shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-full">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
            <span className="text-4xl font-black text-white">{data.coinsReward.toLocaleString()}</span>
          </div>
          <p className="text-sm text-pink-100 font-medium">corações de recompensa</p>
        </div>
      )}

      {hasGoal && (
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-center shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-full">
              {data.goalType === 'repetitions' ? (
                <Repeat className="w-6 h-6 text-white" />
              ) : (
                <Clock className="w-6 h-6 text-white" />
              )}
            </div>
            <span className="text-4xl font-black text-white">
              {data.goalType === 'time'
                ? `${data.goalValue}s`
                : data.goalValue
              }
            </span>
          </div>
          <p className="text-sm text-blue-100 font-medium">
            {data.goalType === 'repetitions' ? 'repetições' : 'segundos'}
          </p>
        </div>
      )}
    </div>
  );
}

// Componente para informações do prêmio
function RewardInfo({ data }: { data: LandingPageData }) {
  const hasQuantity = data.quantityAvailable !== undefined && data.quantityAvailable !== null;

  return (
    <div className={`grid ${hasQuantity ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mt-6`}>
      {data.coinsRequired && (
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-5 text-center shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-full">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
            <span className="text-4xl font-black text-white">{data.coinsRequired.toLocaleString()}</span>
          </div>
          <p className="text-sm text-pink-100 font-medium">corações necessários</p>
        </div>
      )}

      {hasQuantity && (
        <div className={`bg-gradient-to-br ${data.quantityAvailable! > 0 ? 'from-emerald-500 to-green-600' : 'from-gray-400 to-gray-500'} rounded-2xl p-5 text-center shadow-lg`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-full">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-4xl font-black text-white">
              {data.quantityAvailable! > 0 ? data.quantityAvailable : '0'}
            </span>
          </div>
          <p className="text-sm text-white/80 font-medium">
            {data.quantityAvailable! > 0 ? 'disponíveis' : 'esgotado'}
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

// Componente do Criador - Mostra quem é o criador da comunidade
function CreatorSection({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 my-6">
      <div className="flex flex-col items-center text-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-20 h-20 rounded-full object-cover border-3 border-purple-300 shadow-lg mb-3"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-3xl font-bold mb-3">
            {name.charAt(0)}
          </div>
        )}
        <p className="text-sm text-purple-700 font-medium">Comunidade oficial de</p>
        <h3 className="font-bold text-gray-900 text-xl mt-1">{name}</h3>
        <p className="text-sm text-gray-600 mt-2">
          Participe dos desafios, ganhe corações e troque por prêmios reais!
        </p>
      </div>
    </div>
  );
}

// Componente FOMO - Mostra que corações viram dinheiro
function CashPrizeFomo() {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 my-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-green-500 rounded-full">
          <Banknote className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-green-800 text-sm">Ganhe corações!</h3>
          <p className="text-xs text-green-600">Troque por produtos, experiências e dinheiro</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/70 rounded-lg p-2">
          <Gift className="w-4 h-4 text-pink-500 mx-auto mb-1" />
          <p className="text-xs font-medium text-gray-700">Produtos</p>
        </div>
        <div className="bg-white/70 rounded-lg p-2">
          <Sparkles className="w-4 h-4 text-purple-500 mx-auto mb-1" />
          <p className="text-xs font-medium text-gray-700">Experiências</p>
        </div>
        <div className="bg-white/70 rounded-lg p-2">
          <Banknote className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-xs font-medium text-gray-700">Dinheiro</p>
        </div>
      </div>
      <p className="text-xs text-center text-green-700 mt-3 font-medium">
        Quanto mais corações, mais chances de ganhar!
      </p>
    </div>
  );
}

// Gerar headline impactante baseado no tipo
function getHeadline(data: LandingPageData): { headline: string; subheadline: string } {
  if (data.type === 'challenge') {
    const headlines: Record<string, { headline: string; subheadline: string }> = {
      fisico: {
        headline: `Ganhe ${data.coinsReward || 0} corações com este desafio!`,
        subheadline: 'Troque por produtos, experiências e dinheiro!',
      },
      engajamento: {
        headline: `Complete o desafio e ganhe ${data.coinsReward || 0} corações!`,
        subheadline: 'Troque por produtos, experiências e dinheiro!',
      },
      participe: {
        headline: 'Participe e concorra a prêmios incríveis!',
        subheadline: 'Ganhe corações e troque por produtos, experiências e dinheiro!',
      },
      atos_amor: {
        headline: 'Faça a diferença com um ato de amor!',
        subheadline: `Ganhe ${data.coinsReward || 0} corações e troque por prêmios!`,
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

export default async function LandingPage({ params, searchParams }: PageProps) {
  const { type, id } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isValidType(type)) {
    notFound();
  }

  const result = await getLandingPageData(type, id);

  if (result.error || !result.data) {
    notFound();
  }

  const data = result.data;
  const settings = await getSiteSettings(['site_name', 'logo_url', 'creator_name', 'creator_avatar_url']);

  // Verificar se é modo direto (cadastro sem NPS)
  const modoDireto = resolvedSearchParams?.modo === 'direto';

  // Construir URL de redirecionamento
  const sourceType = data.type === 'challenge' ? 'landing_challenge' : 'landing_reward';

  // Modo direto: vai direto para registro com parâmetros de origem
  // Modo padrão: passa pelo NPS primeiro
  const ctaUrl = modoDireto
    ? `/registro?source=${sourceType}&id=${data.id}&name=${encodeURIComponent(data.title)}`
    : `/seja-arena?source=${sourceType}&id=${data.id}&name=${encodeURIComponent(data.title)}`;

  // Manter compatibilidade com variável antiga (usada nos Links)
  const npsUrl = ctaUrl;

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
        {/* Seção do Criador - Comunidade oficial (só mostra se tiver nome configurado) */}
        {settings.creator_name && (
          <CreatorSection
            name={settings.creator_name}
            avatarUrl={settings.creator_avatar_url || undefined}
          />
        )}

        {/* Headline impactante acima da dobra */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {headline}
          </h2>
          <p className="text-lg text-gray-600">{subheadline}</p>
        </div>

        {/* Hero Image */}
        {data.imageUrl ? (
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-lg mb-6">
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
          <div className="aspect-[21/9] rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-6 shadow-lg">
            <span className="text-7xl">{data.icon}</span>
          </div>
        ) : (
          <div className="aspect-[21/9] rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-6 shadow-lg">
            {data.type === 'challenge' ? (
              <Target className="w-20 h-20 text-white" />
            ) : (
              <Gift className="w-20 h-20 text-white" />
            )}
          </div>
        )}

        {/* CTA Button - Topo */}
        <div className="mb-6">
          <Link href={npsUrl}>
            <Button
              size="lg"
              variant="cta"
              className="cta-button w-full py-5 text-lg font-semibold shadow-lg"
            >
              {ctaText.primary}
            </Button>
          </Link>
        </div>

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

        {/* CTA Button - Meio */}
        <div className="my-6">
          <Link href={npsUrl}>
            <Button
              size="lg"
              variant="outline"
              className="w-full py-4 text-base font-semibold border-2 border-primary-500 text-primary-600 hover:bg-primary-50"
            >
              {ctaText.primary}
            </Button>
          </Link>
        </div>

        {/* Informações específicas */}
        <FadeInSection delay={100}>
          {data.type === 'challenge' ? (
            <ChallengeInfo data={data} />
          ) : (
            <RewardInfo data={data} />
          )}
        </FadeInSection>

        {/* FOMO - Corações viram dinheiro (apenas para desafios) */}
        {data.type === 'challenge' && (
          <FadeInSection delay={150}>
            <CashPrizeFomo />
          </FadeInSection>
        )}

        {/* CTA Button */}
        <FadeInSection delay={200}>
          <div className="mt-8 space-y-4">
            <Link href={npsUrl}>
              <Button
                size="lg"
                variant="cta"
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
