import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // Verificar se é admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    // Fazer fetch da página
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArenaTeAmoBot/1.0)',
      },
    });
    
    const html = await response.text();
    
    // Extrair meta tags usando regex (simples, sem depender de cheerio)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
    
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    
    const title = ogTitleMatch?.[1] || titleMatch?.[1] || '';
    const description = ogDescMatch?.[1] || descMatch?.[1] || '';
    const image = ogImageMatch?.[1] || '';

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
    });
  } catch (error) {
    console.error('Erro ao extrair dados da URL:', error);
    return NextResponse.json({ error: 'Erro ao extrair dados' }, { status: 500 });
  }
}
