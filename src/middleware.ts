import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Atualiza a sessão do Supabase
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Regex para caminhos que requerem atualização de sessão:
     * - todas as rotas exceto arquivos estáticos, favicon, api/mobile, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/mobile|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}