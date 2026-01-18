import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function middleware(request: NextRequest) {
  // Handle CORS preflight for mobile API
  if (request.nextUrl.pathname.startsWith('/api/mobile')) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Atualiza a sessão do Supabase para outras rotas
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Mobile API routes (para CORS)
    '/api/mobile/:path*',
    /*
     * Regex para caminhos que requerem atualização de sessão:
     * - todas as rotas exceto arquivos estáticos, favicon, api/mobile, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/mobile|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}