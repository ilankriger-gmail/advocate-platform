'use server';

import { createAdminClient } from '@/lib/supabase/admin';

// Migracoes para o sistema de desafios fisicos
export async function runChallengeMigrations() {
  const supabase = createAdminClient();

  const migrations = [
    // 1. Adicionar campos de sorteio na tabela challenges
    `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS raffle_enabled BOOLEAN DEFAULT false`,
    `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS raffle_prize_amount DECIMAL(10,2)`,
    `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS raffle_num_winners INTEGER DEFAULT 1`,
    `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS raffle_frequency_days INTEGER DEFAULT 30`,

    // 2. Adicionar campo ai_verdict na tabela challenge_participants
    `ALTER TABLE challenge_participants ADD COLUMN IF NOT EXISTS ai_verdict JSONB`,
    `ALTER TABLE challenge_participants ADD COLUMN IF NOT EXISTS is_raffle_eligible BOOLEAN DEFAULT false`,

    // 3. Criar tabela de sorteios
    `CREATE TABLE IF NOT EXISTS challenge_raffles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
      winner_user_id UUID REFERENCES users(id),
      prize_amount DECIMAL(10,2),
      drawn_at TIMESTAMPTZ DEFAULT now(),
      pix_sent BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,

    // 4. Habilitar RLS na tabela de sorteios
    `ALTER TABLE challenge_raffles ENABLE ROW LEVEL SECURITY`,

    // 5. Politicas de acesso para challenge_raffles
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'challenge_raffles_select' AND tablename = 'challenge_raffles'
      ) THEN
        CREATE POLICY challenge_raffles_select ON challenge_raffles FOR SELECT USING (true);
      END IF;
    END $$`,

    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'challenge_raffles_admin' AND tablename = 'challenge_raffles'
      ) THEN
        CREATE POLICY challenge_raffles_admin ON challenge_raffles FOR ALL
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
      END IF;
    END $$`,
  ];

  const results = [];

  for (const sql of migrations) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Tentar via query direto (para algumas operacoes)
      const { error: error2 } = await supabase.from('_migrations').select('*').limit(0);
      results.push({ sql: sql.substring(0, 50), error: error.message });
    } else {
      results.push({ sql: sql.substring(0, 50), success: true });
    }
  }

  return results;
}

// Funcao para executar SQL diretamente via REST API
export async function executeSql(sql: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: 'Missing credentials' };
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ sql_query: sql }),
  });

  if (!response.ok) {
    // Se a funcao exec_sql nao existe, tenta criar via SQL Editor
    return { error: `SQL execution failed: ${response.statusText}`, needsManualMigration: true };
  }

  return { success: true };
}
