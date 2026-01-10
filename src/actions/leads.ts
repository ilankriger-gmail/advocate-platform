'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
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

// ============ ACOES PUBLICAS ============

/**
 * Submeter formulario NPS (público - sem autenticacao)
 */
export async function submitNpsLead(data: NpsLeadInsert): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // Validacao dos dados
    if (data.score < 0 || data.score > 10) {
      return { error: 'Nota deve estar entre 0 e 10' };
    }

    if (!data.name || data.name.trim().length < 2) {
      return { error: 'Nome e obrigatorio' };
    }

    if (!data.email || !data.email.includes('@')) {
      return { error: 'Email inválido' };
    }

    if (!data.reason || data.reason.trim().length < 3) {
      return { error: 'Por favor, explique o motivo da sua nota' };
    }

    // Inserir lead (sem select, pois usuário anonimo não tem permissao de leitura)
    const { error } = await supabase
      .from('nps_leads')
      .insert({
        score: data.score,
        reason: data.reason.trim(),
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
      });

    if (error) {
      console.error('Error creating NPS lead:', error);
      return { error: 'Erro ao enviar formulario. Tente novamente.' };
    }

    // Analise AI em background - buscar lead pelo email (via service role seria ideal, mas por hora desabilitado)
    // TODO: Implementar analise AI via webhook ou cron job
    // analyzeLeadWithAI({ name: data.name.trim(), score: data.score, reason: data.reason.trim() })

    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
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
