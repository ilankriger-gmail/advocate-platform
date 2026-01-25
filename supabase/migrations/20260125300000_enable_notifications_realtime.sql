-- Habilitar Realtime para notificações instantâneas
-- Isso permite que o frontend receba notificações via WebSocket em tempo real

-- Adicionar a tabela user_notifications à publicação supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;

-- Comentário explicativo
COMMENT ON TABLE user_notifications IS 'Notificações in-app para usuários da plataforma. Realtime habilitado para atualizações instantâneas.';
