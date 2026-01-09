# Guia de Configuração do Painel Admin

## 📋 Índice

- [Introdução](#introdução)
- [Pré-requisitos](#pré-requisitos)
- [1. Configurar Variáveis de Ambiente](#1-configurar-variáveis-de-ambiente)
- [2. Gerar Hash de Senha Seguro](#2-gerar-hash-de-senha-seguro)
- [3. Testar o Login Admin](#3-testar-o-login-admin)
- [4. Segurança e Boas Práticas](#4-segurança-e-boas-práticas)
- [5. Troubleshooting](#5-troubleshooting)

---

## Introdução

O painel administrativo da Advocate Platform utiliza um sistema de autenticação seguro baseado em:

- ✅ **Credenciais via variáveis de ambiente** (não hardcoded no código)
- ✅ **Senhas com hash bcrypt** (nunca armazenadas em texto puro)
- ✅ **Cookies HTTP-only** (proteção contra XSS)
- ✅ **Sessões server-side** (validação no servidor)
- ✅ **Expiração automática** (24 horas de inatividade)

Este guia mostrará como configurar o acesso administrativo de forma segura.

**Tempo Estimado:** 5-10 minutos

---

## Pré-requisitos

Antes de começar, certifique-se de ter:

- [ ] Node.js instalado (v18 ou superior)
- [ ] npm ou yarn instalado
- [ ] Código fonte do projeto clonado localmente
- [ ] Dependência `bcryptjs` instalada (necessária para hashing)

---

## 1. Configurar Variáveis de Ambiente

### Passo 1.1: Criar Arquivo .env.local

Se você ainda não tem o arquivo `.env.local`, crie-o a partir do exemplo:

```bash
cp .env.local.example .env.local
```

### Passo 1.2: Definir o Nome de Usuário Admin

Abra o arquivo `.env.local` e defina o nome de usuário do administrador:

```env
# Nome de usuário do admin (pode ser qualquer string)
ADMIN_USERNAME=admin
```

💡 **Dica:** Você pode usar qualquer nome de usuário. Exemplos:
- `admin`
- `administrator`
- `root`
- `seu-nome`

### Passo 1.3: Definir o Hash da Senha

A senha do admin **NUNCA** deve estar em texto puro. Você deve gerar um hash bcrypt da sua senha e colocá-lo na variável `ADMIN_PASSWORD_HASH`.

```env
# Hash bcrypt da senha do admin
ADMIN_PASSWORD_HASH=$2a$10$rZ8EwLhqhq8Y8YkXqZ8YkOq8YkXqZ8YkOq8YkXqZ8YkOq8YkXqZ8Y
```

⚠️ **IMPORTANTE:** O exemplo acima é apenas um placeholder. Continue para a próxima seção para gerar seu próprio hash seguro.

---

## 2. Gerar Hash de Senha Seguro

Você tem **3 opções** para gerar o hash bcrypt da sua senha:

### 🔹 OPÇÃO 1: Via Node.js (Recomendado)

Esta é a forma mais rápida e segura.

**Passo 2.1.1:** Instale a dependência bcryptjs (se ainda não instalou):

```bash
npm install bcryptjs @types/bcryptjs
```

**Passo 2.1.2:** Execute o comando para gerar o hash:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('SUA_SENHA_AQUI', 10, (err, hash) => console.log('ADMIN_PASSWORD_HASH=' + hash));"
```

**Substitua `SUA_SENHA_AQUI` pela senha que deseja usar.**

**Exemplo de execução:**

```bash
$ node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('MinhaSenhaSegura@2024', 10, (err, hash) => console.log('ADMIN_PASSWORD_HASH=' + hash));"

ADMIN_PASSWORD_HASH=$2a$10$N9qo8uLOickgx2ZMRZoMye.IjNo.Z796qjRYDM6xCgM7u8v2aTMpa
```

**Passo 2.1.3:** Copie o hash gerado e cole no arquivo `.env.local`:

```env
ADMIN_PASSWORD_HASH=$2a$10$N9qo8uLOickgx2ZMRZoMye.IjNo.Z796qjRYDM6xCgM7u8v2aTMpa
```

---

### 🔹 OPÇÃO 2: Via Script Incluído

O projeto pode incluir um script para facilitar a geração do hash.

**Passo 2.2.1:** Verifique se o script existe:

```bash
ls scripts/generate-admin-hash.js
```

**Passo 2.2.2:** Execute o script:

```bash
node scripts/generate-admin-hash.js
```

**Passo 2.2.3:** Digite sua senha quando solicitado e copie o hash gerado para o `.env.local`.

---

### 🔹 OPÇÃO 3: Via Ferramenta Online

⚠️ **Menos seguro:** Use apenas para desenvolvimento/testes.

**Passo 2.3.1:** Acesse uma ferramenta de geração de hash bcrypt:

- [bcrypt-generator.com](https://bcrypt-generator.com/)
- [bcrypt.online](https://bcrypt.online/)

**Passo 2.3.2:** Configure:

```
Plain Text Password: SUA_SENHA_AQUI
Rounds: 10
```

**Passo 2.3.3:** Clique em "Generate Hash" ou equivalente.

**Passo 2.3.4:** Copie o hash gerado (começa com `$2a$10$`) e cole no `.env.local`.

⚠️ **AVISO DE SEGURANÇA:**
- **NUNCA** use ferramentas online para senhas de produção
- Use apenas para desenvolvimento/testes
- Ferramentas online podem registrar suas senhas

---

## 3. Testar o Login Admin

### Passo 3.1: Instalar Dependências

Certifique-se de que todas as dependências estão instaladas:

```bash
npm install
```

**IMPORTANTE:** Verifique se `bcryptjs` está instalado:

```bash
npm list bcryptjs
```

Se não estiver instalado:

```bash
npm install bcryptjs @types/bcryptjs
```

### Passo 3.2: Reiniciar o Servidor de Desenvolvimento

Para que as variáveis de ambiente sejam carregadas, reinicie o servidor:

```bash
# Pare o servidor (Ctrl+C) se estiver rodando

# Inicie novamente
npm run dev
```

### Passo 3.3: Acessar o Painel Admin

1. Abra seu navegador e acesse:
   ```
   http://localhost:3000/admin/login
   ```

2. Digite as credenciais configuradas:
   - **Username:** o valor de `ADMIN_USERNAME` do seu `.env.local`
   - **Password:** a senha original (em texto puro) que você usou para gerar o hash

3. Clique em **"Entrar"**

### Passo 3.4: Verificar Sucesso

**✅ Login bem-sucedido:**
- Você será redirecionado para o dashboard admin em `/admin`
- Um cookie de sessão HTTP-only será criado
- A sessão expirará em 24 horas

**❌ Se houver erro:**
- Verifique se as credenciais estão corretas
- Consulte a seção [Troubleshooting](#5-troubleshooting)

### Passo 3.5: Testar Logout

1. No painel admin, clique no botão **"Logout"** ou **"Sair"**
2. Você deve ser redirecionado para a página de login
3. O cookie de sessão será removido

### Passo 3.6: Testar Expiração de Sessão

A sessão expira automaticamente após 24 horas. Para testar:

1. Faça login normalmente
2. Aguarde 24 horas (ou altere `SESSION_DURATION` em `src/actions/admin-auth.ts` para testar)
3. Tente acessar qualquer página admin
4. Você deve ser redirecionado para o login

---

## 4. Segurança e Boas Práticas

### 🔒 Senhas Fortes

**SEMPRE use senhas fortes para o admin:**

✅ **Senha Forte (RECOMENDADO):**
```
Mínimo 12 caracteres
Letras maiúsculas e minúsculas
Números
Símbolos especiais (@, #, $, !, etc.)

Exemplo: MyS3cur3P@ssw0rd!2024
```

❌ **NUNCA use:**
```
admin
admin123
password
123456
senha
advocate
```

### 🔒 Separação de Ambientes

**Use credenciais diferentes para cada ambiente:**

| Ambiente | Arquivo | Senha |
|----------|---------|-------|
| **Desenvolvimento** | `.env.local` | Senha de desenvolvimento |
| **Staging** | Variáveis da plataforma | Senha diferente |
| **Produção** | Variáveis da plataforma | Senha forte e única |

### 🔒 Rotação de Credenciais

**Troque a senha regularmente:**

1. Gere um novo hash com nova senha
2. Atualize `ADMIN_PASSWORD_HASH` no ambiente
3. Reinicie a aplicação
4. Faça login com a nova senha

### 🔒 Nunca Versione Senhas

**Certifique-se de que `.env.local` está no `.gitignore`:**

```bash
# Verificar se está no .gitignore
grep ".env.local" .gitignore
```

Se não estiver, adicione:

```bash
echo ".env.local" >> .gitignore
```

### 🔒 Proteções Implementadas

O sistema admin já possui as seguintes proteções:

- ✅ **Hash bcrypt** - Senhas nunca em texto puro
- ✅ **Cookies HTTP-only** - Proteção contra XSS
- ✅ **Cookies Secure** - HTTPS em produção
- ✅ **SameSite: Lax** - Proteção contra CSRF
- ✅ **Delay anti-timing attack** - Previne timing attacks
- ✅ **Validação server-side** - Todas as verificações no servidor
- ✅ **Expiração de sessão** - 24 horas de validade

---

## 5. Troubleshooting

### ❌ Erro: "Credenciais inválidas"

**Causa:** Username ou senha incorretos.

**Solução:**

1. Verifique o username no `.env.local`:
   ```bash
   grep ADMIN_USERNAME .env.local
   ```

2. Verifique se o hash da senha está correto:
   ```bash
   grep ADMIN_PASSWORD_HASH .env.local
   ```

3. Certifique-se de que está usando a senha **original em texto puro** no login (não o hash)

4. Regenere o hash da senha seguindo a [Seção 2](#2-gerar-hash-de-senha-seguro)

---

### ❌ Erro: "Cannot find module 'bcryptjs'"

**Causa:** A dependência `bcryptjs` não está instalada.

**Solução:**

```bash
npm install bcryptjs @types/bcryptjs
```

Reinicie o servidor:

```bash
npm run dev
```

---

### ❌ Erro: "ADMIN_USERNAME ou ADMIN_PASSWORD_HASH não configurados"

**Causa:** Variáveis de ambiente não definidas ou servidor não reiniciado.

**Solução:**

1. Verifique se as variáveis estão no `.env.local`:
   ```bash
   cat .env.local | grep ADMIN_
   ```

2. Certifique-se de que não há espaços extras:
   ```env
   # ❌ ERRADO (espaço antes do =)
   ADMIN_USERNAME = admin

   # ✅ CORRETO
   ADMIN_USERNAME=admin
   ```

3. Reinicie o servidor:
   ```bash
   # Ctrl+C para parar
   npm run dev
   ```

---

### ❌ Erro: "Sessão expirada" ou "Acesso negado"

**Causa:** Sessão expirou ou cookie foi removido.

**Solução:**

1. Faça login novamente em `/admin/login`
2. A sessão dura 24 horas - após isso, é necessário novo login

---

### ❌ Erro: Hash gerado não funciona no login

**Causa:** Hash pode ter sido copiado incorretamente ou senha diferente da usada para gerar o hash.

**Solução:**

1. Regenere o hash usando **OPÇÃO 1** (Node.js):
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('MinhaSenha', 10, (err, hash) => console.log(hash));"
   ```

2. Copie o hash **completo** (incluindo `$2a$10$`)

3. Cole no `.env.local` **sem espaços extras**:
   ```env
   ADMIN_PASSWORD_HASH=$2a$10$N9qo8uLOickgx2ZMRZoMye.IjNo.Z796qjRYDM6xCgM7u8v2aTMpa
   ```

4. Reinicie o servidor e use a **mesma senha** (`MinhaSenha`) no login

---

### ❌ Servidor não detecta mudanças no .env.local

**Causa:** Next.js cacheia variáveis de ambiente ao iniciar.

**Solução:**

1. Pare o servidor completamente (Ctrl+C)
2. Reinicie: `npm run dev`
3. Variáveis de ambiente só são recarregadas no startup

---

### ❌ Cookie não está sendo criado

**Causa:** Configuração de cookies pode estar incorreta.

**Solução:**

1. Verifique se está usando HTTP em desenvolvimento:
   ```
   http://localhost:3000
   ```
   (não HTTPS)

2. Verifique no DevTools do navegador:
   - Abra **Application** > **Cookies**
   - Procure por cookie chamado `admin-session`

3. Se não aparecer, verifique o console do navegador por erros

---

## Recursos Adicionais

### Documentação Relacionada

- 📚 [Guia de Setup do Supabase](./SETUP_SUPABASE.md)
- 🔐 [Documentação de Segurança (RLS)](./SECURITY_RLS.md)
- 🔧 [Guia de Troubleshooting Geral](./TROUBLESHOOTING.md)
- 🏗️ [Documentação de Server Actions](./SERVER_ACTIONS.md)

### Arquivos de Referência

- **Código fonte da autenticação:** `src/actions/admin-auth.ts`
- **Página de login:** `src/app/admin/login/page.tsx`
- **Proteção de rotas:** `src/app/(dashboard)/admin/AdminAuthCheck.tsx`
- **Exemplo de env:** `.env.local.example` (linhas 56-91)

### Comandos Úteis

```bash
# Verificar se bcryptjs está instalado
npm list bcryptjs

# Gerar hash de senha via Node.js
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('SuaSenha', 10, (err, hash) => console.log(hash));"

# Verificar variáveis de ambiente
cat .env.local | grep ADMIN_

# Reiniciar servidor de desenvolvimento
npm run dev
```

---

## Suporte

Se você encontrar problemas não cobertos neste guia:

1. Consulte o [Guia de Troubleshooting Geral](./TROUBLESHOOTING.md)
2. Verifique os logs do servidor no terminal
3. Verifique o console do navegador por erros JavaScript
4. Abra uma issue no repositório do projeto

---

## Checklist de Configuração Completa

Use este checklist para validar sua configuração:

- [ ] Arquivo `.env.local` criado
- [ ] `ADMIN_USERNAME` definido
- [ ] `ADMIN_PASSWORD_HASH` definido (hash bcrypt válido)
- [ ] Dependência `bcryptjs` instalada (`npm list bcryptjs`)
- [ ] Servidor reiniciado após mudanças no `.env.local`
- [ ] Login funciona em `http://localhost:3000/admin/login`
- [ ] Redirecionamento para `/admin` após login bem-sucedido
- [ ] Logout funciona corretamente
- [ ] Cookie `admin-session` é criado (verificar no DevTools)
- [ ] Arquivo `.env.local` está no `.gitignore`
- [ ] Senha forte e segura sendo usada

**✅ Configuração completa!** Seu painel admin está pronto para uso.

---

**Última atualização:** 2026-01-09
**Versão do documento:** 1.0
