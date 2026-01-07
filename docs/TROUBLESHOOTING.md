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

> ⚠️ **Esta seção será expandida na próxima atualização**

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

**Ver mais detalhes:** _(Esta seção será expandida com erros específicos e soluções detalhadas)_

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
