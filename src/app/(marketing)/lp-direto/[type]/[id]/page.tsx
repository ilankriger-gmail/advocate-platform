import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trophy, Target, Clock, Repeat, Gift, Package, Users, Sparkles, Banknote } from 'lucide-react';
import { getLandingPageData, LandingPageData } from '@/actions/landing-pages';
import { getSiteSettings } from '@/lib/config/site';
import { Button } from '@/components/ui';
import { CountdownTimer, FadeInSection } from '@/components/landing';

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
        primary: 'Cadastrar e Participar',
        secondary: 'Cadastre-se e complete o desafio para ganhar corações',
      },
      engajamento: {
        primary: 'Cadastrar e Participar',
        secondary: 'É rápido, simples e você ganha corações',
      },
      participe: {
        primary: 'Cadastrar e Participar',
        secondary: 'Cadastre-se gratuitamente e concorra',
      },
      atos_amor: {
        primary: 'Cadastrar e Ajudar',
        secondary: 'Faça um ato de amor e seja recompensado',
      },
    };
    return ctas[data.challengeType || 'engajamento'];
  }

  // Para prêmios
  if (data.quantityAvailable && data.quantityAvailable <= 5) {
    return {
      primary: 'Cadastrar e Resgatar',
      secondary: `Corra! Apenas ${data.quantityAvailable} ${data.quantityAvailable === 1 ? 'unidade disponível' : 'unidades disponíveis'}`,
    };
  }

  return {
    primary: 'Cadastrar e Resgatar',
    secondary: `Use ${data.coinsRequired || 0} corações para resgatar`,
  };
}

