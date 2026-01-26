import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar service role para operações admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const dynamic = 'force-dynamic';

// Atualiza o snapshot do ranking diariamente
export async function GET(request: Request) {
  // Verificar cron secret (opcional mas recomendado)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Chamar a função que atualiza o snapshot
    const { error } = await supabase.rpc('update_ranking_snapshot');
    
    if (error) {
      console.error('Error updating ranking snapshot:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ranking snapshot updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in ranking snapshot cron:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
