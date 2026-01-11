'use server';

/**
 * Server Actions para funcionalidades de IA
 */

import { generateChallengeDescription, ChallengeDescriptionInput } from '@/lib/gemini';

/**
 * Gera descrição de desafio usando IA
 */
export async function generateDescription(
  input: ChallengeDescriptionInput
): Promise<{ success: boolean; description?: string; error?: string }> {
  // Validação básica
  if (!input.title || input.title.trim().length < 3) {
    return {
      success: false,
      error: 'Título é obrigatório (mínimo 3 caracteres)',
    };
  }

  if (!input.idea || input.idea.trim().length < 10) {
    return {
      success: false,
      error: 'Descreva a ideia do desafio (mínimo 10 caracteres)',
    };
  }

  const result = await generateChallengeDescription({
    ...input,
    title: input.title.trim(),
    idea: input.idea.trim(),
  });

  return result;
}
