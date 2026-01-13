'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { ActionResponse } from '@/types/action';
import type { NpsLead, NpsLeadInsert } from '@/lib/supabase/types';
import {
  sendApprovalEmail,
  sendApprovalWhatsApp,
  scheduleEmailCheck,
  scheduleEmail2,
} from '@/lib/notifications';
import { getSiteSettings } from '@/lib/config/site';
import { analyzeLeadWithAI } from '@/lib/ai';
import { validateEmail, checkRateLimit, RATE_LIMITS, auditLog } from '@/lib/security';
import { logger, maskEmail, sanitizeError } from '@/lib';
import { validateName, validateReason, validatePhone } from '@/lib/validation/nps-validation';

// Logger contextualizado para o módulo de leads
const leadsLogger = logger.withContext('[Leads]');

// ============ ACOES PUBLICAS ============

/**
 * Analisa um lead com AI em background (usa admin client para bypassar RLS)
 * Nao bloqueia a resposta do formulario
 * Auto-aprova leads com score >= threshold se feature estiver habilitada
 */
async function analyzeLeadInBackground(leadId: string, leadEmail: string, leadData: {
  name: string;
  score: number;
  reason: string;
}) {
  try {
    // Analise com OpenAI
    const analysis = await analyzeLeadWithAI(leadData);

    // Usar admin client para atualizar o lead (bypassa RLS)
    const adminClient = createAdminClient();

    if (!analysis) {
      leadsLogger.info('Analise AI nao disponivel (API key nao configurada ou erro)');
      // Marcar como analisado mesmo sem AI para não travar a página de obrigado
      await adminClient
        .from('nps_leads')
        .update({
          ai_analyzed_at: new Date().toISOString(),
          status: 'pending', // Vai para revisão manual
        })
        .eq('id', leadId);
      return;
    }

    // Buscar settings de auto-aprovacao
    const settings = await getSiteSettings([
      'nps_auto_approval_enabled',
      'nps_auto_approval_min_score',
    ]);

    const autoApprovalEnabled = settings.nps_auto_approval_enabled === 'true';
    const minScore = parseInt(settings.nps_auto_approval_min_score || '70', 10);

    // Verificar se deve auto-aprovar
    const shouldAutoApprove = autoApprovalEnabled && analysis.score >= minScore;

    const updateData: Record<string, unknown> = {
      ai_score: analysis.score,
      ai_sentiment: analysis.sentiment,
      ai_recommendation: analysis.recommendation,
      ai_summary: analysis.summary,
      ai_strengths: analysis.strengths,
      ai_concerns: analysis.concerns,
      ai_analyzed_at: new Date().toISOString(),
    };

    // Se auto-aprovacao ativa e score >= threshold, aprovar automaticamente
    if (shouldAutoApprove) {
      updateData.status = 'approved';
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = null; // Auto-aprovado pelo sistema
      leadsLogger.info('Lead auto-aprovado pelo sistema', {
        email: maskEmail(leadEmail),
        aiScore: analysis.score,
        threshold: minScore,
      });
    }

    const { error } = await adminClient
      .from('nps_leads')
      .update(updateData)
      .eq('id', leadId);

    if (error) {
      leadsLogger.error('Erro ao salvar analise AI', { error: sanitizeError(error) });
    } else {
      leadsLogger.info('Lead analisado com sucesso', {
        email: maskEmail(leadEmail),
        score: analysis.score,
        autoApproved: shouldAutoApprove,
      });
    }
  } catch (err) {
    leadsLogger.error('Erro na analise AI em background', { error: sanitizeError(err) });
  }
}

/**
 * Verificar se email já existe como conta ou lead
 * Usado para avisar o usuário antes de submeter
 */
