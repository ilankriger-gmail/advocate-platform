# Database Schema - Arena Te Amo

> Última atualização: 2025-07-20  
> Supabase Project: `gsxanzgwstlpfvnqcmiu`

## Tabelas Existentes (com dados)

### Core

| Tabela | Rows | Descrição |
|--------|------|-----------|
| `users` | 887 | Usuários da plataforma |
| `user_coins` | 887 | Saldo de corações (1:1 com users) |
| `user_follows` | 774 | Relações de follow |
| `user_notifications` | 7 | Notificações in-app |
| `user_onboarding` | 832 | Progresso do onboarding |

### Content

| Tabela | Rows | Descrição |
|--------|------|-----------|
| `posts` | 95 | Posts do feed |
| `post_likes` | 214 | Likes em posts |
| `post_comments` | 296 | Comentários em posts |
| `post_saves` | 344 | Posts salvos |
| `post_votes` | 447 | Votos em posts (sistema de votação) |
| `post_shares` | 68 | Compartilhamentos |
| `comment_likes` | 0 | Likes em comentários |

### Challenges

| Tabela | Rows | Descrição |
|--------|------|-----------|
| `challenges` | 57 | Desafios |
| `challenge_participants` | 12 | Participações em desafios |
| `challenge_winners` | 0 | Vencedores de desafios |
| `challenge_prizes` | 5 | Prêmios de desafios |

### Economy

| Tabela | Rows | Descrição |
|--------|------|-----------|
| `coin_transactions` | 313 | Histórico de transações de corações |
| `rewards` | 18 | Prêmios da loja |
| `reward_claims` | 2 | Resgates de prêmios |

### Leads & Notifications

| Tabela | Rows | Descrição |
|--------|------|-----------|
| `nps_leads` | 351 | Leads NPS (formulário seja-arena) |
| `scheduled_tasks` | 1602 | Tarefas agendadas (cron) |
| `scheduled_autoresponses` | 0 | Auto-respostas agendadas |
| `email_broadcasts` | 0 | Broadcasts enviados |

### Config & Misc

| Tabela | Rows | Descrição |
|--------|------|-----------|
| `site_settings` | 83 | Configurações do site (key-value) |
| `bug_reports` | 4 | Relatórios de bugs |
| `stories` | 3 | Stories |
| `story_views` | 3 | Visualizações de stories |
| `ad_campaigns` | 0 | Campanhas de anúncios |

### Tabelas Referenciadas no Código mas Possivelmente Não Criadas

| Tabela | Status | Notas |
|--------|--------|-------|
| `events` | ✅ Existe (null count = RLS) | Eventos |
| `event_registrations` | ✅ Existe (null count = RLS) | Registros em eventos |
| `external_submissions` | ✅ Existe (null count = RLS) | Submissões externas |
| `followers` | ❌ Não existe | Substituído por `user_follows` |
| `referrals` | ❓ Possível RLS | Sistema de referral |
| `notification_logs` | ❓ Possível RLS | Logs de notificações |
| `ranking_snapshots` | ❓ Possível RLS | Snapshots de ranking |
| `linkdobem_campaigns` | ❓ Possível RLS | Campanhas LinkDoBem |

> **Nota:** Tabelas retornando `null` no count podem existir mas ter RLS policies que bloqueiam leitura mesmo com service role, ou serem views.

---

## Schema Detalhado

