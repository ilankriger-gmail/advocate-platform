# Relatório: Melhorias do Feed - Advocate Platform

**Data:** Janeiro 2025
**Baseado em:** Pesquisa de melhores práticas 2024-2025 + Análise do código atual

---

## Sumário Executivo

O feed atual está em **estágio MVP** - funcional mas com limitações significativas comparado a plataformas modernas. Este relatório detalha as lacunas identificadas e recomendações priorizadas para evolução.

### Status Atual vs Ideal

| Aspecto | Atual | Ideal | Prioridade |
|---------|-------|-------|------------|
| Paginação | Fixo (10 posts) | Infinite scroll | **P0** |
| Ordenação | Cronológica apenas | Multi-fator (trending, hot, novo) | **P1** |
| Performance | Carrega tudo junto | Virtualização + lazy load | **P1** |
| Real-time | Refresh manual | WebSocket/Supabase Realtime | **P2** |
| Engajamento | Votos + comentários | + Saves, shares, menções | **P2** |
| Acessibilidade | Básico | WCAG 2.1 AA compliant | **P3** |

---

## 1. Análise do Estado Atual

### 1.1 O Que Está Funcionando

✅ **Implementado:**
- Suporte multi-mídia (imagens, YouTube, Instagram)
- Sistema de votos com updates otimistas
- Comentários com lazy-loading
- Server-side rendering
- Separação Criador/Comunidade
- Sanitização HTML (DOMPurify)
- Carrossel de imagens
- Aspect ratio 4:5 (mobile-first)

### 1.2 Lacunas Críticas

❌ **Não Implementado:**

| Funcionalidade | Impacto |
|----------------|---------|
| Infinite Scroll | Usuários veem apenas 10 posts; abandonam a página |
| Feed Algorítmico | Conteúdo popular não é destacado |
| Personalização | Mesmo feed para todos os usuários |
| Bookmarks/Saves | Não podem salvar posts favoritos |
| Compartilhamento | Não podem compartilhar externamente |
| Busca | Não conseguem encontrar posts específicos |
| Hashtags | Não podem explorar por tema |
| Notificações | Não sabem quando recebem interações |

### 1.3 Problemas Técnicos

```typescript
// ❌ Type casting inseguro em PostCard.tsx
const voteScore = (post as unknown as Record<string, unknown>).vote_score as number || 0;

// ❌ Duplicação: InstagramCard e PostCard compartilham 70% da lógica

// ❌ Sem índices no banco para ordenação por vote_score
```

---

## 2. Melhores Práticas da Indústria (2025)

### 2.1 UI/UX Patterns

**Instagram/TikTok:**
- Formato vertical 4:5 ou 9:16 ✅ (já implementado)
- Gestos de swipe para navegação
- Double-tap para curtir
- Conteúdo autêntico > polido

**Hierarquia de Engajamento:**
1. **Comentários** (maior peso algorítmico)
2. **Compartilhamentos** (crescendo em importância)
3. **Saves/Bookmarks** (sinal de qualidade)
4. **Likes/Votos** (fundacional)

### 2.2 Performance Técnica

**Infinite Scroll - Implementação Recomendada:**
```typescript
// Usar Intersection Observer API
const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting && hasMore) {
      loadMorePosts();
    }
  },
  { threshold: 0.1 }
);

// Observar elemento sentinel no final do feed
observer.observe(sentinelRef.current);
```

**Bibliotecas Recomendadas:**
- `react-infinite-scroll-component` - Simples (4.15 kB)
- `react-window` - Para virtualização de listas grandes
- `@tanstack/react-query` - Cache e estado do servidor

**Padrões de Performance React:**
1. **Virtualização** - Renderizar apenas itens visíveis
2. **Memoização** - `React.memo` para componentes de lista
3. **State Colocation** - Estado local para evitar re-renders
4. **Suspense** - Loading progressivo

### 2.3 Algoritmo de Feed

**Fórmula de Trending (Reddit-like):**
```typescript
// Score decay over time
const hotScore = (votes: number, createdAt: Date) => {
  const ageInHours = (Date.now() - createdAt.getTime()) / 3600000;
  const gravity = 1.8; // Decay factor
  return votes / Math.pow(ageInHours + 2, gravity);
};
```

