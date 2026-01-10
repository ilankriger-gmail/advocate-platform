'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function DebugPage() {
  const { user, profile, isLoading } = useAuth();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Auth State</h1>

      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Loading State</h2>
          <p>{isLoading ? 'Carregando...' : 'Pronto'}</p>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">User (Supabase Auth)</h2>
          {user ? (
            <pre className="text-xs overflow-auto">
              {JSON.stringify({
                id: user.id,
                email: user.email,
                user_metadata: user.user_metadata,
              }, null, 2)}
            </pre>
          ) : (
            <p className="text-red-600">Nenhum usuário logado</p>
          )}
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Profile (tabela users)</h2>
          {profile ? (
            <pre className="text-xs overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          ) : (
            <p className="text-red-600">Profile nulo</p>
          )}
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Logica do Admin Menu</h2>
          <p>profile?.role === admin: <strong>{String(profile?.role === 'admin')}</strong></p>
          <p>profile?.is_creator === true: <strong>{String(profile?.is_creator === true)}</strong></p>
          <p>showAdminLink: <strong>{String(profile?.role === 'admin' || profile?.is_creator === true)}</strong></p>
        </div>
      </div>
    </div>
  );
}
