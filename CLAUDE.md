# Regras do Projeto - Plataforma de Advocate Marketing

## Tech Stack
- **Frontend**: Next.js 15 (App Router)
- **Backend/Database**: Supabase
- **Estilização**: Tailwind CSS
- **Linguagem**: TypeScript

## Princípios de Arquitetura

### Componentes React
- Utilizar **Server Components** por padrão
- Utilizar **Client Components** apenas quando necessário para:
  - Interatividade do usuário (formulários complexos, animações)
  - Uso de hooks do React (useState, useEffect, etc.)
  - Eventos do navegador
  - APIs específicas do cliente

### Lógica de Negócios
- Implementar lógica de negócios em **Server Actions**
- Manter a lógica de manipulação de dados fora dos componentes de UI
- Validação de dados tanto no cliente quanto no servidor

### Segurança
- **Supabase Row Level Security (RLS)** é obrigatório para todas as tabelas
- Implementar políticas de acesso granulares para cada tabela
- Autenticação via Supabase Auth
- Não expor dados sensíveis no cliente

### Padrões de Código
- **Comentários e commits em português**
- Nomenclatura de variáveis e funções em inglês (padrão de desenvolvimento)
- Tipagem estrita com TypeScript
- Organização de arquivos por funcionalidade/domínio
- Testes para funcionalidades críticas

### Desenvolvimento
- Priorizar desenvolvimento incremental (MVP primeiro, depois expansão)
- Documentação inline para decisões arquiteturais importantes
- Revisão de código antes de merge de features significativas

## Verificacao Obrigatoria (Claude)

### ANTES de cada commit
1. **`npm run build`** - Verificar se compila sem erros
2. **`npm run typecheck`** - Verificar tipos TypeScript
3. **`npm run lint`** - Verificar padroes de codigo
4. Revisar TODAS as mudancas feitas na sessao

### APOS editar arquivos .ts/.tsx
1. Verificar se o arquivo salvo esta correto sintaticamente
2. Em caso de duvida, rodar `npm run typecheck`
3. Nao deixar imports nao utilizados

### Comando rapido de verificacao completa
```bash
npm run verify  # Roda lint + typecheck + build
```

### Erros comuns a evitar
- Nao usar cores `primary-*` (usar `pink-500`, `red-500` explicitamente)
- Nao esquecer de exportar tipos/funcoes criados
- Verificar se todas as props obrigatorias estao sendo passadas
- Nao deixar `console.log` em codigo de producao

## Estrutura de Diretórios (Sugestão Inicial)
```
app/
  (auth)/           # Rotas relacionadas à autenticação
  (dashboard)/      # Área logada da plataforma
  (marketing)/      # Páginas públicas
  api/              # Rotas de API
components/         # Componentes compartilhados
lib/                # Utilitários, helpers, tipos
actions/            # Server Actions
styles/             # Estilos globais
public/             # Arquivos estáticos
```

## Documentação de Arquitetura

Para um entendimento completo e detalhado da arquitetura do projeto, consulte a documentação técnica na pasta `docs/`:

### 📚 Documentos Principais

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Visão geral completa da arquitetura
  - Stack tecnológica detalhada
  - Princípios arquiteturais e padrões
  - Diagramas de alto nível (Mermaid)
  - Estrutura completa de diretórios
  - Módulos e suas responsabilidades

- **[README.md](./docs/README.md)** - Índice completo de toda a documentação

### 🔄 Fluxos de Dados por Módulo

Cada módulo possui documentação detalhada do fluxo de dados na pasta `docs/flows/`:

- **[DATA_FLOW_AUTH.md](./docs/flows/DATA_FLOW_AUTH.md)** - Autenticação e autorização
- **[DATA_FLOW_POSTS.md](./docs/flows/DATA_FLOW_POSTS.md)** - Posts e feed de conteúdo
- **[DATA_FLOW_CHALLENGES.md](./docs/flows/DATA_FLOW_CHALLENGES.md)** - Desafios e participações
- **[DATA_FLOW_EVENTS.md](./docs/flows/DATA_FLOW_EVENTS.md)** - Eventos e registros
- **[DATA_FLOW_PROFILE_REWARDS.md](./docs/flows/DATA_FLOW_PROFILE_REWARDS.md)** - Perfil e recompensas

### 🛠️ Documentação Técnica Especializada

- **[COMPONENTS.md](./docs/COMPONENTS.md)** - Padrões e convenções de componentes
- **[SERVER_ACTIONS.md](./docs/SERVER_ACTIONS.md)** - Guia de Server Actions
- **[SECURITY_RLS.md](./docs/SECURITY_RLS.md)** - Políticas de segurança (RLS)
- **[DATABASE.md](./docs/DATABASE.md)** - Modelo de dados e relacionamentos
- **[MODULE_DEPENDENCIES.md](./docs/MODULE_DEPENDENCIES.md)** - Dependências entre módulos
- **[AUTHORIZATION.md](./docs/AUTHORIZATION.md)** - Sistema de autorização

### 💡 Onboarding de Desenvolvedores

**Leitura recomendada para novos desenvolvedores:**

1. Este arquivo (CLAUDE.md) - Princípios e regras do projeto
2. [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Visão geral da arquitetura
3. [docs/COMPONENTS.md](./docs/COMPONENTS.md) - Padrões de componentes
4. [docs/SERVER_ACTIONS.md](./docs/SERVER_ACTIONS.md) - Como criar Server Actions
5. Fluxos de dados específicos dos módulos que você irá trabalhar

Esta documentação visual e técnica reduz significativamente o tempo de onboarding e ajuda a evitar bugs arquiteturais.