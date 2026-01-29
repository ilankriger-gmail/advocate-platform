import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const cleanEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', cleanEmail)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Você já está na lista! 💛' }, { status: 200 });
    }

    // Insert new subscriber
    const { error } = await supabase.from('newsletter_subscribers').insert({
      email: cleanEmail,
      name: name?.trim() || null,
      source: 'landing-page',
      subscribed_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Newsletter subscribe error:', error);
      return NextResponse.json({ error: 'Erro ao salvar. Tenta de novo?' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Você está na lista! 🎉 Fique de olho no seu email.' }, { status: 201 });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Erro interno. Tenta de novo?' }, { status: 500 });
  }
}
