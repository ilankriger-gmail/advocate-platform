import { NextRequest, NextResponse } from 'next/server';
import { syncLinkDoBemCampaigns } from '@/lib/linkdobem/sync';

// Secret para proteger o endpoint (usar em cron jobs)
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/linkdobem/sync
 * Sincroniza campanhas do Link do Bem
 * Protegido por CRON_SECRET ou autenticação admin
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    // Aceita CRON_SECRET ou Bearer token de admin
    const isAuthorized = 
      (CRON_SECRET && cronSecret === CRON_SECRET) ||
      (authHeader?.startsWith('Bearer '));

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Executar sincronização
    const result = await syncLinkDoBemCampaigns();

    return NextResponse.json({
      success: !result.error,
      ...result,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return NextResponse.json(
      { error: 'Erro interno', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/linkdobem/sync
 * Retorna status da última sincronização
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/linkdobem/sync',
    method: 'POST',
    description: 'Sincroniza campanhas do Link do Bem',
    headers: {
      'x-cron-secret': 'CRON_SECRET (para cron jobs)',
      'authorization': 'Bearer token (para admins)',
    },
  });
}