### `users`
```sql
id              UUID PRIMARY KEY  -- Mesmo do auth.users
email           TEXT NOT NULL
full_name       TEXT
avatar_url      TEXT
bio             TEXT
instagram_handle TEXT
tiktok_handle   TEXT
youtube_handle  TEXT
twitter_handle  TEXT
website_url     TEXT
phone           TEXT
role            TEXT DEFAULT 'fan'  -- 'fan' | 'creator' | 'admin'
is_creator      BOOLEAN DEFAULT false
referral_code   TEXT               -- Código único de indicação
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### `posts`
```sql
id               UUID PRIMARY KEY
user_id          UUID REFERENCES users(id)
title            TEXT NOT NULL
content          TEXT
media_url        TEXT[]             -- Array de URLs de mídia
media_type       TEXT DEFAULT 'none' -- 'none' | 'image' | 'carousel' | 'youtube' | 'instagram'
youtube_url      TEXT
instagram_url    TEXT
type             TEXT DEFAULT 'community' -- 'creator' | 'community'
status           TEXT DEFAULT 'pending'   -- 'pending' | 'approved' | 'rejected' | 'blocked'
content_category TEXT DEFAULT 'normal'    -- 'normal' | 'help_request'
likes_count      INT DEFAULT 0
comments_count   INT DEFAULT 0
vote_score       INT DEFAULT 0
is_featured      BOOLEAN DEFAULT false
rejection_reason TEXT
approved_by      UUID REFERENCES users(id)
approved_at      TIMESTAMPTZ
created_at       TIMESTAMPTZ
updated_at       TIMESTAMPTZ
```

### `post_comments`
```sql
id           UUID PRIMARY KEY
post_id      UUID REFERENCES posts(id)
user_id      UUID REFERENCES users(id)
content      TEXT NOT NULL
parent_id    UUID REFERENCES post_comments(id)  -- Para replies
likes_count  INT DEFAULT 0
is_deleted   BOOLEAN DEFAULT false
created_at   TIMESTAMPTZ
```

### `challenges`
```sql
id                  UUID PRIMARY KEY
title               TEXT NOT NULL
description         TEXT
type                TEXT NOT NULL    -- 'engajamento' | 'fisico' | 'participe' | 'atos_amor'
icon                TEXT
thumbnail_url       TEXT
is_active           BOOLEAN DEFAULT true
slug                TEXT
instagram_embed_url TEXT             -- Para engajamento
prize_amount        DECIMAL          -- Para engajamento
num_winners         INT DEFAULT 1
goal_type           TEXT             -- 'repetitions' | 'time' (para físico)
goal_value          INT              -- Meta numérica
record_video_url    TEXT
hashtag             TEXT
profile_to_tag      TEXT
coins_reward        INT DEFAULT 0
starts_at           TIMESTAMPTZ
ends_at             TIMESTAMPTZ
status              TEXT DEFAULT 'active' -- 'active' | 'closed' | 'finished'
created_at          TIMESTAMPTZ
```

### `challenge_participants`
```sql
id                      UUID PRIMARY KEY
challenge_id            UUID REFERENCES challenges(id)
user_id                 UUID REFERENCES users(id)
result_value            INT
video_proof_url         TEXT
social_media_url        TEXT
instagram_proof_url     TEXT
status                  TEXT DEFAULT 'pending' -- 'pending' | 'approved' | 'rejected'
approved_by             UUID
approved_at             TIMESTAMPTZ
rejection_reason        TEXT
coins_earned            INT DEFAULT 0
-- Campos IA (YouTube/Gemini)
ai_is_valid             BOOLEAN
ai_confidence           DECIMAL
ai_reason               TEXT
ai_observed_value       INT
ai_analyzed_at          TIMESTAMPTZ
-- Campos IA (Instagram)
ai_instagram_is_valid   BOOLEAN
ai_instagram_confidence DECIMAL
ai_instagram_reason     TEXT
ai_is_suspicious        BOOLEAN DEFAULT false
created_at              TIMESTAMPTZ
```

### `nps_leads`
```sql
id                    UUID PRIMARY KEY
score                 INT NOT NULL       -- 0-10
reason                TEXT NOT NULL
reason_length         INT
name                  TEXT NOT NULL
email                 TEXT NOT NULL
phone                 TEXT
status                TEXT DEFAULT 'pending' -- 'pending' | 'approved' | 'rejected'
approved_by           UUID
approved_at           TIMESTAMPTZ
rejection_reason      TEXT
-- Email tracking
email_sent            BOOLEAN DEFAULT false
email_sent_at         TIMESTAMPTZ
whatsapp_sent         BOOLEAN DEFAULT false
whatsapp_sent_at      TIMESTAMPTZ
whatsapp_opted_in     BOOLEAN DEFAULT false
-- AI analysis
ai_score              DECIMAL
ai_sentiment          TEXT             -- 'positivo' | 'neutro' | 'negativo'
ai_recommendation     TEXT             -- 'aprovar' | 'analisar' | 'rejeitar'
ai_summary            TEXT
ai_strengths          TEXT[]
ai_concerns           TEXT[]
ai_analyzed_at        TIMESTAMPTZ
-- Sequência de emails
sequence_step         INT DEFAULT 0
converted             BOOLEAN DEFAULT false
converted_at          TIMESTAMPTZ
converted_user_id     UUID
-- LGPD
lgpd_consent_accepted BOOLEAN DEFAULT false
lgpd_consent_at       TIMESTAMPTZ
lgpd_consent_ip       TEXT
-- Origem
source_type           TEXT             -- 'landing_challenge' | 'landing_reward' | 'direct'
source_id             TEXT
source_name           TEXT
created_at            TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

