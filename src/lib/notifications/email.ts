import { Resend } from 'resend';
import { getSiteSettings } from '@/lib/config/site';
import { createAdminClient } from '@/lib/supabase/admin';
import type { EmailSendResult } from '@/types/notification';

// Cliente Resend inicializado lazily
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

interface SendApprovalEmailParams {
  to: string;
  name: string;
  loginUrl?: string;
  leadId?: string; // ID do lead para logging
}

interface LogEmailNotificationParams {
  leadId: string;
  messageId: string;
  status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'failed' | 'cancelled';
  sequenceStep?: number; // 1 = email 1, 2 = email 2
}

/**
 * Registra uma notificação de email no banco de dados
 */
export async function logEmailNotification({
  leadId,
  messageId,
  status = 'sent',
  sequenceStep = 1,
}: LogEmailNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('notifications_log')
      .insert({
        lead_id: leadId,
        channel: 'email',
        status,
        external_id: messageId,
        sent_at: new Date().toISOString(),
        metadata: { opened: false },
        sequence_step: sequenceStep,
      });

    if (error) {
      console.error('[Email] Erro ao registrar notificação:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[Email] Erro ao registrar notificação:', err);
    return { success: false, error: 'Erro ao registrar notificação' };
  }
}

/**
 * Atualiza o status de uma notificação de email
 */
export async function updateEmailNotificationStatus(
  messageId: string,
  status: 'delivered' | 'opened' | 'failed',
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = { status };
    if (metadata) {
      updateData.metadata = metadata;
    }

    const { error } = await supabase
      .from('notifications_log')
      .update(updateData)
      .eq('external_id', messageId);

    if (error) {
      console.error('[Email] Erro ao atualizar status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[Email] Erro ao atualizar status:', err);
    return { success: false, error: 'Erro ao atualizar status' };
  }
}

/**
 * Envia email de aprovação para o lead com link de cadastro
 * Retorna message_id para rastreamento de abertura
 */