export async function checkExistingAccount(email: string): Promise<{
  hasAccount: boolean;
  hasPendingLead: boolean;
  hasApprovedLead: boolean;
  message?: string;
  loginUrl?: string;
}> {
  try {
    if (!email || !email.includes('@')) {
      return { hasAccount: false, hasPendingLead: false, hasApprovedLead: false };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const adminClient = createAdminClient();

    // 1. Verificar se já tem conta de usuário
    const { data: user } = await adminClient
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (user) {
      return {
        hasAccount: true,
        hasPendingLead: false,
        hasApprovedLead: false,
        message: 'Você já tem uma conta! Faça login para acessar.',
        loginUrl: '/login',
      };
    }

    // 2. Verificar se já tem lead pendente/aprovado
    const { data: lead } = await adminClient
      .from('nps_leads')
      .select('status')
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lead?.status === 'pending') {
      return {
        hasAccount: false,
        hasPendingLead: true,
        hasApprovedLead: false,
        message: 'Sua solicitação já está em análise. Aguarde nosso contato!',
      };
    }

    if (lead?.status === 'approved') {
      return {
        hasAccount: false,
        hasPendingLead: false,
        hasApprovedLead: true,
        message: 'Você já foi aprovado! Verifique seu email ou faça login.',
        loginUrl: '/login',
      };
    }

    return { hasAccount: false, hasPendingLead: false, hasApprovedLead: false };
  } catch (err) {
    leadsLogger.error('Erro ao verificar conta existente', { error: sanitizeError(err) });
    return { hasAccount: false, hasPendingLead: false, hasApprovedLead: false };
  }
}

/**
 * Submeter formulario NPS (público - sem autenticacao)
 * Retorna o leadId para acompanhamento do status
 */