### `user_coins`
```sql
id         UUID PRIMARY KEY
user_id    UUID UNIQUE REFERENCES users(id)
balance    INT DEFAULT 0
updated_at TIMESTAMPTZ
```

### `coin_transactions`
```sql
id             UUID PRIMARY KEY
user_id        UUID REFERENCES users(id)
amount         INT NOT NULL
type           TEXT NOT NULL      -- 'earned' | 'spent'
description    TEXT
reference_id   TEXT               -- ID do objeto relacionado
reference_type TEXT               -- Tipo da referência (ação)
created_at     TIMESTAMPTZ
```

### `rewards`
```sql
id                 UUID PRIMARY KEY
name               TEXT NOT NULL
description        TEXT
image_url          TEXT
coins_required     INT NOT NULL
quantity_available INT DEFAULT 0
is_active          BOOLEAN DEFAULT true
slug               TEXT
created_at         TIMESTAMPTZ
```

### `reward_claims`
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id)
reward_id   UUID REFERENCES rewards(id)
status      TEXT DEFAULT 'pending' -- 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled'
coins_spent INT NOT NULL
created_at  TIMESTAMPTZ
```

### `site_settings`
```sql
id         UUID PRIMARY KEY
key        TEXT UNIQUE NOT NULL
value      TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

---

## Functions/RPCs PostgreSQL

| Função | Descrição |
|--------|-----------|
| `increment_likes(post_id)` | Incrementa likes_count do post |
| `decrement_likes(post_id)` | Decrementa likes_count do post |
| `increment_comment_likes(p_comment_id)` | Incrementa likes de comentário |
| `decrement_comment_likes(p_comment_id)` | Decrementa likes de comentário |
| `check_user_ban(p_user_id, p_ban_type)` | Verifica se usuário está banido |

---

## Relações Principais

```
users 1──∞ posts
users 1──∞ post_likes
users 1──∞ post_comments
users 1──∞ post_saves
users 1──∞ post_votes
users 1──∞ post_shares
users 1──1 user_coins
users 1──∞ coin_transactions
users 1──∞ reward_claims
users 1──∞ challenge_participants
users 1──∞ user_follows (follower_id)
users 1──∞ user_follows (following_id)
users 1──∞ user_notifications
users 1──1 user_onboarding

posts 1──∞ post_likes
posts 1──∞ post_comments
posts 1──∞ post_saves
posts 1──∞ post_votes
posts 1──∞ post_shares

post_comments 1──∞ post_comments (parent_id → replies)
post_comments 1──∞ comment_likes

challenges 1──∞ challenge_participants
challenges 1──∞ challenge_winners
challenges 1──∞ challenge_prizes

rewards 1──∞ reward_claims

events 1──∞ event_registrations
```

---

## Site Settings (83 keys)

Agrupadas por funcionalidade:

- **Branding:** `site_name`, `site_description`, `logo_url`, `hero_title`, `hero_subtitle`, `footer_text`, `login_title`, `login_subtitle`
- **Creator:** `creator_name`, `creator_handle`, `creator_avatar_url`
- **SEO:** 16 keys (`seo_home_*`, `seo_login_*`, `seo_registro_*`, `seo_desafios_*`, `seo_eventos_*`, `seo_premios_*`, `seo_ranking_*`, `seo_seja_arena_*`)
- **Meta Tags:** `meta_title`, `meta_description`, `meta_pixel_id`, `meta_access_token`
- **Email Templates:** 18 keys (`email_approval_*`, `email_followup_*`, `email_onboarding1_*`, `email_onboarding2_*`, `email_onboarding3_*`, `email_from_name`)
- **Integrações:** `openai_api_key`, `gemini_api_key`, `perspective_api_key`, `youtube_api_key`, `youtube_channel_handle`, `resend_api_key`, `resend_from_email`, `google_analytics_id`
- **WhatsApp:** `whatsapp_access_token`, `whatsapp_app_secret`, `whatsapp_phone_number_id`, `whatsapp_webhook_verify_token`
- **Moderação:** `moderation_enabled`, `moderation_block_threshold`, `moderation_review_threshold`
- **NPS:** `nps_auto_approval_enabled`, `nps_auto_approval_min_score`