export async function sendApprovalEmail({
  to,
  name,
  loginUrl,
  leadId,
}: SendApprovalEmailParams): Promise<EmailSendResult> {
  // Gerar link de cadastro com email pre-preenchido
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comunidade.omocodoteamo.com.br';
  const registrationUrl = loginUrl || `${baseUrl}/registro?email=${encodeURIComponent(to)}`;
  try {
    const resend = getResendClient();

    if (!resend) {
      console.warn('Resend not configured - skipping email');
      return { success: false, error: 'Serviço de email não configurado' };
    }

    // Buscar configurações do site e email
    const settings = await getSiteSettings([
      'site_name',
      'email_from_name',
      'email_approval_subject',
      'email_approval_greeting',
      'email_approval_message',
      'email_approval_benefits',
      'email_approval_cta',
      'email_approval_footer',
    ]);

    const siteName = settings.site_name;
    const fromName = settings.email_from_name;

    // Função para substituir variáveis
    const replaceVars = (text: string) =>
      text
        .replace(/\{\{site_name\}\}/g, siteName)
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{email\}\}/g, to);

    // Configurações do email com variáveis substituídas
    const subject = replaceVars(settings.email_approval_subject);
    const greeting = replaceVars(settings.email_approval_greeting);
    const message = replaceVars(settings.email_approval_message);
    const benefits = settings.email_approval_benefits.split(',').map(b => b.trim());
    const ctaText = settings.email_approval_cta;
    const footer = settings.email_approval_footer;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@omocodoteamo.com.br';

    // Gerar lista de benefícios em HTML
    const benefitsHtml = benefits.map(b => `<li>${b}</li>`).join('\n                        ');

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html: `
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
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${siteName}</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #111827; margin: 0 0 20px; font-size: 24px;">${greeting}</h2>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        ${message}
                      </p>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                        Agora você pode criar sua conta na plataforma e participar de:
                      </p>

                      <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                        ${benefitsHtml}
                      </ul>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: bold;">
                              ${ctaText}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                        Use o email <strong>${to}</strong> para criar sua conta.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                        ${footer}<br>
                        <strong style="color: #ec4899;">Equipe ${siteName}</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Erro ao enviar:', error);
      return { success: false, error: error.message };
    }

    const messageId = data?.id;

    // Se temos leadId, registrar a notificação no banco (como step 1)
    if (leadId && messageId) {
      await logEmailNotification({
        leadId,
        messageId,
        status: 'sent',
        sequenceStep: 1,
      });
    }

    return { success: true, message_id: messageId };
  } catch (err) {
    console.error('[Email] Erro ao enviar:', err);
    return { success: false, error: 'Erro ao enviar email' };
  }
}

/**
 * Envia email de follow-up (Email 2) para o lead que não converteu
 * Usa template diferente do email de aprovação
 */
export async function sendFollowupEmail({
  to,
  name,
  loginUrl,
  leadId,
}: SendApprovalEmailParams): Promise<EmailSendResult> {
  // Gerar link de cadastro com email pre-preenchido
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comunidade.omocodoteamo.com.br';
  const registrationUrl = loginUrl || `${baseUrl}/registro?email=${encodeURIComponent(to)}`;

  try {
    const resend = getResendClient();

    if (!resend) {
      console.warn('Resend not configured - skipping email');
      return { success: false, error: 'Serviço de email não configurado' };
    }

    // Buscar configurações do site e email de follow-up
    const settings = await getSiteSettings([
      'site_name',
      'email_from_name',
      'email_followup_subject',
      'email_followup_greeting',
      'email_followup_message',
      'email_followup_benefits',
      'email_followup_cta',
      'email_followup_footer',
    ]);

    const siteName = settings.site_name;
    const fromName = settings.email_from_name;

    // Função para substituir variáveis
    const replaceVars = (text: string) =>
      text
        .replace(/\{\{site_name\}\}/g, siteName)
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{email\}\}/g, to);

    // Configurações do email com variáveis substituídas
    const subject = replaceVars(settings.email_followup_subject);
    const greeting = replaceVars(settings.email_followup_greeting);
    const message = replaceVars(settings.email_followup_message);
    const benefits = settings.email_followup_benefits.split(',').map(b => b.trim());
    const ctaText = settings.email_followup_cta;
    const footer = settings.email_followup_footer;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@omocodoteamo.com.br';

    // Gerar lista de benefícios em HTML
    const benefitsHtml = benefits.map(b => `<li>${b}</li>`).join('\n                        ');

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html: `
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
                  <!-- Header com urgência -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${siteName}</h1>
                      <p style="color: #ffffff; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">Última chance!</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #111827; margin: 0 0 20px; font-size: 24px;">${greeting}</h2>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        ${message}
                      </p>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                        Veja o que você está perdendo:
                      </p>

                      <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                        ${benefitsHtml}
                      </ul>

                      <!-- CTA Button com urgência -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: bold;">
                              ${ctaText}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                        Use o email <strong>${to}</strong> para criar sua conta.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                        ${footer}<br>
                        <strong style="color: #f59e0b;">Equipe ${siteName}</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Erro ao enviar follow-up:', error);
      return { success: false, error: error.message };
    }

    const messageId = data?.id;

    // Se temos leadId, registrar a notificação no banco (como step 2)
    if (leadId && messageId) {
      await logEmailNotification({
        leadId,
        messageId,
        status: 'sent',
        sequenceStep: 2,
      });
    }

    return { success: true, message_id: messageId };
  } catch (err) {
    console.error('[Email] Erro ao enviar follow-up:', err);
    return { success: false, error: 'Erro ao enviar email de follow-up' };
  }
}

/**
 * Verifica se um email foi aberto pelo lead
 */
export async function checkEmailOpened(leadId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('notifications_log')
      .select('status, metadata')
      .eq('lead_id', leadId)
      .eq('channel', 'email')
      .single();

    if (error || !data) {
      return false;
    }

    // Verificar se status é 'opened' ou se metadata.opened é true
    const metadata = data.metadata as Record<string, unknown> | null;
    return data.status === 'opened' || metadata?.opened === true;
  } catch {
    return false;
  }
}

// ============ EMAILS DE ONBOARDING (APÓS CRIAR CONTA) ============

interface SendOnboardingEmailParams {
  to: string;
  name: string;
  userId: string;
  step: 1 | 2 | 3;
}

/**
 * Envia email de onboarding para novo usuário
 * @param step - 1 (boas-vindas), 2 (engajamento), 3 (reengajamento)
 */
