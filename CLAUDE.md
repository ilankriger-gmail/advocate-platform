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