**Opções de Ordenação:**
- **Novos** - `created_at DESC`
- **Top** - `vote_score DESC`
- **Hot/Trending** - Score calculado com decay temporal
- **Relevante** - Personalizado por interações do usuário

### 2.4 Acessibilidade (WCAG 2.1 AA)

**Obrigatório:**
- Alt text em todas as imagens
- Legendas em vídeos
- Contraste mínimo 4.5:1
- Navegação por teclado completa
- Focus indicators visíveis
- Hashtags em PascalCase (`#NextLovers` não `#nextlovers`)
- Respeitar `prefers-reduced-motion`

---

## 3. Arquitetura Proposta

### 3.1 Estrutura de Componentes

```
FeedContainer (Client)
├── FeedHeader
│   ├── TabSelector (Novidades | Comunidade)
│   └── SortSelector (Novo | Top | Hot)
├── VirtualizedFeed (react-window)
│   └── FeedCard × N (memoizado)
│       ├── CardHeader (Avatar, Nome, Tempo)
│       ├── CardMedia (Imagem | Carrossel | Video | Embed)
│       ├── CardActions (Vote, Comment, Share, Save)
│       └── CardContent (Título, Texto)
├── LoadingIndicator (Intersection Observer trigger)
└── EmptyState
```

### 3.2 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    FeedContainer                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  useInfiniteQuery (React Query)                 │    │
│  │  - Paginação automática                         │    │
│  │  - Cache inteligente                            │    │
│  │  - Refetch em background                        │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  VirtualizedList (react-window)                 │    │
│  │  - Renderiza apenas itens visíveis              │    │
│  │  - Recicla DOM nodes                            │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  FeedCard (React.memo)                          │    │
│  │  - Optimistic updates para votos                │    │
│  │  - Lazy-load de comentários                     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Queries com Paginação

```typescript
// Nova função em queries.ts
export async function getInfinitePosts({
  type,
  cursor,
  limit = 10,
  sort = 'new'
}: {
  type: 'creator' | 'community';
  cursor?: string;
  limit?: number;
  sort?: 'new' | 'top' | 'hot';
}) {
  let query = supabase
    .from('posts')
    .select('*, author:users!posts_user_id_fkey(*)')
    .eq('status', 'approved')
    .eq('type', type)
    .limit(limit);

  // Ordenação
  switch (sort) {
    case 'top':
      query = query.order('vote_score', { ascending: false });
      break;
    case 'hot':
      // Implementar hot_score como computed column ou calcular client-side
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Paginação por cursor
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  return {
    posts: data || [],
    nextCursor: data?.length === limit ? data[data.length - 1].created_at : null
  };
}
```

---

## 4. Plano de Implementação

### Fase 1: Fundação (1-2 dias)

**Objetivo:** Infinite scroll funcional

- [ ] Instalar `@tanstack/react-query`
- [ ] Criar hook `useInfiniteFeed`
- [ ] Implementar Intersection Observer para trigger
- [ ] Adicionar cursor-based pagination nas queries
- [ ] Atualizar FeedTabs para usar infinite scroll
- [ ] Adicionar loading states

**Arquivos:**
```
src/hooks/useInfiniteFeed.ts (NOVO)
src/lib/supabase/queries.ts (MODIFICAR)
src/components/home/FeedTabs.tsx (MODIFICAR)
```

### Fase 2: Performance (1 dia)

**Objetivo:** Feed performático para grandes volumes

- [ ] Implementar virtualização com `react-window`
- [ ] Memoizar FeedCard
- [ ] Lazy-load imagens abaixo do fold
- [ ] Otimizar bundle (dynamic imports)

**Arquivos:**
```
src/components/home/VirtualizedFeed.tsx (NOVO)
src/components/home/InstagramCard.tsx (MODIFICAR)
```

### Fase 3: Ordenação (1 dia)

**Objetivo:** Múltiplas formas de ordenar o feed

- [ ] Adicionar SortSelector component
- [ ] Implementar ordenação por `vote_score` (Top)
- [ ] Criar computed column `hot_score` no banco
- [ ] Adicionar índices necessários

**Arquivos:**
```
src/components/home/SortSelector.tsx (NOVO)
src/components/home/FeedTabs.tsx (MODIFICAR)
supabase/migrations/add_hot_score.sql (NOVO)
```

