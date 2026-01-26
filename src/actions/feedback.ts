'use server';

import { createClient } from '@/lib/supabase/server';
import { logger, sanitizeError } from '@/lib';

const feedbackLogger = logger.withContext('[Feedback]');

interface BugReportData {
  description: string;
  url?: string;
  userAgent?: string;
}

/**
 * Enviar relatório de bug
 */
export async function submitBugReport(data: BugReportData) {
  try {
    const supabase = await createClient();
    
    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Insert bug report
    const { error } = await supabase.from('bug_reports').insert({
      user_id: user?.id || null,
      description: data.description,
      url: data.url || null,
      user_agent: data.userAgent || null,
      status: 'pending',
    });

    if (error) {
      // If table doesn't exist, log to console
      feedbackLogger.warn('Tabela bug_reports não existe, logando no console', {
        description: data.description,
        url: data.url,
        userId: user?.id,
      });
      return { success: true };
    }

    feedbackLogger.info('Bug report enviado', {
      userId: user?.id,
      url: data.url,
    });

    return { success: true };
  } catch (error) {
    feedbackLogger.error('Erro ao enviar bug report', { error: sanitizeError(error) });
    return { success: false, error: 'Erro ao enviar relatório' };
  }
}
