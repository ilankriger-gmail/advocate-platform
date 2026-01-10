-- Migration: Renomear plataforma de NextLOVERS para Arena Te Amo
-- Data: 2026-01-09

-- Atualizar configurações do site
UPDATE site_settings SET value = 'Arena Te Amo' WHERE key = 'site_name';
UPDATE site_settings SET value = 'Arena Te Amo' WHERE key = 'hero_title';
UPDATE site_settings SET value = 'Arena Te Amo' WHERE key = 'login_title';
UPDATE site_settings SET value = 'Arena Te Amo - Comunidade O Moço do Te Amo' WHERE key = 'meta_title';
UPDATE site_settings SET value = 'Arena Te Amo' WHERE key = 'email_from_name';
UPDATE site_settings SET value = 'O Moço do Te Amo - Arena Te Amo' WHERE key = 'footer_text';
