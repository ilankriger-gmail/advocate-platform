# Auditoria de Seguranca - Plataforma Advocate Marketing

**Data:** 2026-01-10
**Última Atualização:** 2026-01-11
**Status:** Em Correção

---

## Resumo Executivo

| Severidade | Quantidade | Corrigidos | Pendentes |
|------------|------------|------------|-----------|
| CRITICO | 4 | 0 | 4 |
| ALTO | 5 | 1 | 4 |
| MEDIO | 10 | 0 | 10 |
| BAIXO | 6 | 0 | 6 |

**Última Correção:** Webhook Aceita Sem Validacao em Dev (#7) - 2026-01-11

---

## VULNERABILIDADES CRITICAS (P0)

### 1. Falta de Verificacao Admin em Moderacao de Posts
**Arquivo:** `src/actions/posts.ts` (linhas 343, 375, 410)

**Problema:** As funcoes `approvePost()`, `rejectPost()`, e `approveBlockedPost()` verificam apenas autenticacao, NAO verificam se usuario e admin/creator.

```typescript
// VULNERAVEL - Qualquer usuario autenticado pode moderar
export async function approvePost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { error: 'Usuario nao autenticado' }; }
  // FALTA: Verificar role === 'admin' || is_creator === true
}
```

**Correcao:**
```typescript
export async function approvePost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { error: 'Usuario nao autenticado' }; }

  // ADICIONAR: Verificar permissao
  const { data: profile } = await supabase
    .from('users')
    .select('role, is_creator')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
    return { error: 'Acesso nao autorizado' };
  }
  // ... resto da funcao
}
```

---

### 2. XSS em InstagramCard (dangerouslySetInnerHTML)
**Arquivo:** `src/components/home/InstagramCard.tsx` (linha 94)

**Problema:** HTML renderizado sem sanitizacao
```typescript
dangerouslySetInnerHTML={{ __html: post.content }} // VULNERAVEL
```

**Correcao:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedContent = DOMPurify.sanitize(post.content, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
  ALLOWED_ATTR: []
});

dangerouslySetInnerHTML={{ __html: sanitizedContent }}
```

---

### 3. Open Redirect no Auth Callback
**Arquivo:** `src/app/auth/callback/route.ts` (linhas 11-18)

**Problema:** Parametro `next` nao validado
```typescript
const next = searchParams.get('next') ?? '/dashboard';
return NextResponse.redirect(`${origin}${next}`); // VULNERAVEL
```

**Correcao:**
```typescript
const ALLOWED_REDIRECTS = ['/', '/dashboard', '/perfil', '/desafios', '/eventos', '/ranking', '/premios'];

const next = searchParams.get('next') ?? '/dashboard';
const safeNext = ALLOWED_REDIRECTS.includes(next) ? next : '/dashboard';
return NextResponse.redirect(`${origin}${safeNext}`);
```

---

### 4. RLS Permissiva em post_shares
**Arquivo:** `supabase/migrations/20260108000002_feed_improvements.sql` (linhas 110-116)

**Problema:**
```sql
CREATE POLICY "Anyone can create shares" ON post_shares
  FOR INSERT WITH CHECK (true);  -- MUITO PERMISSIVA
