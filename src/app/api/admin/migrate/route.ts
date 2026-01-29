import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Testar se a coluna winner_message existe
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('winner_message')
    .limit(1);

  if (error?.message?.includes('winner_message')) {
    return NextResponse.json({
      status: 'missing_column',
      message: 'Run this SQL in Supabase Dashboard: ALTER TABLE challenge_participants ADD COLUMN winner_message TEXT DEFAULT NULL;'
    });
  }

  return NextResponse.json({ status: 'ok', message: 'Column exists' });
}
