# Guia de Troubleshooting - Plataforma de Advocate Marketing

## 📋 Índice

- [Introdução](#introdução)
- [Links Rápidos](#links-rápidos)
- [Categorias de Erros](#categorias-de-erros)
  - [1. Erros de Variáveis de Ambiente](#1-erros-de-variáveis-de-ambiente)
  - [2. Erros de Autenticação](#2-erros-de-autenticação)
  - [3. Erros do Supabase](#3-erros-do-supabase)
  - [4. Erros de APIs Externas](#4-erros-de-apis-externas)
- [Ferramentas de Diagnóstico](#ferramentas-de-diagnóstico)
- [Recursos Adicionais](#recursos-adicionais)

---

## Introdução

Este guia contém soluções para os erros mais comuns encontrados durante o desenvolvimento e operação da Plataforma de Advocate Marketing. O objetivo é economizar tempo de troubleshooting e fornecer soluções práticas e testadas.

### Como Usar Este Guia

1. **Identifique a categoria do erro**: Use o índice acima para navegar até a seção relevante
2. **Procure pela mensagem de erro**: Busque pela mensagem exata que você está vendo
3. **Siga os passos de solução**: Cada erro tem passos claros para resolução
4. **Use as ferramentas de diagnóstico**: Execute `npm run check-env` para verificar sua configuração

### Stack Tecnológica

Este guia cobre erros relacionados a:
- **Frontend**: Next.js 15 (App Router)
- **Backend/Database**: Supabase
- **Autenticação**: Supabase Auth (Email/Password + OAuth Google)
- **APIs Externas**: Google Gemini AI
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS

---

## Links Rápidos

### Guias de Configuração
- [Configuração Inicial do Supabase](./SETUP_SUPABASE.md) _(em desenvolvimento)_
- [Configuração de Variáveis de Ambiente](#1-erros-de-variáveis-de-ambiente)
- [Configuração do OAuth Google](#21-erro-oauth-google-não-configurado)

### Ferramentas
- [Script de Verificação de Ambiente](#ferramentas-de-diagnóstico)
- [Exemplo de .env.local](../.env.local.example)

### Documentação Externa
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Next.js 15](https://nextjs.org/docs)
- [Documentação do Gemini AI](https://ai.google.dev/docs)

---

## Categorias de Erros

### 1. Erros de Variáveis de Ambiente

Erros relacionados a variáveis de ambiente faltantes ou mal configuradas são a causa mais comum de problemas durante o desenvolvimento.

**Variáveis Obrigatórias:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

**Variáveis Opcionais:**
- `GEMINI_API_KEY` (necessária para verificação automática de vídeos)
- `SUPABASE_SERVICE_ROLE_KEY` (necessária para operações administrativas)

**Ações Rápidas:**
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Execute `npm run check-env` para diagnosticar problemas
3. Compare seu arquivo com `.env.local.example`

---

#### 1.1. Erro: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Mensagem de Erro:**
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
createClientComponentClient requires NEXT_PUBLIC_SUPABASE_URL
```

**Causa:**
A variável de ambiente `NEXT_PUBLIC_SUPABASE_URL` não está definida no arquivo `.env.local` ou o servidor não foi reiniciado após adicionar a variável.

**Impacto:**
- ❌ Aplicação não consegue conectar com o banco de dados Supabase
- ❌ Todas as operações de autenticação falharão
- ❌ Página de login/registro não funcionará
- ❌ Aplicação pode crashar ao carregar

**Solução:**

1. **Obter a URL do Supabase:**
   - Acesse o [Supabase Dashboard](https://app.supabase.com)
   - Selecione seu projeto
   - Vá para **Settings** > **API**
   - Copie o valor de **Project URL** (exemplo: `https://xxxxxxxxxxxx.supabase.co`)

2. **Adicionar ao arquivo `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
   ```

3. **Reiniciar o servidor de desenvolvimento:**
   ```bash
   # Pare o servidor (Ctrl+C) e reinicie
   npm run dev
   ```

4. **Verificar:**
   - Acesse a página inicial do projeto
   - Verifique se o erro desapareceu
   - Tente fazer login ou criar uma conta

**⚠️ Atenção:**
- A URL deve começar com `https://` e terminar com `.supabase.co`
- Não adicione `/` no final da URL
- Esta variável tem o prefixo `NEXT_PUBLIC_` porque é usada no cliente (browser)

---

#### 1.2. Erro: "NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined"

**Mensagem de Erro:**
```
Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined
createClientComponentClient requires NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Causa:**
A variável de ambiente `NEXT_PUBLIC_SUPABASE_ANON_KEY` não está definida no arquivo `.env.local` ou o servidor não foi reiniciado após adicionar a variável.

**Impacto:**
- ❌ Aplicação não consegue autenticar requisições ao Supabase
- ❌ Todas as operações de leitura/escrita no banco falharão
- ❌ Login e registro não funcionarão
- ❌ Aplicação pode crashar ao carregar

**Solução:**

1. **Obter a Anon Key do Supabase:**
   - Acesse o [Supabase Dashboard](https://app.supabase.com)
   - Selecione seu projeto
   - Vá para **Settings** > **API**
   - Copie o valor de **anon public** (um token JWT longo)

2. **Adicionar ao arquivo `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Reiniciar o servidor de desenvolvimento:**
   ```bash
   # Pare o servidor (Ctrl+C) e reinicie
   npm run dev
   ```

4. **Verificar:**
   - Acesse a página inicial do projeto
   - Verifique se o erro desapareceu
   - Tente fazer login ou criar uma conta

**⚠️ Atenção:**
- Esta é uma chave pública (anon/anonymous) e pode ser exposta no cliente
- É diferente da `service_role` key (que é secreta e nunca deve ser exposta)
- A segurança é garantida pelas políticas de RLS (Row Level Security) no Supabase
- Esta variável tem o prefixo `NEXT_PUBLIC_` porque é usada no cliente (browser)

---

#### 1.3. Erro: "NEXT_PUBLIC_SITE_URL is not defined"

**Mensagem de Erro:**
```
Warning: NEXT_PUBLIC_SITE_URL is not defined
Defaulting to http://localhost:3000
```

**Causa:**
A variável de ambiente `NEXT_PUBLIC_SITE_URL` não está definida. Esta variável é especialmente importante para:
- Callbacks de autenticação (OAuth Google, Email confirmação)
- URLs de redirecionamento
- Geração de links absolutos

**Impacto:**
- ⚠️ OAuth Google pode não funcionar corretamente
- ⚠️ Email de confirmação pode ter links quebrados
- ⚠️ Redirecionamentos após login podem falhar
- ✅ Aplicação continua funcionando localmente

**Solução:**

1. **Para Desenvolvimento Local:**
   ```env
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

2. **Para Produção (Vercel, Netlify, etc.):**
   ```env
   NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
   ```

3. **Configurar no Supabase:**
   - Acesse o [Supabase Dashboard](https://app.supabase.com)
   - Vá para **Authentication** > **URL Configuration**
   - Adicione a URL em **Site URL**
   - Adicione em **Redirect URLs**: `https://seu-dominio.com/auth/callback`

4. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

**⚠️ Atenção:**
- Use `http://localhost:3000` para desenvolvimento local
- Use `https://` (não `http://`) em produção
- Não adicione `/` no final da URL
- Certifique-se que a URL está registrada no Supabase para OAuth funcionar

---

#### 1.4. Erro: "SUPABASE_SERVICE_ROLE_KEY is not defined"

**Mensagem de Erro:**
```
Warning: SUPABASE_SERVICE_ROLE_KEY not configured
Server-side admin operations may fail
```

**Causa:**
A variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` não está configurada. Esta é uma chave opcional mas necessária para operações administrativas no servidor.

**Impacto:**
- ⚠️ Operações administrativas falharão (ex: deletar usuários, bypass RLS)
- ⚠️ Server Actions que precisam de acesso total ao banco falharão
- ✅ Funcionalidades normais da aplicação continuam funcionando
- ✅ Usuários regulares não são afetados

**Quando é Necessária:**
- Operações de admin que precisam bypass de RLS
- Gerenciamento de usuários (criar/deletar contas)
- Operações de manutenção do banco
- Scripts de seed/migração

**Solução:**

1. **Obter a Service Role Key do Supabase:**
   - Acesse o [Supabase Dashboard](https://app.supabase.com)
   - Selecione seu projeto
   - Vá para **Settings** > **API**
   - Copie o valor de **service_role** (um token JWT longo)
   - ⚠️ **ATENÇÃO**: Esta chave tem acesso total ao banco!

2. **Adicionar ao arquivo `.env.local`:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

**🔐 SEGURANÇA CRÍTICA:**
- ⛔ **NUNCA** exponha esta chave no cliente (não use prefixo `NEXT_PUBLIC_`)
- ⛔ **NUNCA** commite esta chave no Git
- ⛔ **NUNCA** use em Client Components
- ✅ Use apenas em Server Actions e Route Handlers
- ✅ Adicione `.env.local` no `.gitignore`
- ✅ Em produção, configure como variável de ambiente no host (Vercel, etc.)

**Exemplo de uso seguro:**
```typescript
// ✅ CORRETO: Server Action
'use server'
import { createClient } from '@/lib/supabase/server'

export async function adminAction() {
  const supabase = createClient({
    serviceRole: true // Usa a service role key
  })
  // Operações administrativas aqui
}

// ❌ ERRADO: Client Component
'use client'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // ⛔ NUNCA FAÇA ISSO!
```

---

#### 1.5. Erro: "GEMINI_API_KEY is not defined"

**Mensagem de Erro:**
```
Warning: GEMINI_API_KEY not configured
Video verification will use manual review
```

**Causa:**
A variável de ambiente `GEMINI_API_KEY` não está configurada. Esta chave é opcional e usada para verificação automática de vídeos via Google Gemini AI.

**Impacto:**
- ⚠️ Verificação automática de vídeos de desafios não funcionará
- ⚠️ Sistema cairá para verificação manual (menos eficiente)
- ✅ Aplicação continua funcionando normalmente
- ✅ Usuários podem submeter vídeos, mas precisam de aprovação manual

**Solução:**

1. **Obter uma API Key do Gemini:**
   - Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Faça login com sua conta Google
   - Clique em **Create API Key**
   - Copie a chave gerada

2. **Adicionar ao arquivo `.env.local`:**
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```

3. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

4. **Verificar:**
   - Tente submeter um vídeo de desafio
   - A verificação automática deve aparecer
   - Verifique os logs do servidor para confirmar uso da API

**💰 Pricing:**
- ✅ API Gemini tem um tier gratuito generoso
- ✅ Suficiente para desenvolvimento e MVPs
- ℹ️ Ver detalhes em: [ai.google.dev/pricing](https://ai.google.dev/pricing)

**🔍 Troubleshooting:**
- Se a API Key não funcionar, veja seção [4.2 - Erro ao conectar com API Gemini](#42-erro-erro-ao-conectar-com-api-gemini)
- Verifique se a "Generative Language API" está habilitada no Google Cloud Console
- Confirme que não há restrições de IP ou domínio na key

---

#### 1.6. Arquivo .env.local não existe

**Sintoma:**
Múltiplos erros de variáveis de ambiente não definidas ao iniciar o projeto.

**Causa:**
O arquivo `.env.local` não foi criado na raiz do projeto.

**Solução:**

1. **Criar o arquivo `.env.local` na raiz do projeto:**
   ```bash
   # Na raiz do projeto
   touch .env.local
   ```

2. **Copiar o template do exemplo:**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Preencher as variáveis obrigatórias:**
   ```env
   # Supabase (OBRIGATÓRIO)
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui

   # Site URL (OBRIGATÓRIO)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # Opcionais
   GEMINI_API_KEY=sua-gemini-key-aqui
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
   ```

4. **Verificar se o arquivo não está no Git:**
   ```bash
   # .env.local deve estar no .gitignore
   cat .gitignore | grep .env.local
   ```

5. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

**📝 Checklist:**
- [ ] Arquivo `.env.local` existe na raiz do projeto
- [ ] Todas as variáveis obrigatórias estão preenchidas
- [ ] Valores foram copiados corretamente do Supabase Dashboard
- [ ] Arquivo está no `.gitignore`
- [ ] Servidor foi reiniciado após criar/modificar o arquivo

---

#### 1.7. Erro: "Invalid Supabase URL format"

**Mensagem de Erro:**
```
Error: Invalid Supabase URL format
Expected format: https://[project-id].supabase.co
```

**Causas Possíveis:**
- URL sem `https://`
- URL com `/` no final
- URL de projeto pausado ou deletado
- Typo na URL

**Solução:**

1. **Verificar o formato da URL:**
   ```env
   # ✅ CORRETO
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co

   # ❌ ERRADO - sem https://
   NEXT_PUBLIC_SUPABASE_URL=abcdefghijk.supabase.co

   # ❌ ERRADO - com / no final
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co/

   # ❌ ERRADO - URL de outra página
   NEXT_PUBLIC_SUPABASE_URL=https://app.supabase.com/project/abcdefghijk
   ```

2. **Copiar a URL correta do Dashboard:**
   - Acesse o [Supabase Dashboard](https://app.supabase.com)
   - Selecione seu projeto
   - Vá para **Settings** > **API**
   - Copie exatamente o valor de **Project URL**

3. **Verificar se o projeto está ativo:**
   - Projetos pausados não aceitarão conexões
   - No Dashboard, verifique o status do projeto
   - Se necessário, reative o projeto

4. **Limpar cache e reiniciar:**
   ```bash
   # Limpar cache do Next.js
   rm -rf .next

   # Reiniciar servidor
   npm run dev
   ```

**🔍 Debug:**
```typescript
// Adicione no topo de um Server Action para debug
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

---

### 2. Erros de Autenticação

Erros relacionados ao sistema de autenticação do Supabase, incluindo login, registro, OAuth e gerenciamento de sessões.

**Tipos de Autenticação Suportados:**
- 📧 Email/Password (com confirmação de email)
- 🔐 OAuth Google
- 🔄 Refresh de sessão automático
- 🚪 Logout

**Fluxo de Autenticação:**
1. Usuário faz login ou registro
2. Supabase cria sessão e retorna tokens JWT
3. Tokens são armazenados em cookies
4. Middleware verifica autenticação em rotas protegidas
5. Server Actions usam sessão para operações no banco

**Ações Rápidas:**
1. Verifique se o projeto Supabase está ativo no [Dashboard](https://app.supabase.com)
2. Confirme que as URLs de callback do OAuth estão configuradas corretamente
3. Verifique as políticas de RLS no Supabase Dashboard
4. Limpe cookies e cache do navegador se houver problemas persistentes

---

#### 2.1. Erro: OAuth Google não configurado

**Mensagem de Erro:**
```
OAuth provider 'google' is not configured for this project
```

**Causa:**
O provedor OAuth Google não foi habilitado no projeto Supabase ou as credenciais OAuth não foram configuradas corretamente.

**Impacto:**
- ❌ Botão "Continuar com Google" não funciona
- ❌ Usuários não conseguem fazer login via Google
- ✅ Login com email/senha continua funcionando
- ✅ Usuários existentes não são afetados

**Solução:**

1. **Criar credenciais OAuth no Google Cloud Console:**
   - Acesse o [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um novo projeto ou selecione um existente
   - Vá para **APIs & Services** > **Credentials**
   - Clique em **Create Credentials** > **OAuth 2.0 Client ID**
   - Tipo de aplicativo: **Web application**
   - **Authorized JavaScript origins:**
     ```
     https://seu-projeto-id.supabase.co
     ```
   - **Authorized redirect URIs:**
     ```
     https://seu-projeto-id.supabase.co/auth/v1/callback
     ```
   - Clique em **Create** e copie o **Client ID** e **Client Secret**

2. **Configurar OAuth no Supabase:**
   - Acesse o [Supabase Dashboard](https://app.supabase.com)
   - Selecione seu projeto
   - Vá para **Authentication** > **Providers**
   - Encontre **Google** e clique para configurar
   - Habilite o provider
   - Cole o **Client ID** e **Client Secret** do Google
   - Clique em **Save**

3. **Adicionar tela de consentimento OAuth (se necessário):**
   - No Google Cloud Console, vá para **OAuth consent screen**
   - Configure as informações básicas do aplicativo
   - Adicione os escopos necessários: `email`, `profile`, `openid`
   - Adicione seu domínio em **Authorized domains**

4. **Testar a configuração:**
   - Limpe cookies do navegador
   - Acesse a página de login
   - Clique em "Continuar com Google"
   - Verifique se o popup de consentimento do Google aparece
   - Complete o login

**⚠️ Atenção:**
- Para desenvolvimento local, adicione `http://localhost:3000` nos **Authorized JavaScript origins**
- Para produção, use URLs HTTPS
- Pode levar alguns minutos para as configurações propagarem
- Se estiver testando em modo development do Google Cloud, adicione seu email como test user

**🔍 Troubleshooting Adicional:**
- Se aparecer "redirect_uri_mismatch", verifique se as URLs de callback estão idênticas no Google e Supabase
- Se aparecer "access_denied", verifique a tela de consentimento OAuth
- Verifique se a variável `NEXT_PUBLIC_SITE_URL` está configurada corretamente

---

#### 2.2. Erro: "Invalid login credentials"

**Mensagem de Erro:**
```
Invalid login credentials
```

**Causas Possíveis:**
- Email ou senha incorretos
- Usuário não existe no sistema
- Conta foi deletada
- Email ainda não foi confirmado (se confirmação obrigatória)

**Impacto:**
- ❌ Usuário não consegue fazer login
- ⚠️ Pode indicar tentativa de ataque se muitas tentativas falhas

**Solução:**

**Para Usuários:**

1. **Verificar credenciais:**
   - Confirme que o email está correto (sem espaços extras)
   - Verifique se o Caps Lock não está ativado
   - Tente redefinir a senha se não se lembrar

2. **Verificar se a conta existe:**
   - Tente fazer "Esqueci minha senha"
   - Se receber email, a conta existe
   - Se não receber, provavelmente precisa se registrar

3. **Verificar email de confirmação:**
   - Cheque sua caixa de entrada e spam
   - Procure por email de confirmação do Supabase
   - Clique no link de confirmação antes de fazer login

**Para Desenvolvedores:**

1. **Verificar no Supabase Dashboard:**
   - Vá para **Authentication** > **Users**
   - Busque pelo email do usuário
   - Verifique o status da conta (confirmado, ativo, etc.)

2. **Verificar políticas de senha:**
   - Supabase por padrão requer senhas com mínimo 6 caracteres
   - Verifique se há requisitos customizados em **Authentication** > **Policies**

3. **Verificar logs de autenticação:**
   - No Supabase Dashboard, vá para **Logs**
   - Filtre por "auth" para ver tentativas de login
   - Identifique o erro específico

4. **Testar com conta admin:**
   - Crie uma conta de teste no Dashboard manualmente
   - Tente fazer login com ela
   - Se funcionar, o problema é com a conta específica do usuário

**🔐 Segurança:**
```typescript
// Implementar rate limiting para prevenir brute force
// Exemplo em Server Action:
'use server'

import { ratelimit } from '@/lib/ratelimit'

export async function login(email: string, password: string) {
  // Rate limit por IP ou email
  const { success } = await ratelimit.limit(email)

  if (!success) {
    throw new Error('Muitas tentativas. Tente novamente em alguns minutos.')
  }

  // Continuar com login...
}
```

**⚠️ Atenção:**
- NUNCA revele se o email existe ou não (segurança)
- Mensagem genérica "Invalid credentials" é intencional
- Implemente rate limiting para prevenir ataques de força bruta
- Considere adicionar captcha após múltiplas tentativas falhas

---

#### 2.3. Erro: "Email not confirmed"

**Mensagem de Erro:**
```
Email not confirmed
You need to confirm your email address before signing in
```

**Causa:**
O usuário tentou fazer login mas ainda não confirmou o endereço de email clicando no link enviado por email.

**Impacto:**
- ❌ Usuário não consegue fazer login
- ✅ Conta foi criada e existe no sistema
- ⚠️ Email pode estar em spam ou não ter sido recebido

**Solução:**

**Para Usuários:**

1. **Verificar email de confirmação:**
   - Cheque a caixa de entrada do email cadastrado
   - Verifique a pasta de spam/lixo eletrônico
   - Procure por email com assunto "Confirm Your Email" ou similar

2. **Clicar no link de confirmação:**
   - Abra o email de confirmação
   - Clique no link de confirmação
   - Você será redirecionado para a aplicação
   - Tente fazer login novamente

3. **Reenviar email de confirmação:**
   - Na página de login, procure por "Reenviar email de confirmação"
   - Digite seu email
   - Verifique a caixa de entrada novamente

**Para Desenvolvedores:**

1. **Configurar emails no Supabase:**
   - Acesse **Authentication** > **Email Templates**
   - Customize o template de confirmação se necessário
   - Verifique se o from address está configurado corretamente

2. **Configurar SMTP customizado (recomendado para produção):**
   - Vá para **Project Settings** > **Auth**
   - Configure SMTP customizado (SendGrid, Postmark, etc.)
   - Isso melhora a deliverability dos emails
   - Configure SPF, DKIM e DMARC no DNS

3. **Verificar URL de callback:**
   - Em **Authentication** > **URL Configuration**
   - Verifique se o **Site URL** está correto
   - Adicione suas URLs de redirect em **Redirect URLs**

4. **Implementar função de reenvio de email:**
   ```typescript
   // Server Action para reenviar email de confirmação
   'use server'

   import { createClient } from '@/lib/supabase/server'

   export async function resendConfirmationEmail(email: string) {
     const supabase = createClient()

     const { error } = await supabase.auth.resend({
       type: 'signup',
       email: email,
     })

     if (error) {
       throw new Error('Erro ao reenviar email de confirmação')
     }

     return { success: true }
   }
   ```

5. **Desabilitar confirmação de email (apenas desenvolvimento):**
   - ⚠️ **Apenas para desenvolvimento local!**
   - Vá para **Authentication** > **Email Auth**
   - Desabilite "Confirm email"
   - **NUNCA faça isso em produção!**

6. **Confirmar manualmente via Dashboard:**
   - Vá para **Authentication** > **Users**
   - Encontre o usuário
   - Clique nos três pontos (...) > **Edit user**
   - Marque "Email confirmed"
   - Usuário pode fazer login imediatamente

**🔍 Troubleshooting de Deliverability:**

Se emails não estão chegando:

1. **Verificar logs:**
   ```bash
   # Verifique logs do Supabase
   # Dashboard > Logs > Auth logs
   ```

2. **Testar com diferentes provedores de email:**
   - Gmail geralmente funciona bem
   - Alguns domínios corporativos bloqueiam emails do Supabase
   - Use SMTP customizado para melhor controle

3. **Verificar rate limits:**
   - Supabase limita envio de emails por hora
   - Se exceder, emails não serão enviados

**⚠️ Atenção:**
- Em desenvolvimento, emails podem ir para spam
- Configure SMTP customizado para produção
- Considere implementar verificação por SMS como alternativa
- Informe aos usuários para checarem spam

---

#### 2.4. Erro: "Session expired" / "Auth session missing"

**Mensagem de Erro:**
```
Auth session missing!
Your session has expired. Please sign in again.
```

**Causa:**
A sessão do usuário expirou ou os tokens de autenticação foram invalidados. Isso pode acontecer por:
- Token JWT expirou (padrão: 1 hora)
- Refresh token expirou (padrão: 30 dias)
- Usuário fez logout em outro dispositivo
- Cookies foram limpos
- Servidor de auth do Supabase ficou indisponível temporariamente

**Impacto:**
- ❌ Usuário é deslogado automaticamente
- ❌ Requisições autenticadas falham
- ⚠️ Dados não salvos podem ser perdidos
- ✅ Segurança: previne sessões antigas de serem usadas

**Solução:**

**Para Usuários:**

1. **Fazer login novamente:**
   - Você será redirecionado automaticamente para a página de login
   - Entre com suas credenciais
   - Sua sessão será restaurada

2. **Prevenir logout inesperado:**
   - Mantenha a aba do navegador aberta
   - Não limpe cookies durante o uso
   - Verifique sua conexão com internet

**Para Desenvolvedores:**

1. **Implementar refresh automático de sessão:**
   ```typescript
   // lib/supabase/client.ts
   import { createBrowserClient } from '@supabase/ssr'

   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           // Cookies já gerenciados automaticamente
         },
         auth: {
           autoRefreshToken: true, // Refresh automático
           persistSession: true,   // Persiste sessão
           detectSessionInUrl: true, // Detecta sessão em callback URLs
         },
       }
     )
   }
   ```

2. **Implementar listener de mudanças de auth:**
   ```typescript
   // app/providers.tsx (Client Component)
   'use client'

   import { useEffect } from 'react'
   import { createClient } from '@/lib/supabase/client'
   import { useRouter } from 'next/navigation'

   export function AuthProvider({ children }: { children: React.ReactNode }) {
     const router = useRouter()
     const supabase = createClient()

     useEffect(() => {
       const {
         data: { subscription },
       } = supabase.auth.onAuthStateChange((event, session) => {
         if (event === 'SIGNED_OUT') {
           router.push('/login')
         }
         if (event === 'TOKEN_REFRESHED') {
           console.log('Token refreshed successfully')
         }
         if (event === 'SIGNED_IN') {
           router.refresh()
         }
       })

       return () => subscription.unsubscribe()
     }, [supabase, router])

     return <>{children}</>
   }
   ```

3. **Ajustar tempo de expiração dos tokens:**
   - Acesse **Authentication** > **Settings** no Supabase Dashboard
   - Ajuste **JWT expiry limit** (padrão: 3600 segundos = 1 hora)
   - Ajuste **Refresh token expiry** (padrão: 2592000 segundos = 30 dias)
   - ⚠️ Tokens mais longos = menos segurança, mas melhor UX

4. **Implementar middleware para verificar sessão:**
   ```typescript
   // middleware.ts
   import { createServerClient } from '@supabase/ssr'
   import { NextResponse, type NextRequest } from 'next/server'

   export async function middleware(request: NextRequest) {
     let response = NextResponse.next({
       request: {
         headers: request.headers,
       },
     })

     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           get(name: string) {
             return request.cookies.get(name)?.value
           },
           set(name: string, value: string, options: any) {
             response.cookies.set({ name, value, ...options })
           },
           remove(name: string, options: any) {
             response.cookies.set({ name, value: '', ...options })
           },
         },
       }
     )

     const {
       data: { session },
     } = await supabase.auth.getSession()

     // Redirecionar para login se não autenticado
     if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
       const redirectUrl = request.nextUrl.clone()
       redirectUrl.pathname = '/login'
       redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
       return NextResponse.redirect(redirectUrl)
     }

     return response
   }

   export const config = {
     matcher: ['/dashboard/:path*', '/profile/:path*'],
   }
   ```

5. **Salvar estado antes de sessão expirar:**
   ```typescript
   // Hook customizado para auto-save
   'use client'

   import { useEffect } from 'react'
   import { useRouter } from 'next/navigation'

   export function useAuthSessionCheck() {
     const router = useRouter()

     useEffect(() => {
       const checkSession = async () => {
         const response = await fetch('/api/auth/session')
         if (!response.ok) {
           // Salvar dados não salvos no localStorage
           const unsavedData = document.querySelector('form')?.dataset
           if (unsavedData) {
             localStorage.setItem('unsaved-data', JSON.stringify(unsavedData))
           }
           router.push('/login?session=expired')
         }
       }

       // Verificar a cada 5 minutos
       const interval = setInterval(checkSession, 5 * 60 * 1000)
       return () => clearInterval(interval)
     }, [router])
   }
   ```

**🔍 Debug:**
```typescript
// Verificar sessão atual
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('Expires at:', session?.expires_at)
console.log('Expires in:', session?.expires_at ?
  Math.floor((session.expires_at * 1000 - Date.now()) / 1000) + ' seconds' :
  'No session')
```

**⚠️ Atenção:**
- Tokens JWT expiram por padrão em 1 hora
- Refresh token renova automaticamente se `autoRefreshToken: true`
- Em produção, sempre use HTTPS para cookies serem seguros
- Implemente save automático de formulários para prevenir perda de dados
- Considere mostrar warning 5 minutos antes da sessão expirar

---

#### 2.5. Erro: "User not authorized" / Problemas com RLS

**Mensagem de Erro:**
```
new row violates row-level security policy for table "table_name"
permission denied for table "table_name"
```

**Causa:**
As políticas de Row Level Security (RLS) do Supabase estão bloqueando a operação. Isso acontece quando:
- Usuário tenta acessar dados de outro usuário
- Política de RLS não foi criada para a operação (SELECT, INSERT, UPDATE, DELETE)
- Política existe mas a condição não é satisfeita
- RLS está habilitado mas sem políticas (bloqueia tudo)

**Impacto:**
- ❌ Operações no banco de dados falham
- ❌ Usuário não consegue ver/criar/editar dados
- ✅ Segurança: previne acesso não autorizado
- ⚠️ Pode afetar funcionalidades críticas se mal configurado

**Solução:**

**Para Desenvolvedores:**

1. **Verificar se RLS está habilitado:**
   ```sql
   -- No Supabase SQL Editor
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

2. **Verificar políticas existentes:**
   ```sql
   -- Ver todas as políticas de uma tabela
   SELECT * FROM pg_policies WHERE tablename = 'nome_da_tabela';
   ```

3. **Criar políticas básicas de RLS:**
   ```sql
   -- Exemplo: Tabela de profiles
   -- Usuários podem ver apenas seu próprio perfil

   -- 1. Habilitar RLS
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- 2. Política para SELECT (ler)
   CREATE POLICY "Users can view own profile"
     ON profiles FOR SELECT
     USING (auth.uid() = user_id);

   -- 3. Política para INSERT (criar)
   CREATE POLICY "Users can create own profile"
     ON profiles FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   -- 4. Política para UPDATE (atualizar)
   CREATE POLICY "Users can update own profile"
     ON profiles FOR UPDATE
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);

   -- 5. Política para DELETE (deletar)
   CREATE POLICY "Users can delete own profile"
     ON profiles FOR DELETE
     USING (auth.uid() = user_id);
   ```

4. **Exemplo: Políticas para tabela de challenges (desafios):**
   ```sql
   -- Qualquer usuário autenticado pode ver desafios ativos
   CREATE POLICY "Anyone can view active challenges"
     ON challenges FOR SELECT
     USING (status = 'active');

   -- Apenas admins podem criar desafios
   CREATE POLICY "Only admins can create challenges"
     ON challenges FOR INSERT
     WITH CHECK (
       auth.uid() IN (
         SELECT user_id FROM profiles WHERE role = 'admin'
       )
     );

   -- Admins podem atualizar qualquer desafio
   CREATE POLICY "Admins can update challenges"
     ON challenges FOR UPDATE
     USING (
       auth.uid() IN (
         SELECT user_id FROM profiles WHERE role = 'admin'
       )
     );
   ```

5. **Exemplo: Políticas para tabela de submissions (submissões):**
   ```sql
   -- Usuários podem ver próprias submissões
   CREATE POLICY "Users can view own submissions"
     ON submissions FOR SELECT
     USING (auth.uid() = user_id);

   -- Admins podem ver todas as submissões
   CREATE POLICY "Admins can view all submissions"
     ON submissions FOR SELECT
     USING (
       auth.uid() IN (
         SELECT user_id FROM profiles WHERE role = 'admin'
       )
     );

   -- Usuários podem criar submissões para si mesmos
   CREATE POLICY "Users can create own submissions"
     ON submissions FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

6. **Testar políticas no SQL Editor:**
   ```sql
   -- Simular como usuário específico
   SET LOCAL role TO authenticated;
   SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-aqui"}';

   -- Testar query
   SELECT * FROM profiles WHERE user_id = 'user-uuid-aqui';
   ```

7. **Desabilitar RLS temporariamente (APENAS DESENVOLVIMENTO):**
   ```sql
   -- ⚠️ ATENÇÃO: NUNCA faça isso em produção!
   ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;
   ```

8. **Usar Service Role para bypass RLS (quando necessário):**
   ```typescript
   // Server Action com service role
   'use server'

   import { createClient } from '@/lib/supabase/server'

   export async function adminDeleteUser(userId: string) {
     // Verificar se usuário atual é admin
     const supabase = createClient()
     const { data: { user } } = await supabase.auth.getUser()

     const { data: profile } = await supabase
       .from('profiles')
       .select('role')
       .eq('user_id', user?.id)
       .single()

     if (profile?.role !== 'admin') {
       throw new Error('Unauthorized')
     }

     // Usar service role para deletar
     const supabaseAdmin = createClient({ serviceRole: true })

     const { error } = await supabaseAdmin
       .from('profiles')
       .delete()
       .eq('user_id', userId)

     if (error) throw error
   }
   ```

**🔍 Debug de Políticas:**

```typescript
// Verificar qual usuário está autenticado
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user?.id)

// Tentar operação e ver erro específico
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user?.id)

console.log('Data:', data)
console.log('Error:', error)

// Se erro de RLS, verificar políticas no dashboard
```

**📋 Checklist de RLS:**
- [ ] RLS está habilitado na tabela?
- [ ] Políticas foram criadas para todas as operações (SELECT, INSERT, UPDATE, DELETE)?
- [ ] A condição `USING` está correta?
- [ ] A condição `WITH CHECK` está correta (para INSERT/UPDATE)?
- [ ] O usuário está autenticado (`auth.uid()` não é null)?
- [ ] A role/permissão do usuário é suficiente?

**⚠️ Atenção:**
- RLS é sua principal camada de segurança no Supabase
- SEMPRE habilite RLS em tabelas com dados sensíveis
- Teste políticas extensivamente antes de ir para produção
- Use `auth.uid()` para identificar o usuário atual
- Combine RLS com validação no backend (Server Actions)
- Documente suas políticas para facilitar manutenção

**Recursos:**
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#performance)
- [Policy Examples](https://supabase.com/docs/guides/auth/row-level-security#policy-examples)

---

### 3. Erros do Supabase

Erros relacionados ao banco de dados Supabase, incluindo conexão, queries, Row Level Security (RLS), storage e migrações.

**Categorias Cobertas:**
- 🔌 **Conexão**: Problemas ao conectar com o Supabase
- 🔍 **Queries**: Erros em consultas SQL e operações no banco
- 🔐 **RLS**: Políticas de segurança bloqueando operações
- 📦 **Storage**: Problemas com upload/download de arquivos
- 🔄 **Migrações**: Erros ao aplicar mudanças no schema

**Ações Rápidas:**
1. Verifique o status do projeto no [Supabase Dashboard](https://app.supabase.com)
2. Confirme que as tabelas foram criadas corretamente
3. Revise as políticas de RLS para a tabela em questão
4. Verifique os logs de erro no Supabase Dashboard > Logs

---

#### 3.1. Erro: "Failed to fetch" / Erro de Conexão

**Mensagem de Erro:**
```
Failed to fetch
TypeError: Failed to fetch
NetworkError when attempting to fetch resource
```

**Causa:**
A aplicação não consegue se conectar com o servidor do Supabase. Possíveis causas:
- Projeto Supabase pausado ou deletado
- URL do Supabase incorreta
- Problemas de rede/firewall
- Supabase temporariamente indisponível
- CORS não configurado corretamente

**Impacto:**
- ❌ Todas as operações no banco de dados falham
- ❌ Autenticação não funciona
- ❌ Aplicação pode ficar completamente inutilizável
- ⚠️ Usuários veem mensagens de erro de conexão

**Solução:**

1. **Verificar status do projeto Supabase:**
   - Acesse o [Supabase Dashboard](https://app.supabase.com)
   - Verifique se o projeto está **Active** (não pausado)
   - Projetos inativos por muito tempo são pausados automaticamente
   - Se pausado, clique em **Resume Project**

2. **Verificar URL do Supabase:**
   ```bash
   # Verifique se a URL está correta
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```
   - Deve ser algo como: `https://abcdefghijk.supabase.co`
   - Compare com a URL no Dashboard: **Settings** > **API** > **Project URL**

3. **Testar conexão direta:**
   ```bash
   # Testar se o servidor responde
   curl https://seu-projeto-id.supabase.co/rest/v1/
   ```
   - Deve retornar uma resposta (pode ser erro 401, mas pelo menos conecta)
   - Se não responder, o problema é de rede ou projeto pausado

4. **Verificar firewall/proxy:**
   - Algumas redes corporativas bloqueiam o Supabase
   - Tente em uma rede diferente ou usando 4G
   - Configure exceção no firewall para `*.supabase.co`

5. **Verificar configuração de CORS (se usando domínio customizado):**
   - No Dashboard, vá para **Settings** > **API**
   - Em **CORS Configuration**, adicione seu domínio
   - Exemplo: `https://seu-dominio.com`

6. **Limpar cache e reiniciar:**
   ```bash
   # Limpar cache do Next.js
   rm -rf .next

   # Reiniciar servidor
   npm run dev
   ```

**🔍 Debug:**
```typescript
// Adicione em um Server Action para testar conexão
'use server'

import { createClient } from '@/lib/supabase/server'

export async function testConnection() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('profiles').select('count').limit(1)

    if (error) {
      console.error('Connection test failed:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Connected successfully' }
  } catch (err) {
    console.error('Network error:', err)
    return { success: false, error: 'Network error' }
  }
}
```

**⚠️ Atenção:**
- Projetos Supabase gratuitos são pausados após 1 semana de inatividade
- Reativar um projeto pode levar alguns minutos
- Em produção, considere um plano pago para evitar pausas automáticas
- Sempre verifique o status no Dashboard primeiro

---

#### 3.2. Erro: "relation does not exist" / Tabela não existe

**Mensagem de Erro:**
```
relation "public.table_name" does not exist
error: relation "profiles" does not exist
```

**Causa:**
A aplicação está tentando acessar uma tabela que não existe no banco de dados. Causas comuns:
- Migrações não foram executadas
- Tabela foi deletada acidentalmente
- Typo no nome da tabela
- Schema incorreto (public vs outro schema)

**Impacto:**
- ❌ Operações que usam essa tabela falham
- ❌ Pode causar crash da aplicação
- ⚠️ Outras tabelas podem continuar funcionando

**Solução:**

1. **Verificar se a tabela existe:**
   - Acesse o Supabase Dashboard
   - Vá para **Table Editor**
   - Procure pela tabela na lista

2. **Se a tabela não existe, criar manualmente:**
   ```sql
   -- Exemplo: Criar tabela de profiles
   CREATE TABLE profiles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     full_name TEXT,
     avatar_url TEXT,
     role TEXT DEFAULT 'advocate',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Criar índice para melhor performance
   CREATE INDEX idx_profiles_user_id ON profiles(user_id);

   -- Habilitar RLS
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Criar políticas básicas
   CREATE POLICY "Users can view own profile"
     ON profiles FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can update own profile"
     ON profiles FOR UPDATE
     USING (auth.uid() = user_id);
   ```

3. **Executar migrações do projeto:**
   ```bash
   # Se o projeto tem migrações SQL na pasta supabase/migrations/
   # Execute-as no SQL Editor do Supabase Dashboard

   # Ou se estiver usando Supabase CLI:
   supabase db push
   ```

4. **Verificar schema correto:**
   ```typescript
   // Se a tabela está em outro schema
   const { data, error } = await supabase
     .from('other_schema.table_name') // Especificar schema
     .select('*')

   // Ou configurar schema padrão no cliente
   ```

5. **Verificar typos no código:**
   ```typescript
   // ❌ ERRADO - typo no nome
   await supabase.from('profles').select('*')

   // ✅ CORRETO
   await supabase.from('profiles').select('*')
   ```

**🔄 Criando Todas as Tabelas do Projeto:**

Se você precisa recriar todas as tabelas do zero, execute este script SQL no Supabase Dashboard (**SQL Editor**):

```sql
-- Tabela de perfis
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'advocate' CHECK (role IN ('advocate', 'admin')),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de desafios
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de submissões
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_challenge_id ON submissions(challenge_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para challenges
CREATE POLICY "Anyone can view active challenges" ON challenges
  FOR SELECT USING (status = 'active');

-- Políticas para submissions
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**⚠️ Atenção:**
- Sempre faça backup antes de deletar/recriar tabelas
- Execute migrações em ordem cronológica
- Verifique se todas as tabelas têm RLS habilitado
- Teste a aplicação após criar as tabelas

---

#### 3.3. Erro: "column does not exist" / Coluna não existe

**Mensagem de Erro:**
```
column "column_name" does not exist
error: column profiles.username does not exist
```

**Causa:**
A query está tentando acessar uma coluna que não existe na tabela. Causas:
- Coluna nunca foi criada
- Typo no nome da coluna
- Migração não foi executada
- Coluna foi deletada

**Impacto:**
- ❌ Queries específicas falham
- ⚠️ Pode quebrar funcionalidades que dependem dessa coluna
- ✅ Outras colunas continuam funcionando

**Solução:**

1. **Verificar estrutura da tabela:**
   - No Supabase Dashboard, vá para **Table Editor**
   - Selecione a tabela
   - Verifique as colunas existentes

2. **Adicionar coluna faltante:**
   ```sql
   -- Adicionar coluna simples
   ALTER TABLE profiles ADD COLUMN username TEXT;

   -- Adicionar coluna com valor padrão
   ALTER TABLE profiles ADD COLUMN bio TEXT DEFAULT '';

   -- Adicionar coluna NOT NULL (requer default ou dados existentes)
   ALTER TABLE profiles ADD COLUMN email TEXT NOT NULL DEFAULT '';

   -- Adicionar coluna com constraint
   ALTER TABLE profiles ADD COLUMN age INTEGER CHECK (age >= 18);
   ```

3. **Verificar typos no código:**
   ```typescript
   // ❌ ERRADO
   const { data } = await supabase
     .from('profiles')
     .select('user_name') // Typo: deveria ser 'full_name'

   // ✅ CORRETO
   const { data } = await supabase
     .from('profiles')
     .select('full_name')
   ```

4. **Usar apenas colunas existentes:**
   ```typescript
   // Listar apenas as colunas que você precisa e que existem
   const { data } = await supabase
     .from('profiles')
     .select('id, user_id, full_name, avatar_url')
   ```

5. **Se não souber quais colunas existem:**
   ```sql
   -- SQL para ver todas as colunas de uma tabela
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'profiles'
   ORDER BY ordinal_position;
   ```

**📝 Padrão para Adicionar Colunas:**

```sql
-- Template para adicionar coluna com segurança
ALTER TABLE nome_da_tabela
ADD COLUMN IF NOT EXISTS nome_coluna tipo_de_dado
[DEFAULT valor_padrao]
[NOT NULL]
[CHECK (condicao)];

-- Exemplo completo:
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT
DEFAULT NULL
CHECK (phone_number ~ '^\+?[0-9]{10,15}$');
```

**⚠️ Atenção:**
- Adicionar colunas NOT NULL em tabelas com dados requer valor DEFAULT
- Verifique se a mudança não quebra queries existentes
- Atualize os tipos TypeScript após adicionar colunas
- Execute migrações em staging antes de produção

---

#### 3.4. Erro: "duplicate key value violates unique constraint"

**Mensagem de Erro:**
```
duplicate key value violates unique constraint "table_pkey"
duplicate key value violates unique constraint "profiles_user_id_key"
```

**Causa:**
Tentativa de inserir um valor duplicado em uma coluna com constraint UNIQUE ou PRIMARY KEY. Causas comuns:
- Inserir registro com ID que já existe
- Inserir user_id duplicado em profiles
- Constraint UNIQUE violada
- Tentar criar o mesmo registro duas vezes

**Impacto:**
- ❌ Operação de INSERT falha
- ⚠️ Pode indicar bug na lógica da aplicação
- ✅ Previne duplicação de dados (comportamento esperado)

**Solução:**

1. **Para profiles: usar UPSERT ao invés de INSERT:**
   ```typescript
   // ❌ ERRADO - pode falhar se profile já existe
   const { error } = await supabase
     .from('profiles')
     .insert({ user_id: userId, full_name: name })

   // ✅ CORRETO - upsert (insert or update)
   const { error } = await supabase
     .from('profiles')
     .upsert(
       { user_id: userId, full_name: name },
       { onConflict: 'user_id' } // Especifica a coluna do conflito
     )
   ```

2. **Verificar se registro já existe antes de inserir:**
   ```typescript
   // Verificar existência
   const { data: existing } = await supabase
     .from('profiles')
     .select('id')
     .eq('user_id', userId)
     .single()

   if (existing) {
     // Atualizar registro existente
     await supabase
       .from('profiles')
       .update({ full_name: name })
       .eq('user_id', userId)
   } else {
     // Criar novo registro
     await supabase
       .from('profiles')
       .insert({ user_id: userId, full_name: name })
   }
   ```

3. **Para IDs: deixar o banco gerar automaticamente:**
   ```typescript
   // ❌ ERRADO - especificar ID manualmente
   await supabase.from('profiles').insert({
     id: '123-456-789', // Pode causar conflito
     user_id: userId
   })

   // ✅ CORRETO - deixar o banco gerar UUID
   await supabase.from('profiles').insert({
     user_id: userId // ID será gerado automaticamente
   })
   ```

4. **Adicionar constraint UNIQUE se necessário:**
   ```sql
   -- Adicionar constraint UNIQUE em coluna
   ALTER TABLE profiles
   ADD CONSTRAINT profiles_email_unique
   UNIQUE (email);

   -- Adicionar constraint UNIQUE composta (múltiplas colunas)
   ALTER TABLE submissions
   ADD CONSTRAINT submissions_user_challenge_unique
   UNIQUE (user_id, challenge_id);
   ```

5. **Remover constraint UNIQUE se não for necessária:**
   ```sql
   -- ⚠️ Cuidado: só faça isso se realmente não precisar da constraint
   ALTER TABLE profiles
   DROP CONSTRAINT profiles_email_unique;
   ```

**🔍 Debug - Encontrar registro duplicado:**
```sql
-- Encontrar valores duplicados em uma coluna
SELECT user_id, COUNT(*)
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Ver os registros duplicados
SELECT *
FROM profiles
WHERE user_id IN (
  SELECT user_id
  FROM profiles
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
ORDER BY user_id;
```

**⚠️ Atenção:**
- UNIQUE constraints são importantes para integridade dos dados
- Use UPSERT quando apropriado para evitar conflitos
- Nunca ignore erros de UNIQUE - investigue a causa
- Em casos de duplicação, limpe os dados antes de adicionar constraint

---

#### 3.5. Erro: "Foreign key violation" / Violação de chave estrangeira

**Mensagem de Erro:**
```
insert or update on table "submissions" violates foreign key constraint
Key (challenge_id)=(xxx) is not present in table "challenges"
```

**Causa:**
Tentativa de criar/atualizar um registro que referencia um ID inexistente em outra tabela. Causas:
- Challenge/User referenciado não existe
- ID foi digitado incorretamente
- Registro referenciado foi deletado
- Ordem errada de criação de registros

**Impacto:**
- ❌ Operação de INSERT/UPDATE falha
- ✅ Previne referências quebradas (comportamento esperado)
- ⚠️ Pode indicar bug na lógica da aplicação

**Solução:**

1. **Verificar se o registro referenciado existe:**
   ```typescript
   // Verificar se o challenge existe antes de criar submission
   const { data: challenge } = await supabase
     .from('challenges')
     .select('id')
     .eq('id', challengeId)
     .single()

   if (!challenge) {
     throw new Error('Challenge não encontrado')
   }

   // Agora criar a submission
   await supabase.from('submissions').insert({
     challenge_id: challengeId,
     user_id: userId,
     video_url: url
   })
   ```

2. **Usar transações para garantir consistência:**
   ```typescript
   // Supabase não tem transações diretas, mas você pode usar RPC
   // Criar function no Supabase:
   /*
   CREATE OR REPLACE FUNCTION create_submission_safe(
     p_challenge_id UUID,
     p_user_id UUID,
     p_video_url TEXT
   ) RETURNS UUID AS $$
   DECLARE
     v_submission_id UUID;
   BEGIN
     -- Verificar se challenge existe
     IF NOT EXISTS (SELECT 1 FROM challenges WHERE id = p_challenge_id) THEN
       RAISE EXCEPTION 'Challenge not found';
     END IF;

     -- Criar submission
     INSERT INTO submissions (challenge_id, user_id, video_url)
     VALUES (p_challenge_id, p_user_id, p_video_url)
     RETURNING id INTO v_submission_id;

     RETURN v_submission_id;
   END;
   $$ LANGUAGE plpgsql;
   */

   // Chamar no código:
   const { data, error } = await supabase.rpc('create_submission_safe', {
     p_challenge_id: challengeId,
     p_user_id: userId,
     p_video_url: videoUrl
   })
   ```

3. **Adicionar constraint com ON DELETE CASCADE:**
   ```sql
   -- Recriar constraint com CASCADE para deletar automaticamente
   ALTER TABLE submissions
   DROP CONSTRAINT submissions_challenge_id_fkey;

   ALTER TABLE submissions
   ADD CONSTRAINT submissions_challenge_id_fkey
   FOREIGN KEY (challenge_id)
   REFERENCES challenges(id)
   ON DELETE CASCADE; -- Deletar submissions se challenge for deletado

   -- Ou SET NULL para apenas nullificar a referência
   ALTER TABLE submissions
   ADD CONSTRAINT submissions_challenge_id_fkey
   FOREIGN KEY (challenge_id)
   REFERENCES challenges(id)
   ON DELETE SET NULL;
   ```

4. **Validar IDs no frontend antes de enviar:**
   ```typescript
   // Client Component
   'use client'

   export function SubmissionForm({ challenges }: { challenges: Challenge[] }) {
     const [selectedChallengeId, setSelectedChallengeId] = useState('')

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault()

       // Validar que o challenge ID é válido
       const challengeExists = challenges.some(c => c.id === selectedChallengeId)
       if (!challengeExists) {
         alert('Por favor, selecione um desafio válido')
         return
       }

       // Continuar com a submissão...
     }

     return (
       <form onSubmit={handleSubmit}>
         <select
           value={selectedChallengeId}
           onChange={(e) => setSelectedChallengeId(e.target.value)}
         >
           <option value="">Selecione um desafio</option>
           {challenges.map(c => (
             <option key={c.id} value={c.id}>{c.title}</option>
           ))}
         </select>
         {/* ... resto do form */}
       </form>
     )
   }
   ```

**🔍 Debug - Verificar constraints:**
```sql
-- Ver todas as foreign keys de uma tabela
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'submissions';
```

**⚠️ Atenção:**
- Foreign keys garantem integridade referencial
- Sempre verifique se registros relacionados existem antes de criar referências
- Use ON DELETE CASCADE com cuidado - pode deletar muitos dados
- Considere usar soft deletes (campo `deleted_at`) ao invés de DELETE físico

---

#### 3.6. Erro: "Storage bucket not found" / Problemas com Storage

**Mensagem de Erro:**
```
Error: Storage bucket 'avatars' not found
The resource you are looking for was not found
```

**Causa:**
O bucket de storage do Supabase não foi criado ou não está configurado corretamente. Buckets são necessários para upload de arquivos (imagens, vídeos, etc).

**Impacto:**
- ❌ Upload de arquivos falha
- ❌ Usuários não conseguem fazer upload de avatars/mídia
- ✅ Outras funcionalidades não relacionadas a storage continuam funcionando

**Solução:**

1. **Criar o bucket no Supabase:**
   - Acesse o [Supabase Dashboard](https://app.supabase.com)
   - Vá para **Storage**
   - Clique em **Create bucket**
   - Nome do bucket: `avatars` (ou outro nome necessário)
   - Configure:
     - ✅ **Public bucket** (se arquivos devem ser acessíveis publicamente)
     - ⚠️ **Private bucket** (se precisar autenticação para acessar)
   - Clique em **Create**

2. **Criar políticas de acesso ao bucket:**
   ```sql
   -- Permitir usuários autenticados fazerem upload de avatars
   CREATE POLICY "Users can upload own avatar"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'avatars'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Permitir usuários autenticados atualizarem próprio avatar
   CREATE POLICY "Users can update own avatar"
   ON storage.objects FOR UPDATE
   USING (
     bucket_id = 'avatars'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Permitir qualquer pessoa ver avatars (bucket público)
   CREATE POLICY "Anyone can view avatars"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'avatars');

   -- Permitir usuários deletarem próprio avatar
   CREATE POLICY "Users can delete own avatar"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'avatars'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

3. **Fazer upload de arquivo via código:**
   ```typescript
   // Server Action para upload de avatar
   'use server'

   import { createClient } from '@/lib/supabase/server'

   export async function uploadAvatar(formData: FormData) {
     const supabase = createClient()
     const { data: { user } } = await supabase.auth.getUser()

     if (!user) {
       throw new Error('Não autenticado')
     }

     const file = formData.get('avatar') as File
     if (!file) {
       throw new Error('Nenhum arquivo fornecido')
     }

     // Validar tipo de arquivo
     const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
     if (!allowedTypes.includes(file.type)) {
       throw new Error('Tipo de arquivo não suportado')
     }

     // Validar tamanho (máximo 2MB)
     if (file.size > 2 * 1024 * 1024) {
       throw new Error('Arquivo muito grande. Máximo: 2MB')
     }

     // Nome do arquivo: user_id/timestamp.ext
     const fileExt = file.name.split('.').pop()
     const fileName = `${user.id}/${Date.now()}.${fileExt}`

     // Upload
     const { data, error } = await supabase.storage
       .from('avatars')
       .upload(fileName, file, {
         cacheControl: '3600',
         upsert: false
       })

     if (error) {
       console.error('Upload error:', error)
       throw new Error('Erro ao fazer upload do arquivo')
     }

     // Obter URL pública
     const { data: { publicUrl } } = supabase.storage
       .from('avatars')
       .getPublicUrl(fileName)

     // Atualizar profile com nova URL
     await supabase
       .from('profiles')
       .update({ avatar_url: publicUrl })
       .eq('user_id', user.id)

     return { success: true, url: publicUrl }
   }
   ```

4. **Configurar limites de tamanho do bucket:**
   - No Dashboard, vá para **Storage** > **Policies**
   - Em **Configuration**, ajuste:
     - **Max file size**: tamanho máximo por arquivo
     - **Allowed MIME types**: tipos permitidos

5. **Deletar arquivo antigo ao fazer upload de novo:**
   ```typescript
   // Antes de fazer upload de novo avatar, deletar o antigo
   const { data: profile } = await supabase
     .from('profiles')
     .select('avatar_url')
     .eq('user_id', user.id)
     .single()

   if (profile?.avatar_url) {
     // Extrair path do arquivo da URL
     const oldFilePath = profile.avatar_url.split('/').slice(-2).join('/')

     // Deletar arquivo antigo
     await supabase.storage
       .from('avatars')
       .remove([oldFilePath])
   }

   // Agora fazer upload do novo
   ```

**🎨 Exemplo Completo - Upload de Avatar no Frontend:**

```typescript
// components/avatar-upload.tsx
'use client'

import { useState } from 'react'
import { uploadAvatar } from '@/actions/upload-avatar'

export function AvatarUpload() {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await uploadAvatar(formData)

      if (result.success) {
        alert('Avatar atualizado com sucesso!')
      }
    } catch (error) {
      alert('Erro ao fazer upload: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        {preview && (
          <img src={preview} alt="Preview" className="w-32 h-32 rounded-full" />
        )}
      </div>

      <input
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        required
      />

      <button type="submit" disabled={uploading}>
        {uploading ? 'Enviando...' : 'Atualizar Avatar'}
      </button>
    </form>
  )
}
```

**⚠️ Atenção:**
- Sempre valide tipo e tamanho de arquivo no servidor
- Configure políticas de RLS para buckets
- Use folders organizados por user_id para facilitar gerenciamento
- Considere usar CDN para melhor performance
- Implemente limpeza de arquivos órfãos periodicamente

---

#### 3.7. Erro: "Invalid JSON" / Problemas com colunas JSON/JSONB

**Mensagem de Erro:**
```
invalid input syntax for type json
invalid json value
```

**Causa:**
Tentativa de inserir/atualizar uma coluna JSON/JSONB com valor inválido. Causas:
- String não é JSON válido
- JSON mal formatado
- Aspas simples ao invés de duplas
- Vírgula extra no final

**Impacto:**
- ❌ Operação de INSERT/UPDATE falha
- ⚠️ Pode indicar problemas de serialização no código

**Solução:**

1. **Sempre use `JSON.stringify()` antes de enviar:**
   ```typescript
   // ❌ ERRADO - enviar objeto diretamente
   await supabase.from('profiles').insert({
     user_id: userId,
     metadata: { key: 'value' } // Pode não funcionar corretamente
   })

   // ✅ CORRETO - serializar para string
   await supabase.from('profiles').insert({
     user_id: userId,
     metadata: JSON.stringify({ key: 'value' })
   })

   // ✅ AINDA MELHOR - Supabase faz serialização automática
   // Se a coluna é JSONB, você pode passar objeto direto
   await supabase.from('profiles').insert({
     user_id: userId,
     metadata: { key: 'value' } // Funciona com JSONB
   })
   ```

2. **Validar JSON antes de enviar:**
   ```typescript
   function isValidJSON(str: string): boolean {
     try {
       JSON.parse(str)
       return true
     } catch (e) {
       return false
     }
   }

   const jsonString = '{"key": "value"}'
   if (!isValidJSON(jsonString)) {
     throw new Error('JSON inválido')
   }
   ```

3. **Usar JSONB ao invés de JSON (recomendado):**
   ```sql
   -- JSONB é mais eficiente e permite indexação
   ALTER TABLE profiles ALTER COLUMN metadata TYPE JSONB USING metadata::JSONB;

   -- Criar índice GIN para queries em JSONB
   CREATE INDEX idx_profiles_metadata ON profiles USING GIN (metadata);
   ```

4. **Queries em colunas JSONB:**
   ```typescript
   // Buscar por valor dentro do JSON
   const { data } = await supabase
     .from('profiles')
     .select('*')
     .eq('metadata->setting', 'value') // -> para acessar campo

   // Buscar usando operadores JSONB
   const { data } = await supabase
     .from('profiles')
     .select('*')
     .contains('metadata', { role: 'admin' }) // Contém chave/valor

   // Extrair valores do JSONB
   const { data } = await supabase
     .from('profiles')
     .select('id, metadata->email as email')
   ```

**⚠️ Atenção:**
- Use JSONB ao invés de JSON para melhor performance
- Sempre valide JSON antes de armazenar
- Considere normalizar dados ao invés de usar JSON quando possível
- JSON/JSONB são úteis para dados não estruturados ou variáveis

---

#### 3.8. Erro: Migração falhou / Schema out of sync

**Mensagem de Erro:**
```
Migration failed: column already exists
Migration failed: relation already exists
Schema mismatch detected
```

**Causa:**
Problemas ao executar migrações SQL. Causas comuns:
- Migração executada parcialmente
- Migração executada duas vezes
- Schema local diferente do remoto
- Ordem errada de migrações

**Impacto:**
- ❌ Novas alterações de schema não são aplicadas
- ⚠️ Banco pode ficar inconsistente
- ⚠️ Aplicação pode não funcionar corretamente

**Solução:**

1. **Verificar quais migrações foram executadas:**
   ```sql
   -- Ver histórico de migrações (se você usa uma tabela de tracking)
   SELECT * FROM schema_migrations ORDER BY version;
   ```

2. **Executar migração manualmente:**
   - Acesse o SQL Editor no Supabase Dashboard
   - Cole o conteúdo da migração
   - Execute linha por linha para identificar qual linha falha
   - Ajuste conforme necessário

3. **Usar IF NOT EXISTS para evitar erros:**
   ```sql
   -- Criar tabela apenas se não existe
   CREATE TABLE IF NOT EXISTS profiles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
     full_name TEXT
   );

   -- Adicionar coluna apenas se não existe
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'profiles' AND column_name = 'bio'
     ) THEN
       ALTER TABLE profiles ADD COLUMN bio TEXT;
     END IF;
   END $$;

   -- Criar índice apenas se não existe
   CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

   -- Criar política apenas se não existe
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE tablename = 'profiles'
       AND policyname = 'Users can view own profile'
     ) THEN
       CREATE POLICY "Users can view own profile"
         ON profiles FOR SELECT
         USING (auth.uid() = user_id);
     END IF;
   END $$;
   ```

4. **Resetar schema (APENAS DESENVOLVIMENTO):**
   ```sql
   -- ⚠️ CUIDADO: Isso deleta TODOS os dados!
   -- Apenas use em desenvolvimento local

   -- Deletar todas as tabelas
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;

   -- Recriar extensões necessárias
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Agora executar todas as migrações novamente
   ```

5. **Usar Supabase CLI para gerenciar migrações:**
   ```bash
   # Instalar Supabase CLI
   npm install -g supabase

   # Fazer login
   supabase login

   # Linkar com projeto remoto
   supabase link --project-ref seu-projeto-id

   # Criar nova migração
   supabase migration new nome_da_migracao

   # Aplicar migrações
   supabase db push

   # Ver diferenças entre local e remoto
   supabase db diff
   ```

6. **Organizar migrações em ordem:**
   ```
   supabase/migrations/
   ├── 20240101000000_create_profiles.sql
   ├── 20240102000000_add_challenges.sql
   ├── 20240103000000_add_submissions.sql
   └── 20240104000000_add_rls_policies.sql
   ```

**📋 Checklist para Migrações:**
- [ ] Testou a migração em ambiente local primeiro
- [ ] Migração usa IF NOT EXISTS quando apropriado
- [ ] Fez backup do banco antes de aplicar
- [ ] Verificou que não há dependências não satisfeitas
- [ ] Documentou o que a migração faz
- [ ] Testou rollback se algo der errado

**⚠️ Atenção:**
- Sempre faça backup antes de executar migrações em produção
- Teste migrações em staging primeiro
- Use transações quando possível (BEGIN/COMMIT/ROLLBACK)
- Mantenha migrações idempotentes (podem ser executadas múltiplas vezes)
- Documente bem cada migração

---

### 4. Erros de APIs Externas

> ⚠️ **Esta seção será expandida na próxima atualização**

Erros relacionados à integração com APIs externas, especialmente Google Gemini AI.

#### 4.1. Erro: "API Gemini não configurada"

**Mensagem de Erro:**
```
API Gemini não configurada - verificação manual necessária
```

**Causa:**
A variável de ambiente `GEMINI_API_KEY` não está configurada ou está com valor padrão.

**Impacto:**
A verificação automática de vídeos de desafios não funcionará. O sistema cairá para verificação manual.

**Solução:**

1. **Obter uma API Key do Gemini:**
   - Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Faça login com sua conta Google
   - Clique em "Create API Key"
   - Copie a chave gerada

2. **Adicionar ao arquivo `.env.local`:**
   ```env
   GEMINI_API_KEY=sua-chave-aqui
   ```

3. **Reiniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Verificar:**
   - Execute `npm run check-env` para confirmar
   - Tente submeter um vídeo de desafio
   - A verificação automática deve aparecer

**Nota:** A API Gemini tem um tier gratuito generoso. Para mais informações, consulte a [documentação de pricing](https://ai.google.dev/pricing).

---

#### 4.2. Erro: "Erro ao conectar com API Gemini"

**Mensagem de Erro:**
```
Erro ao conectar com API Gemini
```

**Causas Possíveis:**
- API Key inválida ou revogada
- Problema de rede/firewall
- Limite de taxa (rate limit) atingido
- Serviço do Gemini temporariamente indisponível

**Solução:**

1. **Verificar validade da API Key:**
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=SUA_API_KEY"
   ```

2. **Verificar se a key não está restrita:**
   - Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Verifique as restrições da API Key
   - Certifique-se que "Generative Language API" está habilitada

3. **Verificar rate limits:**
   - O tier gratuito tem limites de requisições por minuto
   - Aguarde alguns minutos e tente novamente
   - Considere implementar retry com backoff exponencial

4. **Verificar logs:**
   ```typescript
   // O código em src/lib/gemini.ts já loga erros
   console.error('Gemini API error:', response.status, await response.text());
   ```

**Workaround Temporário:**
Se a API continuar indisponível, o sistema automaticamente volta para verificação manual. Isso não impede o funcionamento do aplicativo.

---

#### 4.3. URL de Vídeo Inválida

**Mensagem de Erro:**
```
URL de vídeo não é de uma plataforma suportada
```

**Causa:**
A URL fornecida não corresponde aos padrões de plataformas de vídeo suportadas.

**Plataformas Suportadas:**
- ✅ Instagram: `instagram.com/p/`, `instagram.com/reel/`, `instagram.com/reels/`, `instagram.com/tv/`
- ✅ YouTube: `youtube.com/watch`, `youtu.be/`
- ✅ TikTok: `tiktok.com/@`, `vm.tiktok.com/`
- ✅ Facebook: `facebook.com/.../videos`, `fb.watch/`

**Solução:**

1. **Verificar o formato da URL:**
   - Copie a URL diretamente do navegador
   - Não use links encurtados (exceto do próprio TikTok)
   - Certifique-se que é um link de vídeo, não de perfil

2. **Exemplos de URLs válidas:**
   ```
   https://www.instagram.com/reel/ABC123xyz/
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   https://youtu.be/dQw4w9WgXcQ
   https://www.tiktok.com/@username/video/1234567890
   https://vm.tiktok.com/ABC123/
   ```

3. **Se a URL for válida mas ainda assim for rejeitada:**
   - Abra uma issue no repositório
   - Inclua a URL (se não for privada)
   - O padrão pode precisar ser atualizado em `src/lib/gemini.ts`

---

## Ferramentas de Diagnóstico

### Script de Verificação de Ambiente

> ⚠️ **Em desenvolvimento**

Em breve, você poderá executar:

```bash
npm run check-env
```

Este script irá:
- ✅ Verificar se todas as variáveis obrigatórias estão definidas
- ✅ Testar conexão com o Supabase
- ✅ Validar formato das URLs
- ✅ Verificar se APIs externas estão acessíveis
- ✅ Exibir sugestões de correção

### Verificação Manual

Enquanto o script não está disponível, você pode verificar manualmente:

1. **Variáveis de Ambiente:**
   ```bash
   # No terminal, na raiz do projeto
   cat .env.local
   ```

2. **Conexão com Supabase:**
   - Acesse o [Supabase Dashboard](https://app.supabase.com)
   - Verifique se o projeto está ativo
   - Tente fazer uma query simples na aba SQL Editor

3. **API Gemini:**
   ```bash
   # Teste sua API key
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=SUA_API_KEY"
   ```

---

## Recursos Adicionais

### Documentação do Projeto

- [CLAUDE.md](../CLAUDE.md) - Regras e padrões de arquitetura do projeto
- [.env.local.example](../.env.local.example) - Template de variáveis de ambiente
- [Guia de Configuração do Supabase](./SETUP_SUPABASE.md) _(em desenvolvimento)_

### Documentação Externa

- [Supabase Documentation](https://supabase.com/docs)
  - [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
  - [Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Next.js 15 Documentation](https://nextjs.org/docs)
  - [App Router](https://nextjs.org/docs/app)
  - [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Google Gemini AI](https://ai.google.dev/docs)
  - [API Quickstart](https://ai.google.dev/tutorials/rest_quickstart)
  - [Pricing](https://ai.google.dev/pricing)

### Comunidade e Suporte

- **Issues do Projeto**: [GitHub Issues](https://github.com/seu-usuario/advocate-platform/issues)
- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **Next.js Discord**: [nextjs.org/discord](https://nextjs.org/discord)

---

## Contribuindo para Este Guia

Encontrou um erro que não está documentado? Ajude a melhorar este guia:

1. Documente o erro que você encontrou
2. Descreva os passos que você seguiu para resolver
3. Abra um Pull Request adicionando a solução a este guia

**Formato sugerido para novos erros:**

```markdown
#### X.X. [Nome do Erro]

**Mensagem de Erro:**
```
[mensagem exata do erro]
```

**Causa:**
[explicação da causa]

**Solução:**
[passos detalhados para resolver]
```

---

**Última atualização:** 2026-01-07
**Versão do guia:** 1.0.0
