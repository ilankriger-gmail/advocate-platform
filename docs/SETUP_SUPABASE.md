# Guia de Configuração do Supabase

## 📋 Índice

- [Introdução](#introdução)
- [Pré-requisitos](#pré-requisitos)
- [1. Criar Projeto no Supabase](#1-criar-projeto-no-supabase)
- [2. Obter Chaves de API](#2-obter-chaves-de-api)
- [3. Configurar Variáveis de Ambiente](#3-configurar-variáveis-de-ambiente)
- [4. Configurar Autenticação com Google OAuth](#4-configurar-autenticação-com-google-oauth)
- [5. Habilitar Row Level Security (RLS)](#5-habilitar-row-level-security-rls)
- [6. Verificar Configuração](#6-verificar-configuração)
- [Próximos Passos](#próximos-passos)
- [Troubleshooting](#troubleshooting)

---

## Introdução

Este guia fornece instruções passo a passo para configurar o Supabase para a Plataforma de Advocate Marketing. Você aprenderá a:

- ✅ Criar e configurar um projeto Supabase
- ✅ Obter as chaves de API necessárias
- ✅ Configurar autenticação com Google OAuth
- ✅ Implementar Row Level Security (RLS)
- ✅ Validar que tudo está funcionando

**Tempo Estimado:** 15-20 minutos

---

## Pré-requisitos

Antes de começar, certifique-se de ter:

- [ ] Uma conta no [Supabase](https://supabase.com) (gratuita)
- [ ] Uma conta no [Google Cloud Console](https://console.cloud.google.com) (para OAuth)
- [ ] Node.js instalado (v18 ou superior)
- [ ] O código fonte do projeto clonado localmente

---

## 1. Criar Projeto no Supabase

### Passo 1.1: Acessar o Dashboard

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Faça login com sua conta (ou crie uma nova)
3. Clique em **"New Project"** ou **"Novo Projeto"**

### Passo 1.2: Configurar o Projeto

Preencha as informações do projeto:

```
Nome do Projeto: advocate-platform
(ou escolha um nome descritivo para seu ambiente)

Database Password: [Crie uma senha forte]
💡 IMPORTANTE: Anote esta senha! Você precisará dela para acessar o banco de dados diretamente.

Region: [Escolha a região mais próxima dos seus usuários]
Recomendado para Brasil: South America (São Paulo)

Pricing Plan: Free (para desenvolvimento)
```

### Passo 1.3: Aguardar Criação

⏱️ O Supabase levará de 1-2 minutos para provisionar seu projeto. Você verá:
- Um indicador de progresso
- Mensagem de sucesso quando o projeto estiver pronto

---

## 2. Obter Chaves de API

Após o projeto ser criado, você precisará obter as chaves de API.

### Passo 2.1: Acessar Project Settings

1. No dashboard do seu projeto, clique no ícone de **⚙️ Settings** (Configurações) no menu lateral
2. Clique em **"API"** no submenu

### Passo 2.2: Copiar as Chaves

Você verá três seções principais:

#### 📌 Project URL

```
URL: https://xyzabcdefg.supabase.co
```

Esta é sua `NEXT_PUBLIC_SUPABASE_URL`

#### 📌 API Keys

Você verá duas chaves:

**1. anon public (Chave Pública)**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Esta é sua `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- ✅ Pode ser exposta no cliente
- ✅ Respeita políticas de RLS
- ✅ Usada para operações normais da aplicação

**2. service_role (Chave de Serviço)**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Esta é sua `SUPABASE_SERVICE_ROLE_KEY` (opcional)

- ⚠️ **NUNCA exponha no cliente**
- ⚠️ Ignora políticas de RLS
- ⚠️ Apenas para operações administrativas no servidor

### Passo 2.3: Configurar JWT Secret (Informação)

Na mesma página, você verá o **JWT Secret**. Você normalmente não precisará usar isso diretamente, mas é importante saber onde encontrar caso precise.

---

## 3. Configurar Variáveis de Ambiente

### Passo 3.1: Criar Arquivo .env.local

Na raiz do projeto, crie o arquivo `.env.local` (se não existir):

```bash
cp .env.local.example .env.local
```

### Passo 3.2: Adicionar as Chaves do Supabase

Abra o arquivo `.env.local` e configure as variáveis obrigatórias:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xyzabcdefg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Next.js Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Storage (usa a mesma URL do Supabase)
NEXT_PUBLIC_STORAGE_URL=https://xyzabcdefg.supabase.co/storage/v1

# Opcional: Para operações administrativas
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Substituições necessárias:**
- ✏️ `https://xyzabcdefg.supabase.co` → Sua Project URL
- ✏️ `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` → Suas chaves reais

### Passo 3.3: Verificar .gitignore

Certifique-se de que `.env.local` está no `.gitignore`:

```bash
# .gitignore
.env.local
.env*.local
```

⚠️ **NUNCA comite arquivos .env.local no Git!**

---

## 4. Configurar Autenticação com Google OAuth

Para permitir que usuários façam login com Google, você precisa configurar o OAuth.

### Passo 4.1: Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Nomeie o projeto (ex: "Advocate Platform")

### Passo 4.2: Configurar OAuth Consent Screen

1. No menu lateral, vá para **"APIs & Services"** → **"OAuth consent screen"**
2. Selecione **"External"** (para permitir qualquer conta Google)
3. Clique em **"Create"**

Preencha as informações obrigatórias:

```
App name: Advocate Platform
User support email: seu-email@example.com
Developer contact information: seu-email@example.com
```

4. Clique em **"Save and Continue"** nas próximas telas
5. Em **"Scopes"**, adicione apenas os escopos básicos (já incluídos por padrão)
6. Clique em **"Save and Continue"** até finalizar

### Passo 4.3: Criar Credenciais OAuth

1. Vá para **"APIs & Services"** → **"Credentials"**
2. Clique em **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Selecione **"Web application"**

Configure:

```
Name: Advocate Platform Web

Authorized JavaScript origins:
- http://localhost:3000 (para desenvolvimento)
- https://seu-dominio.com (para produção)

Authorized redirect URIs:
- https://xyzabcdefg.supabase.co/auth/v1/callback
```

⚠️ **IMPORTANTE:** Substitua `xyzabcdefg` pela sua Project URL do Supabase!

4. Clique em **"Create"**
5. **Copie o Client ID e Client Secret** que aparecerão

### Passo 4.4: Configurar no Supabase

1. Volte para o [Supabase Dashboard](https://app.supabase.com)
2. Vá para **Authentication** → **"Providers"** no menu lateral
3. Encontre **"Google"** na lista
4. Clique para expandir

Configure:

```
Enable Sign in with Google: ✅ Ativado

Client ID: [Cole o Client ID do Google]
Client Secret: [Cole o Client Secret do Google]
```

5. Clique em **"Save"**

### Passo 4.5: Configurar Redirect URLs

Ainda em **Authentication** → **"URL Configuration"**:

```
Site URL: http://localhost:3000 (desenvolvimento)
          https://seu-dominio.com (produção)

Redirect URLs:
- http://localhost:3000/** (desenvolvimento)
- https://seu-dominio.com/** (produção)
```

6. Clique em **"Save"**

---

## 5. Habilitar Row Level Security (RLS)

Row Level Security (RLS) é **obrigatório** para segurança. Ele garante que usuários só acessem dados que têm permissão.

### Passo 5.1: Entender RLS

O RLS funciona através de políticas que são avaliadas para cada query:

- ✅ **Habilitado**: Apenas dados permitidos pelas políticas são acessíveis
- ❌ **Desabilitado**: Todos os dados são acessíveis (⚠️ INSEGURO!)

### Passo 5.2: Habilitar RLS nas Tabelas

Para cada tabela do seu banco de dados:

1. Vá para **Table Editor** no Supabase Dashboard
2. Selecione a tabela
3. Clique em **"..."** (menu) → **"Edit Table"**
4. Clique na aba **"RLS"** ou vá para **Authentication** → **"Policies"**
5. Certifique-se de que **"Enable RLS"** está ativado

### Passo 5.3: Criar Políticas de Acesso

Para cada tabela, você precisará criar políticas. Exemplo para uma tabela `profiles`:

#### Política: Usuários podem ler seu próprio perfil

```sql
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);
```

#### Política: Usuários podem atualizar seu próprio perfil

```sql
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Passo 5.4: Aplicar via SQL Editor

1. Vá para **SQL Editor** no Supabase Dashboard
2. Cole suas políticas SQL
3. Clique em **"Run"** ou **"Executar"**

### Passo 5.5: Exemplo de Estrutura Completa

Aqui está um exemplo completo para a tabela `profiles`:

```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política de leitura: usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Política de inserção: usuários podem criar seu próprio perfil
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política de atualização: usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política de deleção: usuários podem deletar seu próprio perfil
CREATE POLICY "Users can delete own profile"
ON profiles
FOR DELETE
USING (auth.uid() = id);
```

### Passo 5.6: Verificar Políticas

Para verificar que as políticas estão ativas:

```sql
-- Listar todas as políticas da tabela profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

---

## 6. Verificar Configuração

Agora vamos testar se tudo está funcionando corretamente.

### Passo 6.1: Verificar Variáveis de Ambiente

Execute o comando de verificação (quando disponível):

```bash
npm run check-env
```

Ou verifique manualmente se todas as variáveis estão definidas:

```bash
# No terminal, na raiz do projeto
cat .env.local
```

Você deve ver todas as variáveis obrigatórias preenchidas.

### Passo 6.2: Testar Conexão com Supabase

Crie um arquivo de teste rápido ou use o console do navegador:

```typescript
// test-connection.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  const { data, error } = await supabase.from('profiles').select('count')

  if (error) {
    console.error('❌ Erro de conexão:', error.message)
  } else {
    console.log('✅ Conexão com Supabase funcionando!')
  }
}

testConnection()
```

### Passo 6.3: Testar Autenticação

Inicie a aplicação:

```bash
npm run dev
```

1. Abra [http://localhost:3000](http://localhost:3000)
2. Tente fazer login/registro
3. Teste o login com Google OAuth

**Comportamento esperado:**
- ✅ Página de login carrega sem erros
- ✅ Botão "Entrar com Google" funciona
- ✅ Após autenticação, você é redirecionado corretamente

### Passo 6.4: Verificar RLS no Dashboard

1. Vá para **Table Editor** no Supabase Dashboard
2. Tente acessar dados de uma tabela com RLS habilitado
3. Você verá a mensagem: **"RLS is enabled. Add policies to allow access."**

Isso confirma que RLS está funcionando! ✅

---

## Próximos Passos

Após concluir este guia, você pode:

1. **Criar o Schema do Banco de Dados**
   - Defina suas tabelas
   - Configure relacionamentos
   - Implemente políticas RLS para cada tabela

2. **Configurar Storage (Buckets)**
   - Para upload de imagens de perfil
   - Para armazenamento de assets
   - Configure políticas de acesso aos buckets

3. **Configurar Email Templates**
   - Personalizar emails de confirmação
   - Configurar email de recuperação de senha

4. **Implementar Testes**
   - Testar fluxos de autenticação
   - Validar políticas RLS
   - Testar operações CRUD

5. **Configurar Ambiente de Produção**
   - Criar projeto separado para produção
   - Configurar domínio customizado
   - Atualizar URLs de redirect

---

## Troubleshooting

### ❌ Erro: "Invalid API Key"

**Causa:** As chaves de API estão incorretas ou não foram copiadas completamente.

**Solução:**
1. Volte para **Settings** → **"API"** no Supabase Dashboard
2. Copie as chaves novamente (certifique-se de copiar completamente)
3. Atualize o arquivo `.env.local`
4. Reinicie o servidor de desenvolvimento

### ❌ Erro: "redirect_uri_mismatch" no Google OAuth

**Causa:** A URL de redirect não está configurada corretamente no Google Cloud Console.

**Solução:**
1. Vá para [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **"Credentials"**
3. Edite seu OAuth Client ID
4. Em **"Authorized redirect URIs"**, adicione:
   ```
   https://[SEU-PROJECT-ID].supabase.co/auth/v1/callback
   ```
5. Salve e aguarde 5 minutos para propagar

### ❌ Erro: "new row violates row-level security policy"

**Causa:** RLS está habilitado mas não há políticas permitindo a operação.

**Solução:**
1. Vá para **Authentication** → **"Policies"** no Supabase
2. Verifique se existem políticas para a tabela
3. Crie as políticas necessárias (consulte [Passo 5.3](#passo-53-criar-políticas-de-acesso))

### ❌ Erro: "Failed to fetch" ou "Network Error"

**Causa:** URL do Supabase incorreta ou problemas de CORS.

**Solução:**
1. Verifique a `NEXT_PUBLIC_SUPABASE_URL` no `.env.local`
2. Certifique-se de que não há espaços ou caracteres extras
3. Verifique se o projeto Supabase está ativo (não pausado)
4. Teste a URL diretamente no navegador: `https://[sua-url].supabase.co`

### ❌ Servidor Next.js não detecta mudanças no .env.local

**Causa:** O Next.js cacheia variáveis de ambiente ao iniciar.

**Solução:**
1. Pare o servidor (Ctrl+C)
2. Reinicie com `npm run dev`
3. Variáveis `NEXT_PUBLIC_*` são carregadas apenas no build

---

## Recursos Adicionais

### Documentação Oficial

- 📚 [Documentação do Supabase](https://supabase.com/docs)
- 🔐 [Guia de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- 🔑 [Configuração de OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- 🏗️ [Database Design](https://supabase.com/docs/guides/database/tables)

### Guias Relacionados

- [Guia de Troubleshooting Principal](./TROUBLESHOOTING.md)
- [Exemplo de Variáveis de Ambiente](../.env.local.example)

### Comandos Úteis

```bash
# Verificar configuração do ambiente
npm run check-env

# Iniciar servidor de desenvolvimento
npm run dev

# Executar migrações (se aplicável)
npm run migrate

# Gerar tipos TypeScript do Supabase
npm run generate-types
```

---

## Suporte

Se você encontrar problemas não cobertos neste guia:

1. Consulte o [Guia de Troubleshooting](./TROUBLESHOOTING.md)
2. Verifique a [documentação oficial do Supabase](https://supabase.com/docs)
3. Busque no [Discord do Supabase](https://discord.supabase.com)
4. Abra uma issue no repositório do projeto

---

**✅ Configuração concluída!** Você agora tem um projeto Supabase totalmente configurado e pronto para desenvolvimento.
