import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Cron job de onboarding automático
 * - Envia notificação de boas-vindas para novos usuários (< 1h)
 * - Envia lembrete 24h para quem não postou ainda
 * 
 * Rodar a cada 15 minutos via Vercel Cron
 */
export async function GET(request: Request) {
  // Verificar cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Em dev, permitir sem auth
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results = {
    welcomesSent: 0,
    remindersSent: 0,
    errors: [] as string[],
  };

  try {
    // 1. BOAS-VINDAS: Usuários criados na última hora sem notificação de welcome
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: newUsers, error: newUsersError } = await supabase
      .from('users')
      .select('id, display_name, full_name, email')
      .gt('created_at', oneHourAgo)
      .is('welcome_sent_at', null);

    if (newUsersError) {
      results.errors.push(`Erro ao buscar novos usuários: ${newUsersError.message}`);
    } else if (newUsers && newUsers.length > 0) {
      for (const user of newUsers) {
        const name = user.display_name || user.full_name || 'amigo(a)';
        
        // Criar notificação de boas-vindas
        const { error: notifError } = await supabase
          .from('user_notifications')
          .insert({
            user_id: user.id,
            type: 'system',
            title: `Bem-vindo(a) à Arena, ${name}! 🎉`,
            message: 'Faça seu primeiro post e ganhe seu primeiro ❤️! Mostre pra comunidade quem você é.',
            data: { action: 'welcome', link: '/feed' },
          });

        if (notifError) {
          results.errors.push(`Erro notif welcome ${user.id}: ${notifError.message}`);
        } else {
          // Marcar welcome como enviado
          await supabase
            .from('users')
            .update({ welcome_sent_at: new Date().toISOString() })
            .eq('id', user.id);
          
          results.welcomesSent++;
        }
      }
    }

    // 2. LEMBRETE 24H: Usuários criados há 24-48h sem posts
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from('users')
      .select('id, display_name, full_name')
      .lt('created_at', twentyFourHoursAgo)
      .gt('created_at', fortyEightHoursAgo)
      .is('reminder_24h_sent_at', null);

    if (inactiveError) {
      results.errors.push(`Erro ao buscar inativos: ${inactiveError.message}`);
    } else if (inactiveUsers && inactiveUsers.length > 0) {
      for (const user of inactiveUsers) {
        // Verificar se tem posts
        const { count: postCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (postCount === 0) {
          const name = user.display_name || user.full_name || '';
          
          // Enviar lembrete
          const { error: reminderError } = await supabase
            .from('user_notifications')
            .insert({
              user_id: user.id,
              type: 'system',
              title: 'Sentimos sua falta! 💔',
              message: `${name ? name + ', a' : 'A'} comunidade está te esperando! Faça seu primeiro post e comece a ganhar corações.`,
              data: { action: 'reminder_24h', link: '/feed' },
            });

          if (reminderError) {
            results.errors.push(`Erro reminder ${user.id}: ${reminderError.message}`);
          } else {
            // Marcar lembrete como enviado
            await supabase
              .from('users')
              .update({ reminder_24h_sent_at: new Date().toISOString() })
              .eq('id', user.id);
            
            results.remindersSent++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro no cron de onboarding:', error);
    return NextResponse.json(
      { error: 'Erro interno', details: String(error), ...results },
      { status: 500 }
    );
  }
}
