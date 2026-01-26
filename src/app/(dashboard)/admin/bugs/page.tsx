import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui';
import { Bug, Clock, User, Globe, Monitor, CheckCircle, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface BugReport {
  id: string;
  user_id: string | null;
  description: string;
  url: string | null;
  user_agent: string | null;
  status: string;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string | null;
  };
}

async function getBugReports(): Promise<BugReport[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('bug_reports')
    .select(`
      *,
      user:users!bug_reports_user_id_fkey(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Erro ao buscar bugs:', error);
    return [];
  }

  return data || [];
}

export default async function BugsAdminPage() {
  const bugs = await getBugReports();

  const pendingCount = bugs.filter(b => b.status === 'pending').length;
  const resolvedCount = bugs.filter(b => b.status === 'resolved').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bug className="w-7 h-7 text-gray-700" />
            Relatórios de Bugs
          </h1>
          <p className="text-gray-500 mt-1">Bugs reportados pelos usuários</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{bugs.length}</div>
          <div className="text-sm text-gray-500">Total</div>
        </Card>
        <Card className="p-4 text-center bg-yellow-50 border-yellow-200">
          <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-sm text-yellow-700">Pendentes</div>
        </Card>
        <Card className="p-4 text-center bg-green-50 border-green-200">
          <div className="text-3xl font-bold text-green-600">{resolvedCount}</div>
          <div className="text-sm text-green-700">Resolvidos</div>
        </Card>
      </div>

      {/* Bug List */}
      {bugs.length === 0 ? (
        <Card className="p-12 text-center">
          <Bug className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum bug reportado</h3>
          <p className="text-gray-500">Quando usuários reportarem bugs, eles aparecerão aqui.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bugs.map((bug) => (
            <Card key={bug.id} className="p-4">
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className={`p-2 rounded-full ${
                  bug.status === 'resolved' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {bug.status === 'resolved' 
                    ? <CheckCircle className="w-5 h-5" />
                    : <AlertCircle className="w-5 h-5" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 whitespace-pre-wrap">{bug.description}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                    {/* User */}
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{bug.user?.full_name || bug.user?.email || 'Anônimo'}</span>
                    </div>

                    {/* URL */}
                    {bug.url && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{bug.url}</span>
                      </div>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatRelativeTime(bug.created_at)}</span>
                    </div>
                  </div>

                  {/* User Agent */}
                  {bug.user_agent && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                      <Monitor className="w-3 h-3" />
                      <span className="truncate">{bug.user_agent.substring(0, 100)}...</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
