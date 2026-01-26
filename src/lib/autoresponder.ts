/**
 * Auto-responder do Moço do Te Amo
 * Responde 67% dos comentários com mensagens únicas e ❤️‍🔥
 */

// Frases base que serão combinadas e variadas
const SAUDACOES = [
  'Opa',
  'Eiii',
  'Opaaa',
  'Fala',
  'E aí',
  'Oi',
  'Oiee',
  'Heeey',
  'Salve',
  'Aeee',
];

const ELOGIOS = [
  'que comentário incrível',
  'amei isso',
  'isso aí',
  'mandou bem',
  'é isso mesmo',
  'perfeito',
  'você arrasou',
  'top demais',
  'sensacional',
  'show de bola',
  'você é demais',
  'isso que é atitude',
  'adoro ver isso',
  'é assim que se faz',
  'você entendeu tudo',
];

const INCENTIVOS = [
  'Continue assim',
  'Bora pra cima',
  'Vamos juntos',
  'É nóis',
  'Tamo junto',
  'Segue firme',
  'Conta comigo',
  'Sempre com você',
  'Bora que bora',
  'Pra cima sempre',
  'Não para não',
  'Vai dar bom',
  'Confia no processo',
  'O amor vence',
];

const EMOJIS = ['❤️‍🔥', '❤️‍🔥❤️‍🔥', '🔥', '💪', '🙌', '✨', '💜', '🚀'];

const FINALIZACOES = [
  'Te amo!',
  'Te amo demais!',
  'Muito amor!',
  'Te amo, viu?',
  'Tmj!',
  'Te amo sempre!',
  'Amor!',
  'Te amo ❤️‍🔥',
  '❤️‍🔥',
  'Valeu demais!',
];

// Templates de respostas completas para variedade
const TEMPLATES = [
  '{saudacao}! {elogio} {emoji} {incentivo}! {finalizacao}',
  '{saudacao}, {elogio}! {emoji} {finalizacao}',
  '{elogio}! {emoji} {incentivo}. {finalizacao}',
  '{saudacao}! {emoji} {elogio}. {incentivo}!',
  '{emoji} {elogio}! {incentivo}. {finalizacao}',
  '{saudacao}! {incentivo} {emoji} {finalizacao}',
  '{elogio} {emoji} {emoji} {finalizacao}',
  '{saudacao}!! {elogio}. {emoji}',
  '{emoji} {emoji} {elogio}! {finalizacao}',
  '{incentivo}! {elogio} {emoji} {finalizacao}',
];

// Respostas especiais para contextos específicos
const RESPOSTAS_ESPECIAIS = {
  pergunta: [
    'Boa pergunta! ❤️‍🔥 Vou pensar nisso!',
    'Isso aí! ❤️‍🔥 Ótima reflexão!',
    'Caramba, faz sentido! ❤️‍🔥',
    'Interessante demais! ❤️‍🔥 Valeu por compartilhar!',
  ],
  agradecimento: [
    'Eu que agradeço! ❤️‍🔥 Te amo!',
    'Obrigado VOCÊ por estar aqui! ❤️‍🔥',
    'Nós que agradecemos! ❤️‍🔥❤️‍🔥',
    'Valeu demais! ❤️‍🔥 Tamo junto!',
  ],
  emocional: [
    'Força! ❤️‍🔥 Tamo junto sempre!',
    'Conte comigo! ❤️‍🔥 Te amo!',
    'Você não tá sozinho! ❤️‍🔥❤️‍🔥',
    'Muito amor pra você! ❤️‍🔥 Vai ficar tudo bem!',
  ],
  humor: [
    'KKKKK ❤️‍🔥 Adorei!',
    'Rachei! ❤️‍🔥❤️‍🔥',
    'HAHAHA isso aí! ❤️‍🔥',
    'Sensacional KKKK ❤️‍🔥',
  ],
};

/**
 * Escolhe item aleatório de um array
 */
function escolher<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Detecta o tipo/contexto do comentário
 */
function detectarContexto(comentario: string): keyof typeof RESPOSTAS_ESPECIAIS | null {
  const lower = comentario.toLowerCase();
  
  if (lower.includes('?')) return 'pergunta';
  if (lower.includes('obrigad') || lower.includes('valeu') || lower.includes('thanks')) return 'agradecimento';
  if (lower.includes('triste') || lower.includes('difícil') || lower.includes('força') || lower.includes('chorando')) return 'emocional';
  if (lower.includes('kk') || lower.includes('haha') || lower.includes('kkk') || lower.includes('😂')) return 'humor';
  
  return null;
}

/**
 * Gera uma resposta única e personalizada
 */
export function gerarResposta(comentario?: string): string {
  // Se tiver comentário, tentar detectar contexto
  if (comentario) {
    const contexto = detectarContexto(comentario);
    if (contexto && Math.random() > 0.5) {
      return escolher(RESPOSTAS_ESPECIAIS[contexto]);
    }
  }
  
  // Gerar resposta usando template
  const template = escolher(TEMPLATES);
  
  return template
    .replace('{saudacao}', escolher(SAUDACOES))
    .replace('{elogio}', escolher(ELOGIOS))
    .replace('{incentivo}', escolher(INCENTIVOS))
    .replace('{finalizacao}', escolher(FINALIZACOES))
    .replace(/{emoji}/g, escolher(EMOJIS));
}

/**
 * Decide se deve responder (67% de chance)
 */
export function deveResponder(): boolean {
  return Math.random() < 0.67;
}

/**
 * Gera resposta se passar na probabilidade de 67%
 */
export function tentarGerarResposta(comentario?: string): string | null {
  if (!deveResponder()) return null;
  return gerarResposta(comentario);
}