export async function sendOnboardingEmail({
  to,
  name,
  userId,
  step,
}: SendOnboardingEmailParams): Promise<EmailSendResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comunidade.omocodoteamo.com.br';

  // URLs específicas por step
  const ctaUrls: Record<number, string> = {
    1: `${baseUrl}/dashboard`,
    2: `${baseUrl}/desafios`,
    3: `${baseUrl}/premios`,
  };

  // Cores do header por step
  const headerColors: Record<number, string> = {
    1: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Verde (boas-vindas)
    2: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Azul (desafios)
    3: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Laranja (prêmios)
  };

  const accentColors: Record<number, string> = {
    1: '#10b981',
    2: '#3b82f6',
    3: '#f59e0b',
  };

  try {
    const resend = getResendClient();

    if (!resend) {
      console.warn('[Onboarding Email] Resend not configured - skipping email');
      return { success: false, error: 'Serviço de email não configurado' };
    }

    // Buscar configurações do site e email específico do step
    const stepKeys = {
      1: ['email_onboarding1_subject', 'email_onboarding1_greeting', 'email_onboarding1_message', 'email_onboarding1_benefits', 'email_onboarding1_cta', 'email_onboarding1_footer'] as const,
      2: ['email_onboarding2_subject', 'email_onboarding2_greeting', 'email_onboarding2_message', 'email_onboarding2_benefits', 'email_onboarding2_cta', 'email_onboarding2_footer'] as const,
      3: ['email_onboarding3_subject', 'email_onboarding3_greeting', 'email_onboarding3_message', 'email_onboarding3_benefits', 'email_onboarding3_cta', 'email_onboarding3_footer'] as const,
    };

    const settingsKeys = ['site_name', 'email_from_name', ...stepKeys[step]] as const;
    const settings = await getSiteSettings([...settingsKeys]);

    const siteName = settings.site_name;
    const fromName = settings.email_from_name;

    // Função para substituir variáveis
    const replaceVars = (text: string) =>
      text
        .replace(/\{\{site_name\}\}/g, siteName)
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{email\}\}/g, to);

    // Configurações do email com variáveis substituídas
    // Usar tipagem explícita para acessar as chaves dinamicamente
    const settingsRecord = settings as Record<string, string>;
    const subject = replaceVars(settingsRecord[`email_onboarding${step}_subject`] || `Email ${step}`);
    const greeting = replaceVars(settingsRecord[`email_onboarding${step}_greeting`] || `Olá ${name}!`);
    const message = replaceVars(settingsRecord[`email_onboarding${step}_message`] || '');
    const benefitsStr = settingsRecord[`email_onboarding${step}_benefits`] || '';
    const benefits = benefitsStr ? benefitsStr.split(',').map((b: string) => b.trim()) : [];
    const ctaText = settingsRecord[`email_onboarding${step}_cta`] || 'Acessar';
    const footer = settingsRecord[`email_onboarding${step}_footer`] || '';

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@omocodoteamo.com.br';
    const ctaUrl = ctaUrls[step];
    const headerColor = headerColors[step];
    const accentColor = accentColors[step];

    // Gerar lista de benefícios em HTML
    const benefitsHtml = benefits.length > 0
      ? benefits.map((b: string) => `<li>${b}</li>`).join('\n                        ')
      : '';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html: `
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
                  <!-- Header -->
                  <tr>
                    <td style="background: ${headerColor}; padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${siteName}</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #111827; margin: 0 0 20px; font-size: 24px;">${greeting}</h2>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        ${message}
                      </p>

                      ${benefits.length > 0 ? `
                      <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                        ${benefitsHtml}
                      </ul>
                      ` : ''}

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${ctaUrl}" style="display: inline-block; background: ${headerColor}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: bold;">
                              ${ctaText}
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                        ${footer}<br>
                        <strong style="color: ${accentColor};">Equipe ${siteName}</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error(`[Onboarding Email ${step}] Erro ao enviar:`, error);
      return { success: false, error: error.message };
    }

    const messageId = data?.id;

    // Atualizar registro de onboarding
    if (userId) {
      const supabase = createAdminClient();
      const updateField = `email_${step}_sent`;
      const updateFieldAt = `email_${step}_sent_at`;

      await supabase
        .from('user_onboarding')
        .update({
          [updateField]: true,
          [updateFieldAt]: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    console.log(`[Onboarding Email ${step}] Enviado para ${to}`);
    return { success: true, message_id: messageId };
  } catch (err) {
    console.error(`[Onboarding Email ${step}] Erro:`, err);
    return { success: false, error: 'Erro ao enviar email de onboarding' };
  }
}