```

**Correcao:**
```sql
DROP POLICY IF EXISTS "Anyone can create shares" ON post_shares;
CREATE POLICY "Authenticated users can create shares" ON post_shares
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
```

---

## VULNERABILIDADES ALTAS (P1)

### 5. API Keys em URLs (Query Parameters)
**Arquivos:**
- `src/lib/gemini.ts` (linha 54)
- `src/lib/moderation/toxicity-analysis.ts` (linha 115)

**Problema:** API keys expostas em URLs podem vazar em logs
```typescript
`https://generativelanguage.googleapis.com/...?key=${apiKey}`
```

**Correcao:** Usar headers Authorization quando possivel

---

### 6. Logging de Dados Sensiveis
**Arquivos:**
- `src/actions/posts.ts` (linha 58)
- `src/actions/challenges-admin.ts` (linhas 155, 165)
- `src/actions/rewards-admin.ts` (linhas 20, 30)

**Problema:**
```typescript
console.log('createPost - userId:', user.id, 'userData:', userData);
```

**Correcao:** Remover ou ofuscar dados sensiveis em logs

---

### 7. Webhook Aceita Sem Validacao em Dev ✅ CORRIGIDO
**Arquivos:**
- `src/app/api/webhooks/whatsapp/route.ts` (linhas 58-64)
- `src/app/api/webhooks/resend/route.ts` (linhas 52-55)

**Problema:** Em desenvolvimento, webhooks sao aceitos sem validacao de assinatura

**Correcao Aplicada:**
- ✅ Removido bypass que retornava `true` quando secrets não configurados
- ✅ Implementado fail-secure: webhooks rejeitam requisições sem secret válido
- ✅ Verificação de assinatura agora SEMPRE executada em todos os ambientes
- ✅ Documentado WHATSAPP_APP_SECRET e RESEND_WEBHOOK_SECRET como obrigatórios em `.env.local.example`
- ✅ Adicionadas instruções detalhadas de como obter os secrets

---

### 8. Falta de Rate Limiting
**Impacto:** Toda aplicacao

**Endpoints Vulneraveis:**
- Login/Signup (brute force)
- Webhooks (DDoS)
- API endpoints publicos
- Server Actions

**Correcao:** Implementar rate limiting com Vercel Edge ou upstash/ratelimit

---

### 9. RLS Faltando Policies de UPDATE/DELETE em posts
**Tabela:** `posts`

**Correcao SQL:**
```sql
CREATE POLICY "Only admin can moderate posts"
ON posts FOR UPDATE
USING (
  (select auth.uid()) = user_id OR
  EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND (role = 'admin' OR is_creator = true))
);
```

---

## VULNERABILIDADES MEDIAS (P2)

### 10. Validacao de Email Fraca
**Arquivo:** `src/actions/leads.ts` (linha 79)
```typescript
if (!data.email || !data.email.includes('@')) // FRACA
```

### 11. Senha Minima de 6 Caracteres
**Arquivo:** `src/actions/auth.ts` (linha 68)

### 12. Falta de CSRF Tokens
**Impacto:** Formularios sem protecao CSRF adicional

### 13. Settings Verifica Apenas is_creator
**Arquivo:** `src/actions/settings.ts` (linhas 29, 71)

### 14. RichTextEditor Sem Sanitizacao
**Arquivo:** `src/components/editor/RichTextEditor.tsx` (linha 267)

### 15. Inconsistencia em Verificacao de Auth
**Problema:** Algumas actions usam `verifyAdmin()`, outras verificam manualmente

### 16. Falta de Auditoria de Acoes Admin
**Problema:** Operacoes privilegiadas sem logging

### 17. Timing Attack em checkEmailApproved
**Arquivo:** `src/actions/leads.ts` (linhas 571-593)

### 18. Cron Route Aceita em Dev Sem Secret
**Arquivo:** `src/app/api/cron/process-tasks/route.ts` (linhas 33-50)

### 19. Error Messages Verbosas
**Problema:** `error.message` retornado ao cliente

---

## VULNERABILIDADES BAIXAS (P3)

### 20. Arquivo .env.lo de Backup
### 21. Prefixo de API Key em Logs
### 22. Falta Validacao Env Vars no Startup
### 23. CSP usa unsafe-inline/unsafe-eval
### 24. Falta npm audit Regular
### 25. Documentacao de Seguranca

---

## CONFIGURACOES DO DASHBOARD SUPABASE

### Auth Settings (https://supabase.com/dashboard/project/gsxanzgwstlpfvnqcmiu/auth/settings)
- [ ] Leaked password protection (HaveIBeenPwned)
- [ ] Min password length: 8+
- [ ] Require email confirmation
- [ ] Rate limiting

### Database Settings
- [ ] Enforce SSL connections
- [ ] Network restrictions (se aplicavel)

---

## PLANO DE CORRECAO

### Fase 1 - Critico (Imediato)
1. [ ] Adicionar verificacao admin em approvePost/rejectPost/approveBlockedPost
2. [ ] Sanitizar HTML em InstagramCard
3. [ ] Validar redirect no auth callback
4. [ ] Corrigir RLS em post_shares

### Fase 2 - Alto (Esta Semana)
5. [ ] Remover console.logs com dados sensiveis
6. [ ] Implementar rate limiting basico
7. [ ] Adicionar RLS policies para UPDATE/DELETE em posts
8. [x] Melhorar validacao de webhooks (CONCLUÍDO - 2026-01-11)

### Fase 3 - Medio (Proximas 2 Semanas)
9. [ ] Melhorar validacao de email
10. [ ] Aumentar requisitos de senha
11. [ ] Centralizar verificacoes de auth
12. [ ] Adicionar audit logging

### Fase 4 - Baixo (Backlog)
13. [ ] Limpar arquivos desnecessarios
14. [ ] Melhorar CSP em producao
15. [ ] Documentar praticas de seguranca

---

## PONTOS POSITIVOS

- RLS habilitado nas tabelas principais
- Headers de seguranca configurados (CSP, HSTS, X-Frame-Options)
- DOMPurify usado em PostCard
- Service Role Key apenas server-side
- Parametrized queries (sem SQL injection)
- HMAC com timingSafeEqual em webhooks
- Verificacao de proprietario em operacoes criticas
