# Row Level Security (RLS) Policies

Este documento descreve as políticas de Row Level Security (RLS) implementadas no Supabase para proteger os dados da plataforma.

## Visão Geral

RLS é uma feature do PostgreSQL que permite controlar o acesso a linhas específicas de uma tabela baseado em condições definidas. No Supabase, RLS é essencial para garantir que usuários só acessem dados que têm permissão.

## Tabelas e Políticas

### 1. `profiles` (Perfis de Usuário)

| Política | Operação | Condição |
|----------|----------|----------|
| `profiles_select_own` | SELECT | `auth.uid() = id` |
| `profiles_update_own` | UPDATE | `auth.uid() = id` |
| `profiles_select_public` | SELECT | `is_public = true` (para perfis públicos) |

**Notas:**
- Usuários só podem ver e editar seu próprio perfil
- Perfis públicos podem ser visualizados por qualquer usuário autenticado

### 2. `posts` (Publicações)

| Política | Operação | Condição |
|----------|----------|----------|
| `posts_select_approved` | SELECT | `status = 'approved'` OR `author_id = auth.uid()` |
| `posts_insert_own` | INSERT | `auth.uid() = author_id` |
| `posts_update_own` | UPDATE | `auth.uid() = author_id` |
| `posts_delete_own` | DELETE | `auth.uid() = author_id` |

**Notas:**
- Posts aprovados são visíveis para todos
- Posts pendentes só são visíveis pelo autor
- Apenas o autor pode editar/deletar seus posts

### 3. `comments` (Comentários)

| Política | Operação | Condição |
|----------|----------|----------|
| `comments_select_all` | SELECT | `true` (todos autenticados) |
| `comments_insert_own` | INSERT | `auth.uid() = user_id` |
| `comments_update_own` | UPDATE | `auth.uid() = user_id` |
| `comments_delete_own` | DELETE | `auth.uid() = user_id` |

### 4. `votes` (Votos)

| Política | Operação | Condição |
|----------|----------|----------|
| `votes_select_own` | SELECT | `auth.uid() = user_id` |
| `votes_insert_own` | INSERT | `auth.uid() = user_id` |
| `votes_update_own` | UPDATE | `auth.uid() = user_id` |
| `votes_delete_own` | DELETE | `auth.uid() = user_id` |

### 5. `challenges` (Desafios)

| Política | Operação | Condição |
|----------|----------|----------|
| `challenges_select_active` | SELECT | `is_active = true` OR user is admin |
| `challenges_insert_admin` | INSERT | User has role 'admin' or 'creator' |
| `challenges_update_admin` | UPDATE | User has role 'admin' or 'creator' |
| `challenges_delete_admin` | DELETE | User has role 'admin' or 'creator' |

### 6. `challenge_participants` (Participações em Desafios)

| Política | Operação | Condição |
|----------|----------|----------|
| `participants_select_own` | SELECT | `auth.uid() = user_id` OR user is admin |
| `participants_insert_own` | INSERT | `auth.uid() = user_id` |
| `participants_update_admin` | UPDATE | User has role 'admin' or 'creator' |

### 7. `events` (Eventos)

| Política | Operação | Condição |
|----------|----------|----------|
| `events_select_public` | SELECT | `is_published = true` OR user is admin |
| `events_insert_admin` | INSERT | User has role 'admin' or 'creator' |
| `events_update_admin` | UPDATE | User has role 'admin' or 'creator' |
| `events_delete_admin` | DELETE | User has role 'admin' or 'creator' |

### 8. `rewards` (Prêmios)

| Política | Operação | Condição |
|----------|----------|----------|
| `rewards_select_active` | SELECT | `is_active = true` |
| `rewards_insert_admin` | INSERT | User has role 'admin' |
| `rewards_update_admin` | UPDATE | User has role 'admin' |

### 9. `reward_redemptions` (Resgates)

| Política | Operação | Condição |
|----------|----------|----------|
| `redemptions_select_own` | SELECT | `auth.uid() = user_id` OR user is admin |
| `redemptions_insert_own` | INSERT | `auth.uid() = user_id` |
| `redemptions_update_admin` | UPDATE | User has role 'admin' |

### 10. `nps_leads` (Leads NPS)

| Política | Operação | Condição |
|----------|----------|----------|
| `leads_select_admin` | SELECT | User has role 'admin' or 'creator' |
| `leads_insert_public` | INSERT | `true` (público para formulário) |
| `leads_update_admin` | UPDATE | User has role 'admin' or 'creator' |

### 11. `notifications_log` (Log de Notificações)

| Política | Operação | Condição |
|----------|----------|----------|
| `notifications_select_admin` | SELECT | User has role 'admin' |
| `notifications_insert_service` | INSERT | Via service role only |
| `notifications_update_service` | UPDATE | Via service role only |

### 12. `scheduled_tasks` (Tarefas Agendadas)

| Política | Operação | Condição |
|----------|----------|----------|
| `tasks_select_admin` | SELECT | User has role 'admin' |
| `tasks_all_service` | ALL | Via service role only |

## Storage (Buckets)

### `post-images` (Imagens de Posts)

| Política | Operação | Condição |
|----------|----------|----------|
| `post_images_select` | SELECT | `true` (público) |
| `post_images_insert` | INSERT | `auth.uid() IS NOT NULL` |
| `post_images_delete` | DELETE | Owner do arquivo ou admin |

**Validações adicionais:**
- Tipos permitidos: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Tamanho máximo: 5MB
- Magic bytes validados no backend

### `avatars` (Avatares)

| Política | Operação | Condição |
|----------|----------|----------|
| `avatars_select` | SELECT | `true` (público) |
| `avatars_insert` | INSERT | `auth.uid() = owner` |
| `avatars_update` | UPDATE | `auth.uid() = owner` |
| `avatars_delete` | DELETE | `auth.uid() = owner` |

## Funções Auxiliares

### `is_admin()`
Verifica se o usuário atual tem role 'admin'.

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `is_admin_or_creator()`
Verifica se o usuário atual tem role 'admin' ou 'creator'.

```sql
CREATE OR REPLACE FUNCTION is_admin_or_creator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'creator' OR is_creator = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Bypass de RLS (Service Role)

Algumas operações requerem bypass de RLS usando o `service_role`:

1. **CRON jobs**: Processamento de tarefas agendadas
2. **Webhooks**: Atualização de status de notificações
3. **Análise de IA**: Atualização de análises de leads
4. **Admin bulk operations**: Operações em massa

⚠️ **IMPORTANTE**: O uso de `createAdminClient()` deve ser:
- Limitado a operações que realmente necessitam
- Auditado regularmente
- Nunca exposto ao cliente

## Checklist de Segurança

- [ ] Todas as tabelas têm RLS habilitado
- [ ] Políticas de SELECT restringem dados sensíveis
- [ ] INSERT/UPDATE validam ownership
- [ ] DELETE é restrito apropriadamente
- [ ] Storage valida tipos de arquivo
- [ ] Service role usado apenas quando necessário
- [ ] Funções SECURITY DEFINER revisadas

## Auditoria

Para auditar uso de service role:

```sql
SELECT * FROM auth.audit_log_entries
WHERE actor_id IS NULL -- Service role não tem actor_id
ORDER BY created_at DESC
LIMIT 100;
```

## Atualizações

Ao modificar políticas:

1. Testar em ambiente de desenvolvimento
2. Documentar mudanças neste arquivo
3. Revisar impacto em features existentes
4. Aplicar em produção via migration
5. Verificar logs de erro após deploy
