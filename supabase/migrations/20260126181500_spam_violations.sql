-- Tabela para rastrear violações de spam e aplicar bans progressivos
CREATE TABLE IF NOT EXISTS spam_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL, -- 'comment_spam', 'like_spam', 'post_spam'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_spam_violations_user_id ON spam_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_spam_violations_user_type ON spam_violations(user_id, violation_type);
CREATE INDEX IF NOT EXISTS idx_spam_violations_created_at ON spam_violations(created_at DESC);

-- Tabela para bans ativos
CREATE TABLE IF NOT EXISTS user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ban_type TEXT NOT NULL, -- 'comment', 'like', 'post', 'full'
  reason TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ban_type)
);

-- Índice para verificar bans ativos
CREATE INDEX IF NOT EXISTS idx_user_bans_active ON user_bans(user_id, ban_type, expires_at);

-- RLS
ALTER TABLE spam_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode inserir/ler
CREATE POLICY "Service role full access on spam_violations" ON spam_violations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on user_bans" ON user_bans
  FOR ALL USING (auth.role() = 'service_role');

-- Usuário pode ver seus próprios bans
CREATE POLICY "Users can view own bans" ON user_bans
  FOR SELECT USING (auth.uid() = user_id);

-- Função para calcular duração do ban baseado em violações anteriores
CREATE OR REPLACE FUNCTION calculate_ban_duration(p_user_id UUID, p_violation_type TEXT)
RETURNS INTERVAL AS $$
DECLARE
  violation_count INT;
BEGIN
  -- Contar violações do mesmo tipo nos últimos 30 dias
  SELECT COUNT(*) INTO violation_count
  FROM spam_violations
  WHERE user_id = p_user_id
    AND violation_type = p_violation_type
    AND created_at > NOW() - INTERVAL '30 days';
  
  -- Duração progressiva: 24h, 48h, 72h, 1 semana, 2 semanas, 1 mês
  RETURN CASE
    WHEN violation_count = 0 THEN INTERVAL '24 hours'
    WHEN violation_count = 1 THEN INTERVAL '48 hours'
    WHEN violation_count = 2 THEN INTERVAL '72 hours'
    WHEN violation_count = 3 THEN INTERVAL '1 week'
    WHEN violation_count = 4 THEN INTERVAL '2 weeks'
    ELSE INTERVAL '1 month'
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar violação e aplicar ban
CREATE OR REPLACE FUNCTION record_spam_violation(
  p_user_id UUID,
  p_violation_type TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  ban_duration INTERVAL;
  ban_expires TIMESTAMPTZ;
  ban_type TEXT;
BEGIN
  -- Calcular duração do ban
  ban_duration := calculate_ban_duration(p_user_id, p_violation_type);
  ban_expires := NOW() + ban_duration;
  
  -- Determinar tipo de ban baseado na violação
  ban_type := CASE
    WHEN p_violation_type LIKE '%comment%' THEN 'comment'
    WHEN p_violation_type LIKE '%like%' THEN 'like'
    WHEN p_violation_type LIKE '%post%' THEN 'post'
    ELSE 'full'
  END;
  
  -- Registrar violação
  INSERT INTO spam_violations (user_id, violation_type, details)
  VALUES (p_user_id, p_violation_type, p_details);
  
  -- Aplicar ou atualizar ban
  INSERT INTO user_bans (user_id, ban_type, reason, expires_at)
  VALUES (p_user_id, ban_type, p_violation_type, ban_expires)
  ON CONFLICT (user_id, ban_type) 
  DO UPDATE SET 
    expires_at = GREATEST(user_bans.expires_at, ban_expires),
    reason = p_violation_type;
  
  RETURN jsonb_build_object(
    'banned', true,
    'ban_type', ban_type,
    'expires_at', ban_expires,
    'duration_hours', EXTRACT(EPOCH FROM ban_duration) / 3600
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário está banido
CREATE OR REPLACE FUNCTION check_user_ban(p_user_id UUID, p_ban_type TEXT)
RETURNS JSONB AS $$
DECLARE
  ban_record RECORD;
BEGIN
  SELECT * INTO ban_record
  FROM user_bans
  WHERE user_id = p_user_id
    AND (ban_type = p_ban_type OR ban_type = 'full')
    AND expires_at > NOW()
  ORDER BY expires_at DESC
  LIMIT 1;
  
  IF ban_record IS NULL THEN
    RETURN jsonb_build_object('banned', false);
  END IF;
  
  RETURN jsonb_build_object(
    'banned', true,
    'ban_type', ban_record.ban_type,
    'reason', ban_record.reason,
    'expires_at', ban_record.expires_at,
    'remaining_hours', EXTRACT(EPOCH FROM (ban_record.expires_at - NOW())) / 3600
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
