/**
 * Script para enviar emails de aprovação para leads aprovados que nunca receberam email
 * Executa via: npx tsx scripts/send-lead-emails.ts
 * 
 * Resend rate limit: 10 emails/segundo no plano pago
 * Vamos fazer 2/segundo pra ser seguro
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gsxanzgwstlpfvnqcmiu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const resend = new Resend(RESEND_API_KEY);

const BASE_URL = 'https://comunidade.omocodoteamo.com.br';
const FROM_EMAIL = 'noreply@omocodoteamo.com.br';
const FROM_NAME = 'Arena Te Amo';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 2; // emails por segundo
const DELAY_MS = 1000; // delay entre batches

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getEmailSettings() {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'site_name',
      'email_approval_subject',
      'email_approval_greeting',
      'email_approval_message',
      'email_approval_benefits',
      'email_approval_cta',
      'email_approval_footer',
    ]);

  const settings: Record<string, string> = {};
  data?.forEach(s => { settings[s.key] = s.value; });
  return settings;
}

function replaceVars(text: string, vars: Record<string, string>) {
  return text
    .replace(/\{\{site_name\}\}/g, vars.site_name || '')
    .replace(/\{\{name\}\}/g, vars.name || '')
    .replace(/\{\{email\}\}/g, vars.email || '');
}

function buildEmailHtml(settings: Record<string, string>, name: string, email: string, registrationUrl: string) {
  const vars = { site_name: settings.site_name, name, email };
  const subject = replaceVars(settings.email_approval_subject, vars);
  const greeting = replaceVars(settings.email_approval_greeting, vars);
  const message = replaceVars(settings.email_approval_message, vars);
  const benefits = settings.email_approval_benefits.split(',').map(b => b.trim());
  const ctaText = settings.email_approval_cta;
  const footer = settings.email_approval_footer;
  const benefitsHtml = benefits.map(b => `<li>${b}</li>`).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${settings.site_name}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #111827; margin: 0 0 20px; font-size: 24px;">${greeting}</h2>
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">${message}</p>
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Agora você pode criar sua conta na plataforma e participar de:</p>
                  <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                    ${benefitsHtml}
                  </ul>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 18px; font-weight: bold;">${ctaText}</a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 30px 0 0;">${footer}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { html, subject };
}

async function main() {
  console.log(`🚀 Iniciando envio de emails para leads aprovados...`);
  if (DRY_RUN) console.log('⚠️  MODO DRY RUN - nenhum email será enviado');

  // Buscar leads aprovados que nunca receberam email
  const { data: leads, error } = await supabase
    .from('nps_leads')
    .select('id, email, name, email_sent')
    .eq('status', 'approved')
    .or('email_sent.is.null,email_sent.eq.false')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar leads:', error);
    process.exit(1);
  }

  console.log(`📊 ${leads?.length || 0} leads aprovados sem email enviado (bruto)`);

  if (!leads || leads.length === 0) {
    console.log('✅ Nenhum lead pendente de email');
    process.exit(0);
  }

  // Deduplicar por email (manter o lead mais recente)
  const seenEmails = new Set<string>();
  const uniqueLeads = [];
  // leads já vem em ordem created_at ASC, queremos o mais recente por email
  const reversed = [...leads].reverse();
  for (const lead of reversed) {
    const email = lead.email.toLowerCase().trim();
    if (!seenEmails.has(email)) {
      seenEmails.add(email);
      uniqueLeads.push(lead);
    }
  }
  // Reverter de volta pra ordem cronológica
  uniqueLeads.reverse();

  console.log(`📊 ${uniqueLeads.length} leads únicos (${leads.length - uniqueLeads.length} duplicados removidos)`);

  // Buscar configurações de email
  const settings = await getEmailSettings();
  console.log(`📧 De: ${FROM_NAME} <${FROM_EMAIL}>`);
  console.log(`📝 Assunto: ${settings.email_approval_subject}`);

  let sent = 0;
  let errors = 0;

  for (let i = 0; i < uniqueLeads.length; i += BATCH_SIZE) {
    const batch = uniqueLeads.slice(i, i + BATCH_SIZE);

    for (const lead of batch) {
      const registrationUrl = `${BASE_URL}/registro?email=${encodeURIComponent(lead.email)}`;
      const { html, subject } = buildEmailHtml(settings, lead.name, lead.email, registrationUrl);

      if (DRY_RUN) {
        console.log(`  [DRY] ${lead.email} (${lead.name})`);
        sent++;
        continue;
      }

      try {
        const { error: sendError } = await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [lead.email],
          subject,
          html,
        });

        if (sendError) {
          console.error(`  ❌ ${lead.email}: ${sendError.message}`);
          errors++;
          continue;
        }

        // Marcar como enviado no banco
        await supabase
          .from('nps_leads')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            sequence_step: 1,
          })
          .eq('id', lead.id);

        sent++;
        console.log(`  ✅ ${sent}/${uniqueLeads.length} - ${lead.email}`);
      } catch (err) {
        console.error(`  ❌ ${lead.email}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        errors++;
      }
    }

    // Rate limit delay
    if (i + BATCH_SIZE < uniqueLeads.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`  ✅ Enviados: ${sent}`);
  console.log(`  ❌ Erros: ${errors}`);
  console.log(`  📧 Total únicos: ${uniqueLeads.length}`);
}

main().catch(console.error);
