-- =============================================
-- MIGRACAO: Permitir verificação de lead aprovado para registro
-- Permite que usuários não autenticados verifiquem se seu email foi aprovado
-- =============================================

-- Política para permitir que qualquer pessoa verifique se seu email está aprovado
-- Isso é necessário para o fluxo de registro funcionar
DROP POLICY IF EXISTS "nps_leads_select_approved_check" ON nps_leads;
CREATE POLICY "nps_leads_select_approved_check" ON nps_leads
  FOR SELECT
  USING (
    -- Permite SELECT apenas para status='approved'
    -- Não revela dados de leads pendentes ou rejeitados
    status = 'approved'
  );

-- Comentário explicando a política
COMMENT ON POLICY "nps_leads_select_approved_check" ON nps_leads IS
  'Permite verificar se um email foi aprovado para registro. Necessário para o fluxo de criação de conta.';
