import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API para verificar status das integrações
 * Retorna quais APIs estão configuradas sem expor as chaves
 * REQUIRES: admin authentication
 */
export async function GET() {
  // Security: require admin authentication
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

  const integrations = {
    // Supabase (obrigatório)
    supabase: {
      name: 'Supabase',
      description: 'Banco de dados e autenticação',
      configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      required: true,
      docs: 'https://supabase.com/docs',
      variables: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    },

    // OpenAI
    openai: {
      name: 'OpenAI',
      description: 'Geração de thumbnails (DALL-E) e análise de leads (GPT-4)',
      configured: !!process.env.OPENAI_API_KEY,
      required: false,
      docs: 'https://platform.openai.com/api-keys',
      variables: ['OPENAI_API_KEY'],
    },

    // Gemini
    gemini: {
      name: 'Google Gemini',
      description: 'Análise automática de vídeos (YouTube e Instagram)',
      configured: !!process.env.GEMINI_API_KEY,
      required: false,
      docs: 'https://aistudio.google.com/app/apikey',
      variables: ['GEMINI_API_KEY'],
    },

    // Resend (Email)
    resend: {
      name: 'Resend',
      description: 'Envio de emails transacionais',
      configured: !!process.env.RESEND_API_KEY,
      required: false,
      docs: 'https://resend.com/docs',
      variables: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'RESEND_WEBHOOK_SECRET'],
    },

    // WhatsApp Meta
    whatsapp: {
      name: 'WhatsApp (Meta)',
      description: 'Envio de mensagens WhatsApp',
      configured: !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN),
      required: false,
      docs: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
      variables: ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_APP_SECRET', 'WHATSAPP_WEBHOOK_VERIFY_TOKEN'],
    },

    // YouTube
    youtube: {
      name: 'YouTube Data API',
      description: 'Buscar vídeos do canal para desafios',
      configured: !!process.env.YOUTUBE_API_KEY,
      required: false,
      docs: 'https://console.cloud.google.com/apis/credentials',
      variables: ['YOUTUBE_API_KEY', 'YOUTUBE_CHANNEL_HANDLE'],
    },

    // Upstash Redis
    redis: {
      name: 'Upstash Redis',
      description: 'Rate limiting e cache',
      configured: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      required: false,
      docs: 'https://upstash.com/docs/redis/overall/getstarted',
      variables: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    },

    // Sightengine (Moderação de Imagens)
    sightengine: {
      name: 'Sightengine',
      description: 'Moderação automática de imagens (nudez, armas, violência)',
      configured: !!(process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET),
      required: false,
      docs: 'https://sightengine.com/docs',
      variables: ['SIGHTENGINE_API_USER', 'SIGHTENGINE_API_SECRET'],
    },

    // Perspective API (Moderação de Texto)
    perspective: {
      name: 'Google Perspective',
      description: 'Moderação de texto (toxicidade, insultos, ameaças) - Gratuita',
      configured: !!process.env.PERSPECTIVE_API_KEY,
      required: false,
      docs: 'https://perspectiveapi.com',
      variables: ['PERSPECTIVE_API_KEY'],
    },

    // Cron
    cron: {
      name: 'Cron Jobs',
      description: 'Tarefas agendadas (emails, follow-up)',
      configured: !!process.env.CRON_SECRET,
      required: false,
      docs: 'https://vercel.com/docs/cron-jobs',
      variables: ['CRON_SECRET'],
    },
  };

  // Contar estatísticas
  const total = Object.keys(integrations).length;
  const configured = Object.values(integrations).filter(i => i.configured).length;
  const required = Object.values(integrations).filter(i => i.required).length;
  const requiredConfigured = Object.values(integrations).filter(i => i.required && i.configured).length;

  return NextResponse.json({
    integrations,
    stats: {
      total,
      configured,
      required,
      requiredConfigured,
    },
  });
}
