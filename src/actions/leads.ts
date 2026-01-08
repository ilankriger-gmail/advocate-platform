'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/types/action';
import type { NpsLead, NpsLeadInsert } from '@/lib/supabase/types';

// ============ ACOES PUBLICAS ============

/**
 * Submeter formulario NPS (publico - sem autenticacao)
 */
export async function submitNpsLead(data: NpsLeadInsert): Promise<ActionResponse<NpsLead>> {
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
      return { error: 'Email invalido' };
    }

    if (!data.reason || data.reason.trim().length < 3) {
      return { error: 'Por favor, explique o motivo da sua nota' };
    }

    // Inserir lead
    const { data: lead, error } = await supabase
      .from('nps_leads')
      .insert({
        score: data.score,
        reason: data.reason.trim(),
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating NPS lead:', error);
      return { error: 'Erro ao enviar formulario. Tente novamente.' };
    }

    return { success: true, data: lead };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

// ============ ACOES ADMIN ============

/**
 * Verificar se usuario e admin/creator
 */
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuario nao autenticado' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_creator')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
    return { error: 'Acesso nao autorizado' };
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
 */
export async function sendLeadEmailNotification(leadId: string): Promise<ActionResponse> {
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
      return { error: 'Lead nao encontrado ou nao esta aprovado' };
    }

    if (lead.email_sent) {
      return { error: 'Email ja foi enviado para este lead' };
    }

    // Gerar link de cadastro com email pre-preenchido
    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nextlovers.com'}/registro?email=${encodeURIComponent(lead.email)}`;

    // Enviar email (import dinamico para evitar erro se nao configurado)
    const { sendApprovalEmail } = await import('@/lib/notifications/email');
    const result = await sendApprovalEmail({
      to: lead.email,
      name: lead.name,
      loginUrl: registrationUrl,
    });

    if (!result.success) {
      return { error: result.error || 'Erro ao enviar email' };
    }

    // Atualizar registro
    await supabase
      .from('nps_leads')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    revalidatePath('/admin/leads');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Enviar notificacao por WhatsApp para lead aprovado
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
      return { error: 'Lead nao encontrado ou nao esta aprovado' };
    }

    if (!lead.phone) {
      return { error: 'Lead nao possui telefone cadastrado' };
    }

    if (lead.whatsapp_sent) {
      return { error: 'WhatsApp ja foi enviado para este lead' };
    }

    // Enviar WhatsApp (import dinamico para evitar erro se nao configurado)
    const { sendApprovalWhatsApp } = await import('@/lib/notifications/whatsapp');
    const result = await sendApprovalWhatsApp({
      to: lead.phone,
      name: lead.name,
      email: lead.email,
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
 * Aprovar multiplos leads em massa e enviar notificacoes
 */
export async function bulkApproveAndNotify(leadIds: string[]): Promise<ActionResponse<{
  approved: number;
  emailsSent: number;
  whatsappsSent: number;
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
      })
      .in('id', leadIds)
      .eq('status', 'pending')
      .select('*');

    if (approveError) {
      return { error: 'Erro ao aprovar leads' };
    }

    const approved = approvedLeads?.length || 0;
    let emailsSent = 0;
    let whatsappsSent = 0;

    // Importar servicos de notificacao
    const { sendApprovalEmail } = await import('@/lib/notifications/email');
    const { sendApprovalWhatsApp } = await import('@/lib/notifications/whatsapp');

    // Enviar notificacoes para cada lead aprovado
    for (const lead of approvedLeads || []) {
      // Enviar email
      const emailResult = await sendApprovalEmail({
        to: lead.email,
        name: lead.name,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://nextlovers.com'}/registro?email=${encodeURIComponent(lead.email)}`,
      });

      if (emailResult.success) {
        emailsSent++;
        await supabase
          .from('nps_leads')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq('id', lead.id);
      }

      // Enviar WhatsApp se tiver telefone
      if (lead.phone) {
        const whatsappResult = await sendApprovalWhatsApp({
          to: lead.phone,
          name: lead.name,
          email: lead.email,
        });

        if (whatsappResult.success) {
          whatsappsSent++;
          await supabase
            .from('nps_leads')
            .update({
              whatsapp_sent: true,
              whatsapp_sent_at: new Date().toISOString(),
            })
            .eq('id', lead.id);
        }
      }
    }

    revalidatePath('/admin/leads');
    return { success: true, data: { approved, emailsSent, whatsappsSent } };
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
 * Enviar todas as notificacoes para lead aprovado
 */
export async function sendAllNotifications(leadId: string): Promise<ActionResponse<{
  email: boolean;
  whatsapp: boolean;
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
      return { error: 'Lead nao encontrado ou nao esta aprovado' };
    }

    const results = {
      email: false,
      whatsapp: false,
    };

    // Gerar link de cadastro com email pre-preenchido
    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nextlovers.com'}/registro?email=${encodeURIComponent(lead.email)}`;

    // Enviar email se ainda nao foi enviado
    if (!lead.email_sent) {
      const { sendApprovalEmail } = await import('@/lib/notifications/email');
      const emailResult = await sendApprovalEmail({
        to: lead.email,
        name: lead.name,
        loginUrl: registrationUrl,
      });
      results.email = emailResult.success;

      if (emailResult.success) {
        await supabase
          .from('nps_leads')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq('id', leadId);
      }
    } else {
      results.email = true; // Ja foi enviado
    }

    // Enviar WhatsApp se tem telefone e ainda nao foi enviado
    if (lead.phone && !lead.whatsapp_sent) {
      const { sendApprovalWhatsApp } = await import('@/lib/notifications/whatsapp');
      const whatsappResult = await sendApprovalWhatsApp({
        to: lead.phone,
        name: lead.name,
        email: lead.email,
      });
      results.whatsapp = whatsappResult.success;

      if (whatsappResult.success) {
        await supabase
          .from('nps_leads')
          .update({
            whatsapp_sent: true,
            whatsapp_sent_at: new Date().toISOString(),
          })
          .eq('id', leadId);
      }
    } else if (lead.whatsapp_sent) {
      results.whatsapp = true; // Ja foi enviado
    }

    revalidatePath('/admin/leads');
    return { success: true, data: results };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}