export async function submitNpsLead(data: NpsLeadInsert): Promise<ActionResponse<{ leadId: string }>> {
  try {
    const supabase = await createClient();

    // Rate limiting por email (usando Redis para ambiente serverless)
    const rateLimitKey = `lead:${data.email?.toLowerCase() || 'unknown'}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMITS.lead);
    if (!rateLimit.success) {
      return { error: `Muitas tentativas. Aguarde ${Math.ceil((rateLimit.reset - Date.now()) / 1000)} segundos.` };
    }

    // Validacao dos dados
    if (data.score < 0 || data.score > 10) {
      return { error: 'Nota deve estar entre 0 e 10' };
    }

    // Validação de nome mais rigorosa
    const nameValidation = validateName(data.name);
    if (!nameValidation.valid) {
      return { error: nameValidation.error || 'Nome inválido' };
    }

    // Validacao de email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
      return { error: emailValidation.error || 'Email inválido' };
    }

    // Validação de motivo mais rigorosa
    const reasonValidation = validateReason(data.reason);
    if (!reasonValidation.valid) {
      return { error: reasonValidation.error || 'Por favor, explique o motivo da sua nota' };
    }

    // Validação de telefone (opcional, mas se preenchido deve ser válido)
    if (data.phone && data.phone.trim()) {
      const phoneValidation = validatePhone(data.phone);
      if (!phoneValidation.valid) {
        return { error: phoneValidation.error || 'Telefone inválido' };
      }
    }

    const email = data.email.trim().toLowerCase();

    // Capturar IP para auditoria LGPD
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
      || headersList.get('x-real-ip')
      || 'unknown';

    // Inserir lead usando admin client para poder retornar o ID
    const adminClient = createAdminClient();
    const { data: insertedLead, error } = await adminClient
      .from('nps_leads')
      .insert({
        score: data.score,
        reason: data.reason.trim(),
        name: data.name.trim(),
        email,
        phone: data.phone?.trim() || null,
        // Campos de consentimento LGPD
        lgpd_consent_accepted: data.lgpdConsent || false,
        lgpd_consent_at: data.lgpdConsent ? new Date().toISOString() : null,
        lgpd_consent_ip: data.lgpdConsent ? clientIp : null,
        // Campos de origem (landing page)
        source_type: data.sourceType || 'direct',
        source_id: data.sourceId || null,
        source_name: data.sourceName || null,
      })
      .select('id')
      .single();

    if (error || !insertedLead) {
      leadsLogger.error('Erro ao criar lead NPS', { error: sanitizeError(error) });
      return { error: 'Erro ao enviar formulario. Tente novamente.' };
    }

    const leadId = insertedLead.id;

    // Analise AI em background (nao bloqueia a resposta)
    analyzeLeadInBackground(leadId, email, {
      name: data.name.trim(),
      score: data.score,
      reason: data.reason.trim(),
    }).catch((err) => {
      leadsLogger.error('Erro ao iniciar analise AI em background', { error: sanitizeError(err) });
    });

    return { success: true, data: { leadId } };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Status do lead para a página de obrigado
 */
export type LeadStatusResult = {
  status: 'processing' | 'approved' | 'pending' | 'rejected';
  email?: string;
  name?: string;
};

/**
 * Verificar status de um lead (público - para página de obrigado)
 * Retorna apenas informações necessárias para exibição
 */
export async function getLeadStatus(leadId: string): Promise<ActionResponse<LeadStatusResult>> {
  try {
    if (!leadId) {
      return { error: 'ID do lead não fornecido' };
    }

    // Usar admin client para bypassar RLS
    const adminClient = createAdminClient();

    const { data: lead, error } = await adminClient
      .from('nps_leads')
      .select('id, status, email, name, ai_analyzed_at')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      leadsLogger.warn('Lead não encontrado para status', { leadId });
      return { error: 'Lead não encontrado' };
    }

    // Se ainda não foi analisado pela AI, está processando
    if (!lead.ai_analyzed_at) {
      return {
        success: true,
        data: {
          status: 'processing',
          email: lead.email,
          name: lead.name,
        },
      };
    }

    // Retornar status atual
    return {
      success: true,
      data: {
        status: lead.status as 'approved' | 'pending' | 'rejected',
        email: lead.email,
        name: lead.name,
      },
    };
  } catch {
    return { error: 'Erro ao verificar status' };
  }
}

// ============ ACOES ADMIN ============

/**
 * Verificar se usuário e admin/creator
 */
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_creator')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
    return { error: 'Acesso não autorizado' };
  }

  return { user, profile };
}

/**
 * Aprovar lead
 */
export async function approveLead(leadId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    const { error } = await supabase
      .from('nps_leads')
      .update({
        status: 'approved',
        approved_by: auth.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      return { error: 'Erro ao aprovar lead' };
    }

    revalidatePath('/admin/leads');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Reprovar lead
 */
export async function rejectLead(leadId: string, reason?: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    const { error } = await supabase
      .from('nps_leads')
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
        approved_by: auth.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      return { error: 'Erro ao reprovar lead' };
    }

    revalidatePath('/admin/leads');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Buscar leads com filtros
 */
export async function getLeads(filters?: {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  orderBy?: 'created_at' | 'score' | 'reason_length';
  orderDirection?: 'asc' | 'desc';
}): Promise<ActionResponse<NpsLead[]>> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    let query = supabase.from('nps_leads').select('*');

    // Filtro de status
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Ordenacao
    const orderBy = filters?.orderBy || 'created_at';
    const orderDirection = filters?.orderDirection || 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    const { data: leads, error } = await query;

    if (error) {
      return { error: 'Erro ao buscar leads' };
    }

    return { success: true, data: leads || [] };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Estatisticas de leads
 */
export async function getLeadStats(): Promise<ActionResponse<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  avgScore: number;
}>> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    const { data: leads, error } = await supabase
      .from('nps_leads')
      .select('status, score');

    if (error) {
      return { error: 'Erro ao buscar estatisticas' };
    }

    const stats = {
      total: leads?.length || 0,
      pending: leads?.filter(l => l.status === 'pending').length || 0,
      approved: leads?.filter(l => l.status === 'approved').length || 0,
      rejected: leads?.filter(l => l.status === 'rejected').length || 0,
      avgScore: leads?.length
        ? Math.round((leads.reduce((sum, l) => sum + l.score, 0) / leads.length) * 10) / 10
        : 0,
    };

    return { success: true, data: stats };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

// ============ NOTIFICACOES ============

/**
 * Enviar notificacao por email para lead aprovado
 * Sistema Hibrido: Envia email + agenda verificação de abertura para WhatsApp
 */
export async function sendLeadEmailNotification(leadId: string): Promise<ActionResponse<{
  emailSent: boolean;
  taskScheduled: boolean;
}>> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    // Buscar lead
    const { data: lead, error: leadError } = await supabase
      .from('nps_leads')
      .select('*')
      .eq('id', leadId)
      .eq('status', 'approved')
      .single();

    if (leadError || !lead) {
      return { error: 'Lead não encontrado ou não está aprovado' };
    }

    if (lead.email_sent) {
      return { error: 'Email já foi enviado para este lead' };
    }

    // Gerar link de cadastro com email pre-preenchido
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comunidade.omocodoteamo.com.br';
    const registrationUrl = `${baseUrl}/registro?email=${encodeURIComponent(lead.email)}`;

    // Enviar email com logging automatico
    const result = await sendApprovalEmail({
      to: lead.email,
      name: lead.name,
      loginUrl: registrationUrl,
      leadId: lead.id,
    });

    if (!result.success) {
      return { error: result.error || 'Erro ao enviar email' };
    }

    // Atualizar registro com sequence_step = 1
    await supabase
      .from('nps_leads')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        whatsapp_opted_in: lead.phone ? true : false,
        sequence_step: 1,
      })
      .eq('id', leadId);

    // Agendar Email 2 para 24h (sempre agenda, mesmo sem telefone)
    const scheduleResult = await scheduleEmail2(lead.id, {
      email: lead.email,
      lead_name: lead.name,
    });
    const taskScheduled = scheduleResult.success;

    revalidatePath('/admin/leads');
    return { success: true, data: { emailSent: true, taskScheduled } };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Enviar notificacao por WhatsApp para lead aprovado
 * Usa Meta Cloud API
 */
export async function sendLeadWhatsAppNotification(leadId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    // Buscar lead
    const { data: lead, error: leadError } = await supabase
      .from('nps_leads')
      .select('*')
      .eq('id', leadId)
      .eq('status', 'approved')
      .single();

    if (leadError || !lead) {
      return { error: 'Lead não encontrado ou não está aprovado' };
    }

    if (!lead.phone) {
      return { error: 'Lead não possui telefone cadastrado' };
    }

    if (lead.whatsapp_sent) {
      return { error: 'WhatsApp já foi enviado para este lead' };
    }

    // Buscar configurações do site
    const settings = await getSiteSettings(['site_name']);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comunidade.omocodoteamo.com.br';
    const registrationUrl = `${baseUrl}/registro?email=${encodeURIComponent(lead.email)}`;

    // Enviar WhatsApp via Meta Cloud API
    const result = await sendApprovalWhatsApp({
      to: lead.phone,
      name: lead.name,
      siteName: settings.site_name,
      registrationUrl,
      leadId: lead.id,
    });

    if (!result.success) {
      return { error: result.error || 'Erro ao enviar WhatsApp' };
    }

    // Atualizar registro
    await supabase
      .from('nps_leads')
      .update({
        whatsapp_sent: true,
        whatsapp_sent_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    revalidatePath('/admin/leads');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Aprovar multiplos leads em massa
 */
export async function bulkApproveLeads(leadIds: string[]): Promise<ActionResponse<{
  approved: number;
  failed: number;
}>> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    if (!leadIds || leadIds.length === 0) {
      return { error: 'Nenhum lead selecionado' };
    }

    // Atualizar todos os leads selecionados
    const { data, error } = await supabase
      .from('nps_leads')
      .update({
        status: 'approved',
        approved_by: auth.user.id,
        approved_at: new Date().toISOString(),
      })
      .in('id', leadIds)
      .eq('status', 'pending')
      .select('id');

    if (error) {
      return { error: 'Erro ao aprovar leads' };
    }

    const approved = data?.length || 0;
    const failed = leadIds.length - approved;

    revalidatePath('/admin/leads');
    return { success: true, data: { approved, failed } };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Aprovar multiplos leads em massa e enviar notificações
 * Sistema Hibrido: Envia email 100%, agenda verificação de abertura para 24h
 * Se o email nao for aberto em 24h + lead tem WhatsApp, envia WhatsApp via CRON
 */
export async function bulkApproveAndNotify(leadIds: string[]): Promise<ActionResponse<{
  approved: number;
  emailsSent: number;
  tasksScheduled: number;
}>> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    if (!leadIds || leadIds.length === 0) {
      return { error: 'Nenhum lead selecionado' };
    }

    // Primeiro aprovar todos
    const { data: approvedLeads, error: approveError } = await supabase
      .from('nps_leads')
      .update({
        status: 'approved',
        approved_by: auth.user.id,
        approved_at: new Date().toISOString(),
        // Marcar leads com telefone como opted_in para WhatsApp
        whatsapp_opted_in: true,
      })
      .in('id', leadIds)
      .eq('status', 'pending')
      .select('*');

    if (approveError) {
      return { error: 'Erro ao aprovar leads' };
    }

    const approved = approvedLeads?.length || 0;
    let emailsSent = 0;
    let tasksScheduled = 0;

    // Buscar configurações do site
    const settings = await getSiteSettings(['site_name']);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comunidade.omocodoteamo.com.br';

    // Enviar notificações para cada lead aprovado
    for (const lead of approvedLeads || []) {
      const registrationUrl = `${baseUrl}/registro?email=${encodeURIComponent(lead.email)}`;

      // Enviar email (100% dos aprovados)
      const emailResult = await sendApprovalEmail({
        to: lead.email,
        name: lead.name,
        loginUrl: registrationUrl,
        leadId: lead.id, // Para logging automatico
      });

      if (emailResult.success) {
        emailsSent++;

        // Atualizar lead com email_sent e sequence_step = 1
        await supabase
          .from('nps_leads')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            sequence_step: 1,
          })
          .eq('id', lead.id);

        // Agendar Email 2 para 24h (novo sistema de sequência)
        const scheduleResult = await scheduleEmail2(lead.id, {
          email: lead.email,
          lead_name: lead.name,
        });

        if (scheduleResult.success) {
          tasksScheduled++;
        }
      }
    }

    revalidatePath('/admin/leads');
    return { success: true, data: { approved, emailsSent, tasksScheduled } };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Verificar se um email foi aprovado como lead
 */
export async function checkEmailApproved(email: string): Promise<ActionResponse<{
  approved: boolean;
  leadName?: string;
}>> {
  try {
    const supabase = await createClient();

    const { data: lead } = await supabase
      .from('nps_leads')
      .select('id, name, status')
      .eq('email', email.toLowerCase())
      .eq('status', 'approved')
      .single();

    if (lead) {
      return { success: true, data: { approved: true, leadName: lead.name } };
    }

    return { success: true, data: { approved: false } };
  } catch {
    return { error: 'Erro ao verificar email' };
  }
}

/**
 * Enviar todas as notificações para lead aprovado
 * Sistema Hibrido: Envia email + agenda verificação de abertura
 */
export async function sendAllNotifications(leadId: string): Promise<ActionResponse<{
  email: boolean;
  taskScheduled: boolean;
}>> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    // Buscar lead
    const { data: lead, error: leadError } = await supabase
      .from('nps_leads')
      .select('*')
      .eq('id', leadId)
      .eq('status', 'approved')
      .single();

    if (leadError || !lead) {
      return { error: 'Lead não encontrado ou não está aprovado' };
    }

    const results = {
      email: false,
      taskScheduled: false,
    };

    // Buscar configurações do site
    const settings = await getSiteSettings(['site_name']);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://comunidade.omocodoteamo.com.br';
    const registrationUrl = `${baseUrl}/registro?email=${encodeURIComponent(lead.email)}`;

    // Enviar email se ainda não foi enviado
    if (!lead.email_sent) {
      const emailResult = await sendApprovalEmail({
        to: lead.email,
        name: lead.name,
        loginUrl: registrationUrl,
        leadId: lead.id,
      });
      results.email = emailResult.success;

      if (emailResult.success) {
        await supabase
          .from('nps_leads')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            whatsapp_opted_in: lead.phone ? true : false,
            sequence_step: 1,
          })
          .eq('id', leadId);

        // Agendar Email 2 para 24h
        const scheduleResult = await scheduleEmail2(lead.id, {
          email: lead.email,
          lead_name: lead.name,
        });
        results.taskScheduled = scheduleResult.success;
      }
    } else {
      results.email = true; // Ja foi enviado
    }

    revalidatePath('/admin/leads');
    return { success: true, data: results };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

// ============ ANALISE AI ============

/**
 * Analisar leads pendentes que ainda nao foram analisados pela AI
 */
export async function analyzeUnanalyzedLeads(): Promise<ActionResponse<{
  analyzed: number;
  errors: number;
}>> {
  leadsLogger.info('Iniciando analise em lote de leads');

  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      leadsLogger.warn('Erro de autenticacao ao analisar leads', { error: auth.error });
      return { error: auth.error };
    }

    leadsLogger.debug('Usuario autenticado, buscando leads sem analise');

    // Buscar leads sem analise AI (maximo 20 por vez para nao sobrecarregar)
    const adminClient = createAdminClient();
    const { data: leads, error } = await adminClient
      .from('nps_leads')
      .select('id, email, name, score, reason')
      .is('ai_score', null)
      .limit(20);

    if (error) {
      leadsLogger.error('Erro ao buscar leads para analise', { error: sanitizeError(error) });
      return { error: 'Erro ao buscar leads' };
    }

    leadsLogger.info('Leads encontrados para analise', { count: leads?.length || 0 });

    if (!leads || leads.length === 0) {
      leadsLogger.debug('Nenhum lead pendente para analisar');
      return { success: true, data: { analyzed: 0, errors: 0 } };
    }

    let analyzed = 0;
    let errors = 0;

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      leadsLogger.debug('Processando lead para analise AI', {
        progress: `${i + 1}/${leads.length}`,
        email: maskEmail(lead.email),
      });

      try {
        const analysis = await analyzeLeadWithAI({
          name: lead.name,
          score: lead.score,
          reason: lead.reason,
        });

        if (analysis) {
          leadsLogger.info('Lead analisado com sucesso', {
            email: maskEmail(lead.email),
            score: analysis.score,
            recommendation: analysis.recommendation,
          });

          const { error: updateError } = await adminClient
            .from('nps_leads')
            .update({
              ai_score: analysis.score,
              ai_sentiment: analysis.sentiment,
              ai_recommendation: analysis.recommendation,
              ai_summary: analysis.summary,
              ai_strengths: analysis.strengths,
              ai_concerns: analysis.concerns,
              ai_analyzed_at: new Date().toISOString(),
            })
            .eq('id', lead.id);

          if (updateError) {
            leadsLogger.error('Erro ao salvar analise do lead', {
              email: maskEmail(lead.email),
              error: sanitizeError(updateError),
            });
            errors++;
          } else {
            analyzed++;
          }
        } else {
          leadsLogger.warn('Analise retornou null para lead', { email: maskEmail(lead.email) });
          errors++;
        }
      } catch (err) {
        leadsLogger.error('Excecao ao processar lead', {
          email: maskEmail(lead.email),
          error: sanitizeError(err),
        });
        errors++;
      }
    }

    leadsLogger.info('Analise em lote concluida', { analyzed, errors });
    revalidatePath('/admin/leads');
    return { success: true, data: { analyzed, errors } };
  } catch (err) {
    leadsLogger.error('Erro interno ao analisar leads', { error: sanitizeError(err) });
    return { error: 'Erro interno do servidor' };
  }
}

// ============ IMPORTACAO CSV ============

/**
 * Importar leads de teste via CSV
 * Formato esperado: name,email,phone,score,reason
 */
export async function importLeadsFromCSV(csvData: string): Promise<ActionResponse<{
  imported: number;
  errors: string[];
}>> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return { error: 'CSV deve ter pelo menos o header e uma linha de dados' };
    }

    // Pular header
    const dataLines = lines.slice(1);
    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      // Parse CSV (suporta campos com virgula entre aspas)
      const fields = line.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g)?.map(f => {
        let value = f.replace(/^,/, '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/""/g, '"');
        }
        return value;
      }) || [];

      if (fields.length < 4) {
        errors.push(`Linha ${i + 2}: campos insuficientes`);
        continue;
      }

      const [name, email, phone, scoreStr, ...reasonParts] = fields;
      const reason = reasonParts.join(',') || 'Importado via CSV para teste';
      const score = parseInt(scoreStr, 10);

      // Validacoes
      if (!name || name.length < 2) {
        errors.push(`Linha ${i + 2}: nome invalido`);
        continue;
      }
      if (!email || !email.includes('@')) {
        errors.push(`Linha ${i + 2}: email invalido`);
        continue;
      }
      if (isNaN(score) || score < 0 || score > 10) {
        errors.push(`Linha ${i + 2}: score deve ser 0-10`);
        continue;
      }

      // Inserir lead
      const { error } = await supabase
        .from('nps_leads')
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          score,
          reason: reason.trim(),
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          errors.push(`Linha ${i + 2}: email ja existe`);
        } else {
          errors.push(`Linha ${i + 2}: ${error.message}`);
        }
        continue;
      }

      imported++;
    }

    revalidatePath('/admin/leads');
    return { success: true, data: { imported, errors } };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

// ============ CONVERSAO ============

/**
 * Verificar se um lead converteu (criou conta e fez primeiro login)
 * Usado pelo CRON para decidir se envia próximo email da sequência
 */
export async function checkLeadConversion(leadId: string): Promise<{
  converted: boolean;
  userId?: string;
}> {
  try {
    const supabase = await createClient();

    // Buscar lead
    const { data: lead, error: leadError } = await supabase
      .from('nps_leads')
      .select('email, converted, converted_user_id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return { converted: false };
    }

    // Se já está marcado como convertido, retornar
    if (lead.converted && lead.converted_user_id) {
      return { converted: true, userId: lead.converted_user_id };
    }

    // Buscar usuário pelo email
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', lead.email)
      .single();

    if (!user) {
      return { converted: false };
    }

    // Usuário existe - marcar lead como convertido
    await supabase
      .from('nps_leads')
      .update({
        converted: true,
        converted_at: new Date().toISOString(),
        converted_user_id: user.id,
      })
      .eq('id', leadId);

    return { converted: true, userId: user.id };
  } catch {
    return { converted: false };
  }
}

/**
 * Atualizar sequence_step do lead
 */
export async function updateLeadSequenceStep(
  leadId: string,
  step: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('nps_leads')
      .update({ sequence_step: step })
      .eq('id', leadId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Erro ao atualizar sequence_step' };
  }
}

/**
 * Buscar estatisticas da sequência de emails
 */
export async function getSequenceStats(): Promise<ActionResponse<{
  totalApproved: number;
  email1Sent: number;
  email2Sent: number;
  whatsappSent: number;
  converted: number;
  conversionRate: number;
  funnel: Array<{
    step: number;
    name: string;
    count: number;
    convertedCount: number;
  }>;
}>> {
  try {
    const supabase = await createClient();

    const auth = await verifyAdmin(supabase);
    if ('error' in auth) {
      return { error: auth.error };
    }

    // Buscar todos os leads aprovados
    const { data: leads, error } = await supabase
      .from('nps_leads')
      .select('sequence_step, converted')
      .eq('status', 'approved');

    if (error) {
      return { error: 'Erro ao buscar estatisticas' };
    }

    const totalApproved = leads?.length || 0;
    const email1Sent = leads?.filter(l => l.sequence_step >= 1).length || 0;
    const email2Sent = leads?.filter(l => l.sequence_step >= 2).length || 0;
    const whatsappSent = leads?.filter(l => l.sequence_step >= 3).length || 0;
    const converted = leads?.filter(l => l.converted).length || 0;

    const conversionRate = totalApproved > 0
      ? Math.round((converted / totalApproved) * 100 * 10) / 10
      : 0;

    // Funil por etapa
    const funnel = [
      { step: 0, name: 'Aguardando', count: 0, convertedCount: 0 },
      { step: 1, name: 'Email 1 Enviado', count: 0, convertedCount: 0 },
      { step: 2, name: 'Email 2 Enviado', count: 0, convertedCount: 0 },
      { step: 3, name: 'WhatsApp Enviado', count: 0, convertedCount: 0 },
    ];

    leads?.forEach(lead => {
      const step = lead.sequence_step || 0;
      if (step >= 0 && step <= 3) {
        funnel[step].count++;
        if (lead.converted) {
          funnel[step].convertedCount++;
        }
      }
    });

    return {
      success: true,
      data: {
        totalApproved,
        email1Sent,
        email2Sent,
        whatsappSent,
        converted,
        conversionRate,
        funnel,
      },
    };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}