export default async function LandingPageDireto({ params }: PageProps) {
  const { type, id } = await params;

  if (!isValidType(type)) {
    notFound();
  }

  const result = await getLandingPageData(type, id);

  if (result.error || !result.data) {
    notFound();
  }

  const data = result.data;
  const settings = await getSiteSettings(['site_name', 'logo_url', 'creator_name', 'creator_avatar_url']);

  // Construir URL de redirecionamento - vai DIRETO para registro (sem NPS)
  const sourceType = data.type === 'challenge' ? 'landing_challenge_direto' : 'landing_reward_direto';
  const ctaUrl = `/registro?source=${sourceType}&id=${data.id}&name=${encodeURIComponent(data.title)}`;

  // Obter textos dinâmicos
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
          {/* Mini CTA no header */}
          <Link href={ctaUrl}>
            <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white text-xs px-4">
              Participar
            </Button>
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero Card - Tudo integrado */}
        <div className="mb-6">
          {data.imageUrl ? (
            /* Quando tem imagem, mostra imagem + info abaixo */
            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
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
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{data.type === 'challenge' ? data.icon || '🎯' : '🎁'}</span>
                  <div className="flex-1">
                    <TypeBadge data={data} />
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 mt-2">
                      {data.title}
                    </h1>
                  </div>
                </div>
                {/* Recompensa em destaque */}
                {data.type === 'challenge' && data.coinsReward && data.coinsReward > 0 && (
                  <div className="mt-4 flex items-center gap-2 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-3">
                    <Heart className="w-5 h-5 text-pink-500 fill-current" />
                    <span className="text-lg font-bold text-pink-600">+{data.coinsReward}</span>
                    <span className="text-sm text-pink-600">corações de recompensa</span>
                  </div>
                )}
                {/* Meta do desafio */}
                {data.type === 'challenge' && data.goalType && data.goalValue && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    {data.goalType === 'repetitions' ? (
                      <><Repeat className="w-4 h-4" /> Meta: {data.goalValue} repetições</>
                    ) : (
                      <><Clock className="w-4 h-4" /> Meta: {data.goalValue} segundos</>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Quando NÃO tem imagem, Hero Card com gradiente integrado */
            <div className={`rounded-2xl p-6 shadow-lg ${
              data.type === 'challenge'
                ? data.challengeType === 'fisico'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  : data.challengeType === 'atos_amor'
                  ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                  : 'bg-gradient-to-br from-primary-500 to-accent-500'
                : 'bg-gradient-to-br from-amber-500 to-orange-600'
            }`}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl">{data.type === 'challenge' ? data.icon || '🎯' : '🎁'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                      {data.type === 'challenge' ? (
                        data.challengeType === 'fisico' ? 'Desafio Físico' :
                        data.challengeType === 'engajamento' ? 'Engajamento' :
                        data.challengeType === 'participe' ? 'Participe & Ganhe' :
                        data.challengeType === 'atos_amor' ? 'Atos de Amor' : 'Desafio'
                      ) : 'Prêmio'}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                    {data.title}
                  </h1>
                </div>
              </div>

              {/* Recompensa em destaque */}
              {data.type === 'challenge' && data.coinsReward && data.coinsReward > 0 && (
                <div className="mt-5 flex items-center gap-3 bg-white/20 backdrop-blur rounded-xl p-4">
                  <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white fill-current" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white">+{data.coinsReward}</span>
                    <p className="text-sm text-white/80">corações de recompensa</p>
                  </div>
                </div>
              )}

              {/* Meta do desafio */}
              {data.type === 'challenge' && data.goalType && data.goalValue && (
                <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
                  {data.goalType === 'repetitions' ? (
                    <><Repeat className="w-4 h-4" /> Meta: {data.goalValue} repetições</>
                  ) : (
                    <><Clock className="w-4 h-4" /> Meta: {data.goalValue} segundos</>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA Principal - Único e destacado */}
        <div className="mb-4">
          <Link href={ctaUrl}>
            <Button
              size="lg"
              variant="cta"
              className="cta-button w-full py-5 text-lg font-semibold shadow-lg"
            >
              {ctaText.primary}
            </Button>
          </Link>
          <p className="text-center text-sm text-gray-500 mt-2">
            {ctaText.secondary}
          </p>
        </div>

        {/* Social Proof + Urgência - Compacto */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600 mb-6">
          {participantsCount && participantsCount > 0 && (
            <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
              <Users className="w-4 h-4" />
              {participantsCount} {participantsCount === 1 ? 'participou' : 'participaram'}
            </span>
          )}
          {data.type === 'challenge' && data.endsAt && (
            <span className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              Termina em breve
            </span>
          )}
        </div>

        {/* Countdown timer se tiver data limite */}
        {data.type === 'challenge' && data.endsAt && (
          <div className="mb-6">
            <CountdownTimer endsAt={data.endsAt} />
          </div>
        )}

        {/* Descrição do desafio */}
        {data.description && (
          <FadeInSection delay={100}>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">📝</span> Sobre o Desafio
              </h2>
              <div
                className="prose prose-sm text-gray-600"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.description) }}
              />
            </div>
          </FadeInSection>
        )}

        {/* O que você ganha - FOMO */}
        {data.type === 'challenge' && (
          <FadeInSection delay={150}>
            <CashPrizeFomo />
          </FadeInSection>
        )}

        {/* Seção do Criador - No final */}
        {settings.creator_name && (
          <FadeInSection delay={200}>
            <CreatorSection
              name={settings.creator_name}
              avatarUrl={settings.creator_avatar_url || undefined}
            />
          </FadeInSection>
        )}

        {/* CTA Final */}
        <FadeInSection delay={250}>
          <div className="mt-6">
            <Link href={ctaUrl}>
              <Button
                size="lg"
                variant="cta"
                className="cta-button w-full py-5 text-lg font-semibold shadow-lg"
              >
                {ctaText.primary}
              </Button>
            </Link>
          </div>
        </FadeInSection>

        {/* Badge de segurança */}
        <FadeInSection delay={300}>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Cadastro seguro, rápido e gratuito</span>
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
