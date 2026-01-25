import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trophy, Target, Clock, Repeat, Gift, Package, Users, Sparkles, Banknote, Zap } from 'lucide-react';
import { getLandingPageData, LandingPageData } from '@/actions/landing-pages';
import { getSiteSettings } from '@/lib/config/site';
import { Button } from '@/components/ui';
import { CountdownTimer, ScarcityIndicator, FadeInSection } from '@/components/landing';

// Função para sanitizar HTML e converter texto em parágrafos
// Remove tags perigosas mantendo formatação básica

export const dynamic = 'force-dynamic';

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

// Converte texto plano em parágrafos HTML
function formatDescription(text: string): string {
  if (!text) return '';
  
  // Se já tem tags HTML, apenas sanitiza
  if (/<[^>]+>/.test(text)) {
    return sanitizeHtml(text);
  }
  
  // Converte quebras de linha em parágrafos
  const paragraphs = text
    .split(/\n\n+/) // Divide por linhas duplas (parágrafos)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      // Converte quebras simples em <br>
      const withBr = p.replace(/\n/g, '<br>');
      return `<p>${withBr}</p>`;
    });
  
  return paragraphs.join('');
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

  // Sanitizar título para SEO - remover palavras sensíveis para plataformas
  const sensitiveTerms = ['pix', 'dinheiro', 'reais', 'r$', 'money'];
  const titleLower = data.title.toLowerCase();
  const hasSensitiveTerm = sensitiveTerms.some(term => titleLower.includes(term));

  // Se contém termo sensível, usar título genérico e não indexar
  const safeTitle = hasSensitiveTerm 
    ? `Desafio Exclusivo | ${settings.site_name}`
    : `${data.title} | ${settings.site_name}`;

  const safeOgTitle = hasSensitiveTerm ? 'Desafio Exclusivo' : data.title;

  return {
    title: safeTitle,
    description: data.description || `Participe deste ${type === 'desafio' ? 'desafio' : 'prêmio'} exclusivo!`,
    // Não indexar páginas com termos sensíveis
    robots: hasSensitiveTerm ? { index: false, follow: false } : undefined,
    openGraph: {
      title: safeOgTitle,
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

  // Tipos de prêmio: physical, digital, money
  if (data.rewardType === 'physical') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
        <Package className="w-4 h-4" />
        Prêmio Físico
      </span>
    );
  }

  if (data.rewardType === 'money') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
        <Banknote className="w-4 h-4" />
        Recompensa em Dinheiro
      </span>
    );
  }

  // Default: digital
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
      <Gift className="w-4 h-4" />
      Prêmio Digital
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

// Componente FOMO - Mostra que corações viram dinheiro
function CashPrizeFomo() {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 my-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-green-500 rounded-full">
          <Banknote className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-green-800 text-sm">Acumule corações!</h3>
          <p className="text-xs text-green-600">Complete tarefas e troque por recompensas</p>
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
        Quanto mais tarefas completar, mais corações você acumula!
      </p>
    </div>
  );
}

// Disclaimer legal
function Disclaimer() {
  return (
    <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs text-gray-500 text-center leading-relaxed">
        <strong>Importante:</strong> Os prêmios e recompensas estão sujeitos à conclusão das tarefas e desafios propostos.
        A quantidade de corações acumulados depende do seu desempenho e participação.
        Prêmios em dinheiro ou produtos físicos estão sujeitos à disponibilidade e regulamento da campanha.
      </p>
    </div>
  );
}

// Badge do criador com foto e nome
function CreatorBadge({ avatarUrl, name, type }: { avatarUrl?: string; name?: string; type?: 'challenge' | 'reward' }) {
  const displayName = name || 'O Moço do Te Amo';
  const label = type === 'reward' ? 'Comunidade do' : 'Desafio do';
  
  return (
    <div className="flex items-center justify-center gap-3 py-4 mb-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-pink-400 shadow-lg">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="text-left">
        <p className="text-sm text-gray-500 leading-tight">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">{displayName}</p>
      </div>
    </div>
  );
}

// Gerar headline impactante baseado no tipo
function getHeadline(data: LandingPageData): { headline: string; subheadline: string } {
  if (data.type === 'challenge') {
    const headlines: Record<string, { headline: string; subheadline: string }> = {
      fisico: {
        headline: `Complete o desafio e acumule até ${data.coinsReward || 0} corações!`,
        subheadline: 'Troque seus corações por produtos, experiências e dinheiro',
      },
      engajamento: {
        headline: `Participe e acumule até ${data.coinsReward || 0} corações!`,
        subheadline: 'Complete as tarefas e troque por prêmios incríveis',
      },
      participe: {
        headline: 'Participe do desafio e concorra a prêmios!',
        subheadline: 'Complete as tarefas para ganhar corações e trocar por recompensas',
      },
      atos_amor: {
        headline: 'Faça a diferença com um ato de amor!',
        subheadline: `Complete a tarefa para acumular até ${data.coinsReward || 0} corações`,
      },
    };
    return headlines[data.challengeType || 'engajamento'];
  }

  // Para prêmios - deixar claro que precisa acumular corações primeiro
  return {
    headline: 'Prêmio disponível para resgate!',
    subheadline: `Acumule ${data.coinsRequired || 0} corações completando desafios para resgatar`,
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

  // Para prêmios - deixar claro que precisa acumular corações
  if (data.quantityAvailable && data.quantityAvailable <= 5) {
    return {
      primary: 'Cadastrar e Ver Como Participar',
      secondary: `Apenas ${data.quantityAvailable} ${data.quantityAvailable === 1 ? 'unidade disponível' : 'unidades disponíveis'} • Requer ${data.coinsRequired || 0} corações`,
    };
  }

  return {
    primary: 'Cadastrar e Ver Como Participar',
    secondary: `Complete desafios, acumule ${data.coinsRequired || 0} corações e resgate`,
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
  const { headline, subheadline } = getHeadline(data);
  const ctaText = getCTAText(data);
  const participantsCount = data.type === 'challenge' ? data.participantsCount : data.redemptionsCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Conteúdo principal */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Badge do criador */}
        <CreatorBadge 
          avatarUrl={settings.creator_avatar_url} 
          name={settings.creator_name || 'O Moço do Te Amo'}
          type={data.type}
        />

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

        {/* Descrição - para prêmios de dinheiro, mostra texto explicativo padrão */}
        {data.type === 'reward' && data.rewardType === 'money' ? (
          <div className="prose prose-lg text-gray-600 mb-6 prose-p:mb-4 prose-p:leading-relaxed">
            <p>
              Este prêmio em dinheiro está disponível para membros da comunidade que 
              acumularem <strong>{data.coinsRequired?.toLocaleString() || 0} corações</strong>.
            </p>
            <p>
              Para participar, você precisa se cadastrar na comunidade e completar 
              desafios para ganhar corações. Quando tiver corações suficientes, 
              poderá solicitar o resgate.
            </p>
          </div>
        ) : data.description ? (
          <div
            className="prose prose-lg text-gray-600 mb-6 prose-p:mb-4 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatDescription(data.description) }}
          />
        ) : null}

        {/* CTA Button - Meio */}
        <div className="my-6">
          <Link href={ctaUrl}>
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
            <Link href={ctaUrl}>
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
              <span>Cadastro seguro, rápido e gratuito</span>
            </div>
          </div>
        </FadeInSection>

        {/* Disclaimer legal */}
        <FadeInSection delay={350}>
          <Disclaimer />
        </FadeInSection>
      </main>

      {/* Footer simples */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} {settings.site_name}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
