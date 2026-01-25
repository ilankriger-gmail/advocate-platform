import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Button, Badge } from '@/components/ui';
import { CopyUrlButton } from './CopyUrlButton';


export const dynamic = 'force-dynamic';
export default async function AdminLandingPagesPage() {
  const supabase = await createClient();

  // Buscar desafios ativos
  const { data: challenges } = await supabase
    .from('challenges')
    .select('id, title, icon, type, is_active, thumbnail_url')
    .order('created_at', { ascending: false });

  // Buscar premios ativos
  const { data: rewards } = await supabase
    .from('rewards')
    .select('id, name, type, is_active, image_url')
    .order('created_at', { ascending: false });

  // Buscar contagem de leads por source
  const { data: leadsCount } = await supabase
    .from('nps_leads')
    .select('source_type, source_id')
    .not('source_id', 'is', null);

  // Mapear contagem de leads por source_id
  const leadsMap = new Map<string, number>();
  (leadsCount || []).forEach((lead) => {
    if (lead.source_id) {
      const current = leadsMap.get(lead.source_id) || 0;
      leadsMap.set(lead.source_id, current + 1);
    }
  });

  // Processar dados
  const challengeItems = (challenges || []).map((c) => ({
    ...c,
    leadsCount: leadsMap.get(c.id) || 0,
    lpType: 'desafio' as const,
    lpUrl: `/lp/desafio/${c.id}`,
    lpUrlDireto: `/lp-direto/desafio/${c.id}`,
  }));

  const rewardItems = (rewards || []).map((r) => ({
    ...r,
    leadsCount: leadsMap.get(r.id) || 0,
    lpType: 'premio' as const,
    lpUrl: `/lp/premio/${r.id}`,
    lpUrlDireto: `/lp-direto/premio/${r.id}`,
  }));

  // Calcular totais
  const totalLPs = challengeItems.length + rewardItems.length;
  const totalLeads = (leadsCount || []).length;
  const activeChallenges = challengeItems.filter((c) => c.is_active).length;
  const activeRewards = rewardItems.filter((r) => r.is_active).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Landing Pages</h1>
            <p className="text-gray-500 text-sm mt-0.5">Gerencie links para captacao de leads</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700">{totalLPs}</p>
              <p className="text-xs text-indigo-600">Total LPs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-pink-50 to-red-50 border-pink-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-700">{challengeItems.length}</p>
              <p className="text-xs text-pink-600">Desafios</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🎁</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{rewardItems.length}</p>
              <p className="text-xs text-amber-600">Premios</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">👥</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{totalLeads}</p>
              <p className="text-xs text-green-600">Leads Gerados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Desafios */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <h2 className="text-xl font-bold text-gray-900">Desafios</h2>
          <Badge className="bg-pink-100 text-pink-700">{challengeItems.length}</Badge>
          <Badge className="bg-green-100 text-green-700">{activeChallenges} ativos</Badge>
        </div>

        {challengeItems.length > 0 ? (
          <div className="grid gap-3">
            {challengeItems.map((item) => (
              <LandingPageCard
                key={item.id}
                id={item.id}
                title={item.title}
                icon={item.icon}
                type={item.type}
                isActive={item.is_active}
                leadsCount={item.leadsCount}
                lpUrl={item.lpUrl}
                lpUrlDireto={item.lpUrlDireto}
                lpType="desafio"
                thumbnailUrl={item.thumbnail_url}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center bg-gray-50">
            <p className="text-gray-500">Nenhum desafio criado ainda</p>
            <Link href="/admin/desafios/novo" className="inline-block mt-2">
              <Button size="sm" variant="outline">Criar Desafio</Button>
            </Link>
          </Card>
        )}
      </section>

      {/* Premios */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <h2 className="text-xl font-bold text-gray-900">Premios</h2>
          <Badge className="bg-amber-100 text-amber-700">{rewardItems.length}</Badge>
          <Badge className="bg-green-100 text-green-700">{activeRewards} ativos</Badge>
        </div>

        {rewardItems.length > 0 ? (
          <div className="grid gap-3">
            {rewardItems.map((item) => (
              <LandingPageCard
                key={item.id}
                id={item.id}
                title={item.name}
                type={item.type}
                isActive={item.is_active}
                leadsCount={item.leadsCount}
                lpUrl={item.lpUrl}
                lpUrlDireto={item.lpUrlDireto}
                lpType="premio"
                imageUrl={item.image_url}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center bg-gray-50">
            <p className="text-gray-500">Nenhum premio criado ainda</p>
            <Link href="/admin/premios" className="inline-block mt-2">
              <Button size="sm" variant="outline">Criar Premio</Button>
            </Link>
          </Card>
        )}
      </section>
    </div>
  );
}

interface LandingPageCardProps {
  id: string;
  title: string;
  icon?: string;
  type: string;
  isActive: boolean;
  leadsCount: number;
  lpUrl: string;
  lpUrlDireto: string;
  lpType: 'desafio' | 'premio';
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
}

function LandingPageCard({
  id,
  title,
  icon,
  type,
  isActive,
  leadsCount,
  lpUrl,
  lpUrlDireto,
  lpType,
  thumbnailUrl,
  imageUrl,
}: LandingPageCardProps) {
  const getTypeBadge = () => {
    const typeStyles: Record<string, string> = {
      fisico: 'bg-blue-100 text-blue-700',
      engajamento: 'bg-purple-100 text-purple-700',
      participe: 'bg-green-100 text-green-700',
      digital: 'bg-cyan-100 text-cyan-700',
      physical: 'bg-orange-100 text-orange-700',
    };
    const style = typeStyles[type] || 'bg-gray-100 text-gray-700';
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    return <Badge className={style}>{label}</Badge>;
  };

  const detailsUrl = lpType === 'desafio' ? `/admin/desafios/${id}` : `/admin/premios`;

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${!isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-4">
        {/* Thumbnail/Icon */}
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
          {thumbnailUrl || imageUrl ? (
            <img
              src={thumbnailUrl || imageUrl || ''}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl">{icon || (lpType === 'premio' ? '🎁' : '🎯')}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
            {getTypeBadge()}
            <Badge className={isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
              {isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1 font-mono truncate">{lpUrl}</p>
        </div>

        {/* Leads Count */}
        <div className="text-center px-4 border-l border-gray-100">
          <p className="text-2xl font-bold text-indigo-600">{leadsCount}</p>
          <p className="text-xs text-gray-500">leads</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <CopyUrlButton url={lpUrl} urlDireto={lpUrlDireto} />
          <Link href={lpUrl} target="_blank">
            <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Button>
          </Link>
          <Link href={detailsUrl}>
            <Button size="sm" variant="outline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
