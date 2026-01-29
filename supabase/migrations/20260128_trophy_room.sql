-- Sala de Troféus: campo para mensagem do ganhador
ALTER TABLE challenge_winners ADD COLUMN IF NOT EXISTS winner_message TEXT DEFAULT NULL;