### Fase 4: Engajamento (2 dias)

**Objetivo:** Features de engajamento modernas

- [ ] Sistema de Bookmarks/Saves
  - Tabela `post_saves`
  - Botão de save no card
  - Página "Salvos" no perfil
- [ ] Compartilhamento
  - Share nativo (Web Share API)
  - Copiar link
  - Contador de shares

**Arquivos:**
```
src/actions/saves.ts (NOVO)
src/components/posts/SaveButton.tsx (NOVO)
src/components/posts/ShareButton.tsx (NOVO)
src/app/(dashboard)/perfil/salvos/page.tsx (NOVO)
```

### Fase 5: Real-time (1 dia)

**Objetivo:** Updates em tempo real

- [ ] Supabase Realtime para novos posts
- [ ] Live updates de vote_score
- [ ] Notificação de novos comentários
- [ ] Indicador "X novos posts"

**Arquivos:**
```
src/hooks/useRealtimeFeed.ts (NOVO)
src/components/home/NewPostsIndicator.tsx (NOVO)
```

### Fase 6: Acessibilidade (1 dia)

**Objetivo:** WCAG 2.1 AA compliance

- [ ] Audit de acessibilidade
- [ ] Navegação por teclado
- [ ] ARIA labels
- [ ] Alt text obrigatório
- [ ] Focus management

---

## 5. Banco de Dados - Alterações Necessárias

### 5.1 Novas Tabelas

```sql
-- Tabela de saves/bookmarks
CREATE TABLE post_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Tabela de shares (analytics)
CREATE TABLE post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform VARCHAR(50), -- 'copy_link', 'native', 'twitter', etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Índices Necessários

```sql
-- Índice para ordenação por votos
CREATE INDEX idx_posts_vote_score ON posts(vote_score DESC)
WHERE status = 'approved';

-- Índice composto para queries comuns
CREATE INDEX idx_posts_type_status_created ON posts(type, status, created_at DESC);

-- Índice para hot score (se usar computed column)
CREATE INDEX idx_posts_hot_score ON posts(hot_score DESC)
WHERE status = 'approved';
```

### 5.3 Computed Column para Hot Score

```sql
-- Adicionar coluna hot_score
ALTER TABLE posts ADD COLUMN hot_score DECIMAL GENERATED ALWAYS AS (
  vote_score / POWER(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 + 2, 1.8)
) STORED;
```

---

## 6. Métricas de Sucesso

### KPIs a Monitorar

| Métrica | Antes | Meta |
|---------|-------|------|
| Posts vistos por sessão | ~10 | 30+ |
| Tempo médio na página | ? | +50% |
| Taxa de scroll até o fim | 0% | 20%+ |
| Votos por sessão | ? | +30% |
| Comentários por sessão | ? | +20% |

### Como Medir

- [ ] Adicionar analytics de scroll depth
- [ ] Trackear impressões de posts
- [ ] Medir engagement rate por post
- [ ] A/B test de ordenações

---

## 7. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Performance com muitos posts | Média | Virtualização obrigatória |
| Complexidade do hot_score | Baixa | Começar com top simples |
| Breaking changes na API | Média | Versionamento de queries |
| Supabase Realtime limits | Baixa | Throttling de subscriptions |

---

## 8. Conclusão

O feed atual é funcional mas **não escala** e **não engaja** como plataformas modernas. As implementações prioritárias são:

1. **Infinite Scroll** - Sem isso, usuários abandonam após 10 posts
2. **Ordenação por relevância** - Conteúdo bom fica enterrado
3. **Saves/Bookmarks** - Feature esperada por qualquer usuário

Recomendação: Implementar as **Fases 1-3** primeiro (3-4 dias de trabalho), validar com usuários, depois seguir para Fases 4-6.

---

## Próximos Passos

Após aprovação deste relatório:

1. [ ] Criar branch `feature/feed-v2`
2. [ ] Implementar Fase 1 (Infinite Scroll)
3. [ ] Testar em staging
4. [ ] Implementar Fases 2-3
5. [ ] Review de código
6. [ ] Deploy gradual (feature flag)

---

*Relatório gerado com base em pesquisa de melhores práticas 2024-2025 e análise profunda do código atual.*
