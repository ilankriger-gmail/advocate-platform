# Estudo: Problema de Conexão do App Mobile

## Problema Identificado

O app mobile fica carregando infinitamente porque não consegue conectar com a API.

## Causa Raiz

### 1. Configuração de API Apontando para Produção

**Arquivo:** `apps/mobile/.env`

```env
EXPO_PUBLIC_API_URL=https://comunidade.omocodoteamo.com.br
```

O app está configurado para conectar na **API de produção**, mas para desenvolvimento local deveria apontar para o servidor Next.js local.

### 2. Porta Incorreta

O servidor Next.js está rodando na porta **3002** (porque a 3000 está ocupada), mas a configuração padrão espera a porta 3000.

### 3. Problema de Rede no Dispositivo Físico

Quando você testa no celular via Expo Go:
- `localhost` no celular aponta para o próprio celular, não para o Mac
- O app precisa do **IP do Mac** para conectar

## Arquitetura Atual

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   App Mobile    │────▶│   API Next.js   │────▶│    Supabase     │
│  (Expo/React    │     │  (localhost:    │     │   (Cloud DB)    │
│   Native)       │     │   3002)         │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                        │
       │ EXPO_PUBLIC_API_URL    │ Conecta direto
       │ (configuração .env)    │ ao Supabase
       ▼                        ▼
  Problema: URL               OK - Funciona
  aponta para produção
```

## Solução

### Passo 1: Atualizar `.env` do Mobile para Desenvolvimento

**Arquivo:** `apps/mobile/.env`

```env
# Supabase (OK - pode manter)
EXPO_PUBLIC_SUPABASE_URL=https://gsxanzgwstlpfvnqcmiu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API URL - MUDAR PARA DESENVOLVIMENTO LOCAL
# Para testar no navegador (Expo Web):
EXPO_PUBLIC_API_URL=http://localhost:3002

# Para testar no celular via Expo Go (use o IP do seu Mac):
# EXPO_PUBLIC_API_URL=http://192.168.4.133:3002
```

### Passo 2: Reiniciar o Expo

Após mudar o `.env`, reiniciar o Expo para carregar as novas variáveis:

```bash
# Parar o Expo (Ctrl+C)
# Iniciar novamente
npx expo start --clear
```

### Passo 3: Testar em Diferentes Ambientes

| Ambiente | URL da API |
|----------|------------|
| Expo Web (navegador) | `http://localhost:3002` |
| Expo Go (celular na mesma rede) | `http://192.168.4.133:3002` |
| Produção | `https://comunidade.omocodoteamo.com.br` |

## Fluxo de Dados

```
1. App Mobile inicia
2. Tela de Feed carrega
3. Chama GET /api/mobile/feed
4. API Next.js consulta Supabase
5. Retorna posts para o app
6. App renderiza os posts
```

**Onde falha atualmente:**
- Passo 3: A URL `https://comunidade.omocodoteamo.com.br/api/mobile/feed` pode:
  - Ter problemas de CORS
  - Requerer autenticação
  - Estar indisponível

## Verificação

Para verificar se a API está funcionando, acesse no navegador:

```
http://localhost:3002/api/mobile/feed
```

Deve retornar JSON com os posts:
```json
{
  "posts": [...],
  "nextCursor": "...",
  "hasMore": true
}
```

## Resumo das Alterações Necessárias

1. **Mudar `apps/mobile/.env`:**
   - `EXPO_PUBLIC_API_URL=http://localhost:3002`

2. **Reiniciar Expo:**
   - `npx expo start --clear`

3. **Garantir que Next.js está rodando:**
   - `npm run dev` (na pasta principal)

## Arquivos Relacionados

- `apps/mobile/.env` - Configuração de ambiente
- `apps/mobile/lib/api.ts` - Cliente de API
- `src/app/api/mobile/feed/route.ts` - Endpoint do feed
- `apps/mobile/app/(tabs)/index.tsx` - Tela principal do feed
