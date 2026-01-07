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

> ⚠️ **Esta seção será expandida na próxima atualização**

Erros relacionados ao sistema de autenticação do Supabase, incluindo login, registro, OAuth e gerenciamento de sessões.

**Erros Comuns:**
- Falha no login
- OAuth Google não funciona
- Sessão expirada
- Email não confirmado
- Problemas com RLS (Row Level Security)

**Ações Rápidas:**
1. Verifique se o projeto Supabase está ativo
2. Confirme que as URLs de callback do OAuth estão configuradas
3. Verifique as políticas de RLS no Supabase Dashboard

**Ver mais detalhes:** _(Esta seção será expandida com erros específicos e soluções detalhadas)_

---

### 3. Erros do Supabase

> ⚠️ **Esta seção será expandida na próxima atualização**

Erros relacionados ao banco de dados, queries, storage, migrações e Row Level Security (RLS).

**Categorias:**
- **Conexão**: Problemas ao conectar com o Supabase
- **Queries**: Erros em consultas SQL
- **RLS**: Políticas de segurança bloqueando operações
- **Storage**: Problemas com upload/download de arquivos
- **Migrações**: Erros ao aplicar mudanças no schema

**Ações Rápidas:**
1. Verifique o status do projeto no [Supabase Dashboard](https://app.supabase.com)
2. Confirme que as tabelas foram criadas corretamente
3. Revise as políticas de RLS para a tabela em questão
4. Verifique os logs de erro no Supabase Dashboard

**Ver mais detalhes:** _(Esta seção será expandida com erros específicos e soluções detalhadas)_

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
