# UX Study: Post Cards — Melhores Práticas & Melhorias

> **Projeto:** Arena Te Amo (comunidade.omocodoteamo.com.br)  
> **Data:** Janeiro 2025  
> **Objetivo:** Melhorar performance, UX e engagement dos cards de posts  

---

## Índice

1. [Estudo de Plataformas de Referência](#1-estudo-de-plataformas-de-referência)
2. [Tamanhos de Posts & Variações de Conteúdo](#2-tamanhos-de-posts--variações-de-conteúdo)
3. [Comentários: Inline vs Expandido](#3-comentários-inline-vs-expandido)
4. [Performance: Lazy Loading, Skeleton, Virtualização](#4-performance-lazy-loading-skeleton-virtualização)
5. [Mobile First](#5-mobile-first)
6. [Interações: Like, Comentar, Compartilhar, Salvar](#6-interações-like-comentar-compartilhar-salvar)
7. [Análise do Código Atual — Problemas Identificados](#7-análise-do-código-atual--problemas-identificados)
8. [Proposta de Melhorias com Código](#8-proposta-de-melhorias-com-código)
9. [Prioridades de Implementação](#9-prioridades-de-implementação)

---

## 1. Estudo de Plataformas de Referência

### Twitter/X

| Aspecto | Implementação |
|---------|---------------|
| **Layout** | Card flat, sem borda visível, separado por linha fina |
| **Avatar** | 40px, circular, à esquerda |
| **Texto** | Inline, sem título separado. Max 280 chars visível |
| **Mídia** | Abaixo do texto, aspect-ratio 16:9 ou 1:1, rounded-2xl |
| **Ações** | Row horizontal: Reply, Retweet, Like, Views, Share, Bookmark |
| **Comentários** | Nunca inline — sempre nova página (thread) |
| **Skeleton** | Pulse animation com shapes que mimetizam avatar + linhas de texto |
| **Performance** | Virtualização pesada (só renderiza ~20 items visíveis) |

**Lições-chave:**
- Cards **mínimos** — sem bordas pesadas, sem sombras
- Ações sempre visíveis (não escondidas em menus)
- Zero inline comments no feed (reduz drasticamente DOM e requests)
- Contadores usam `tabular-nums` para evitar layout shift

### Instagram

| Aspecto | Implementação |
|---------|---------------|
| **Layout** | Card com header (avatar+nome), mídia full-width, ações, caption |
| **Avatar** | 32px no feed, com ring de stories |
| **Texto** | Caption **após** mídia, truncada em 2 linhas + "more" |
| **Mídia** | Full-width, aspect 1:1 ou 4:5, lazy loaded com blur placeholder |
| **Ações** | Like (❤️), Comment, Share, Save — layout em L (3 esquerda, 1 direita) |
| **Comentários** | Preview de 1-2 comments inline + "View all N comments" link |
| **Skeleton** | Shimmer effect nos cards |
| **Performance** | Virtualização + progressive image loading (thumbnail → full) |

**Lições-chave:**
- Mídia é o hero — **sempre antes** do texto
- Inline comments são **somente preview** (2 max), não interativos no feed
- **Sem input de comentário no card** — toque no ícone abre página dedicada
- Save button isolado à direita (destaque visual)

### Reddit

| Aspecto | Implementação |
|---------|---------------|
| **Layout** | Voto à esquerda + conteúdo à direita (classic) ou card mode |
| **Avatar** | Subreddit icon + username, 24px |
| **Texto** | Título bold + preview truncada (3 linhas) |
| **Mídia** | Inline expandível ou thumbnail compacto |
| **Ações** | Upvote/Downvote, Comments count, Share, Award, More (⋯) |
| **Comentários** | Nunca inline no feed — sempre nova página |
| **Performance** | Virtualização com `react-virtuoso`, placeholders por page |

**Lições-chave:**
- **Dois modos de visualização**: compact list vs card — permite ao usuário escolher
- Comentários são o principal CTA ("N comments" é o link mais clicado)
- Conteúdo truncado agressivamente no feed
- Media é colapsável

### Facebook

| Aspecto | Implementação |
|---------|---------------|
| **Layout** | Card com sombra sutil, cantos arredondados |
| **Avatar** | 40px com nome + timestamp |
| **Texto** | Expandível com "See more" após ~3 linhas |
| **Mídia** | Grid inteligente (1 img: full, 2: side by side, 3+: grid) |
| **Ações** | Like (reactions), Comment, Share — barra horizontal |
| **Comentários** | Inline expandível — mostra 2-3 "most relevant" + input |
| **Performance** | Virtualização + prefetch agressivo |

**Lições-chave:**
- **Reactions** ao invés de simples like (maior engagement)
- Grid de imagens adapta ao número de fotos
- Comentários inline são **curados** (most relevant, not chronological)
- Input de comentário é **sempre visível** (reduz fricção)

### Discord

| Aspecto | Implementação |
|---------|---------------|
| **Layout** | Chat-style: avatar + nome + timestamp, conteúdo abaixo |
| **Texto** | Markdown renderizado, sem truncamento |
| **Mídia** | Inline com max-width, embeds automáticos (links) |
| **Ações** | Hover: reactions, reply, thread, more |
| **Comentários** | Threads separados — "N replies" link |

**Lições-chave:**
- Ações aparecem **on hover** (limpa visual no estado default)
- Mensagens agrupadas do mesmo autor economizam espaço
- Embeds de links são extraídos automaticamente

---

### Resumo Comparativo

| Feature | Twitter | Instagram | Reddit | Facebook |
|---------|---------|-----------|--------|----------|
| Comments inline | ❌ | 1-2 preview | ❌ | 2-3 curated |
| Comment input inline | ❌ | ❌ | ❌ | ✅ |
| Text truncation | 280ch | 2 lines | 3 lines | 3 lines |
| Virtualization | ✅ | ✅ | ✅ | ✅ |
| Skeleton loading | ✅ | ✅ | ✅ | ✅ |
| Image lazy load | ✅ | ✅ (blur) | ✅ | ✅ |
| Save/Bookmark | ✅ | ✅ | ✅ | ✅ |
| Optimistic updates | ✅ | ✅ | ✅ | ✅ |

**Consenso da indústria:**
1. **Nenhuma plataforma** carrega comentários automaticamente no feed
2. **Todas** usam virtualização para feeds longos
3. **Texto truncado** é universal — "ver mais" é um link, não um botão
4. **Ações visíveis** sem hover no mobile (hover não existe em touch)
5. **Optimistic updates** em todas as interações

---

## 2. Tamanhos de Posts & Variações de Conteúdo

### Estratégia por Tipo de Conteúdo

```
┌─────────────────────────────────────────────┐
│ TEXTO CURTO (< 100 chars)                    │
│ ┌─────┐                                     │
│ │ AVA │ Nome · 2h                            │
│ └─────┘                                     │
│ Texto curto aqui sem truncar                │
│                                              │
│ ❤️ 12  💬 3        🔖 ↗                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ TEXTO LONGO (> 200 chars)                    │
│ ┌─────┐                                     │
│ │ AVA │ Nome · 2h                            │
│ └─────┘                                     │
│ Título do Post (bold)                       │
│ Texto longo aqui truncado em 3 linhas...    │
│ Ver mais →                                   │
│                                              │
│ ❤️ 12  💬 3        🔖 ↗                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ COM IMAGEM                                   │
│ ┌─────┐                                     │
│ │ AVA │ Nome · 2h                            │
│ └─────┘                                     │
│ ┌───────────────────────────────────────┐   │
│ │                                       │   │
│ │           IMAGEM (16:9)               │   │
│ │                                       │   │
│ └───────────────────────────────────────┘   │
│ ❤️ 12  💬 3        🔖 ↗                      │
│ Título (bold)                               │
│ Caption truncada...                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ MÚLTIPLAS IMAGENS                            │
│ ┌─────┐                                     │
│ │ AVA │ Nome · 2h                            │
│ └─────┘                                     │
│ ┌──────────┬──────────┐  ← grid 2x         │
│ │          │          │                      │
│ │   IMG 1  │   IMG 2  │  (ou carousel dots) │
│ │          │          │                      │
│ └──────────┴──────────┘                      │
│ ❤️ 12  💬 3        🔖 ↗                      │
└─────────────────────────────────────────────┘
```

### Regras de Truncamento

```typescript
// Estratégia de truncamento multi-camada
const TRUNCATION_RULES = {
  // Sem mídia: mais texto visível
  textOnly: {
    maxLines: 6,        // ~150 palavras
    maxChars: 500,
    showTitle: true,
  },
  // Com mídia: texto é secundário
  withMedia: {
    maxLines: 2,        // Caption curta
    maxChars: 150,
    showTitle: true,
  },
  // Texto curto: sem truncamento
  shortText: {
    threshold: 100,     // Abaixo disso, nunca trunca
    maxLines: Infinity,
  },
};
```

### Grid de Imagens Adaptativo (Estilo Facebook)

```typescript
function getImageLayout(count: number) {
  switch (count) {
    case 1: return 'single';      // Full width, aspect 16:9
    case 2: return 'side-by-side'; // 2 colunas iguais
    case 3: return 'one-plus-two'; // 1 grande + 2 pequenas
    case 4: return 'grid-2x2';    // Grid 2x2
    default: return 'grid-plus';  // Grid 2x2 + "+N" overlay
  }
}
```

---

## 3. Comentários: Inline vs Expandido

### O Problema Atual

O código atual do `InlineComments` faz **fetch de comentários para cada card no feed**:

```typescript
// ❌ PROBLEMA: useEffect que carrega comments para CADA post no feed
useEffect(() => {
  if (commentsCount === 0) return;
  getPostComments(postId).then((data) => {
    // ...
  });
}, [postId, commentsCount]);
```

**Impacto:** Se o feed tem 20 posts com comentários, são **20 requests adicionais** no mount.

### Abordagem Recomendada

**Nível 1 — Feed (zero requests):**
- Mostrar apenas **contadores** (N comentários, N curtidas)
- Preview de 1-2 comentários vem do **servidor junto com o post** (JOIN)
- **Sem input de comentário** no feed

**Nível 2 — Expandido (1 request on click):**
- Clicar em "Ver comentários" navega para `/post/{id}`
- OU abre um modal/sheet com todos os comentários
- Input de comentário só aqui

### Fluxo Recomendado

```
FEED (zero extra requests)
  │
  ├─ "Ana: Que lindo! ❤️"          ← dados vêm do servidor (join)
  ├─ "Ver todos os 12 comentários"  ← link para /post/{id}
  │
  └─ [tap] ─────────────────────┐
                                 │
                          POST PAGE (1 request)
                            ├─ Post completo
                            ├─ Todos os comentários
                            ├─ Input de novo comentário
                            └─ Respostas a comentários
```

### SQL: Trazer Preview de Comentários no Feed

```sql
-- Na query de feed, fazer LEFT JOIN LATERAL para pegar últimos 2 comentários
SELECT 
  p.*,
  author.full_name, author.avatar_url,
  comment_previews.data as comment_previews
FROM posts p
LEFT JOIN profiles author ON p.user_id = author.id
LEFT JOIN LATERAL (
  SELECT json_agg(sub) as data
  FROM (
    SELECT c.id, c.content, c.created_at,
           cp.full_name as author_name, cp.avatar_url as author_avatar
    FROM comments c
    LEFT JOIN profiles cp ON c.user_id = cp.id
    WHERE c.post_id = p.id AND c.parent_id IS NULL
    ORDER BY c.created_at DESC
    LIMIT 2
  ) sub
) comment_previews ON true
WHERE p.status = 'approved'
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## 4. Performance: Lazy Loading, Skeleton, Virtualização

### 4.1 Problemas Atuais de Performance

1. **InlineComments faz fetch por card** — N+1 problem no feed
2. **DOMPurify** importado em cada PostCard — bundle size (~15KB)
3. **Sem virtualização** — todos os cards renderizados no DOM
4. **ImageCarousel** não usa `loading="lazy"` em imagens não-visíveis
5. **10 skeletons** renderizados no loading — poderia ser 3-4 (viewport)
6. **Animação `animate-fade-in`** em todos os cards causa layout thrashing

### 4.2 Virtualização com `@tanstack/react-virtual`

```typescript
// hooks/useVirtualizedFeed.ts
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useCallback } from 'react';

export function useVirtualizedFeed(posts: PostWithAuthor[]) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    // Estimativa de altura — ajustada dinamicamente após render
    estimateSize: (index) => {
      const post = posts[index];
      const hasMedia = post.media_url && post.media_url.length > 0;
      const hasLongText = (post.content?.length || 0) > 200;
      
      // Estimativas baseadas no tipo de conteúdo
      if (hasMedia && hasLongText) return 600;
      if (hasMedia) return 500;
      if (hasLongText) return 300;
      return 200;
    },
    overscan: 3, // Renderiza 3 items extras em cada direção
    gap: 16,     // Espaço entre cards
  });

  return { parentRef, virtualizer };
}
```

```tsx
// components/home/VirtualizedFeed.tsx
'use client';

import { useVirtualizedFeed } from '@/hooks/useVirtualizedFeed';
import { InstagramCard } from './InstagramCard';
import type { PostWithAuthor } from '@/types/post';

export function VirtualizedFeed({ posts }: { posts: PostWithAuthor[] }) {
  const { parentRef, virtualizer } = useVirtualizedFeed(posts);

  return (
    <div
      ref={parentRef}
      className="h-screen overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <InstagramCard post={posts[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.3 Skeleton Melhorado

```tsx
// components/posts/PostCardSkeleton.tsx
export function PostCardSkeleton({ variant = 'with-media' }: { variant?: 'text-only' | 'with-media' }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 p-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-shimmer" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-28 bg-gray-200 rounded animate-shimmer" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-shimmer delay-75" />
        </div>
      </div>
      
      {/* Media skeleton */}
      {variant === 'with-media' && (
        <div className="aspect-[4/5] bg-gray-100 animate-shimmer delay-100" />
      )}
      
      {/* Actions skeleton */}
      <div className="flex gap-4 p-3">
        <div className="h-6 w-6 rounded bg-gray-200 animate-shimmer delay-150" />
        <div className="h-6 w-6 rounded bg-gray-200 animate-shimmer delay-200" />
      </div>
      
      {/* Text skeleton */}
      <div className="px-3 pb-3 space-y-1.5">
        <div className="h-3.5 w-full bg-gray-200 rounded animate-shimmer delay-200" />
        <div className="h-3.5 w-2/3 bg-gray-100 rounded animate-shimmer delay-250" />
      </div>
    </div>
  );
}
```

```css
/* Shimmer animation (Tailwind plugin ou CSS global) */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### 4.4 Lazy Loading de Imagens

```tsx
// components/posts/LazyImage.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  aspectRatio?: string;
  priority?: boolean;
  blurhash?: string; // Placeholder blur
}

export function LazyImage({ src, alt, aspectRatio = '4/5', priority = false, blurhash }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Carrega 200px antes de entrar no viewport
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  return (
    <div
      ref={imgRef}
      className="relative w-full overflow-hidden bg-gray-100"
      style={{ aspectRatio }}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {isInView && (
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={() => setIsLoaded(true)}
          priority={priority}
        />
      )}
    </div>
  );
}
```

### 4.5 DOMPurify — Otimização de Bundle

```typescript
// lib/sanitize.ts — Dynamic import para reduzir bundle inicial
let purifyInstance: typeof import('isomorphic-dompurify') | null = null;

export async function sanitizeHtml(html: string): Promise<string> {
  if (!purifyInstance) {
    purifyInstance = await import('isomorphic-dompurify');
  }
  return purifyInstance.default.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 's'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

// Versão síncrona para SSR (já carregado)
// No PostCard, usar a versão pré-sanitizada do servidor
```

**Melhor abordagem:** Sanitizar no **servidor** (na action `getFeedPosts`) e enviar HTML já limpo:

```typescript
// actions/feed.ts
import DOMPurify from 'isomorphic-dompurify';

async function getFeedPosts(params: FeedParams) {
  const posts = await db.query(...);
  
  // Sanitizar no servidor — client não precisa do DOMPurify
  return posts.map(post => ({
    ...post,
    content_safe: DOMPurify.sanitize(post.content, { ... }),
    content_plain: stripHtml(post.content).slice(0, 200), // Para preview
  }));
}
```

---

## 5. Mobile First

### 5.1 Touch Targets

O mínimo recomendado pelo WCAG é **44x44px** para touch targets. Análise atual:

| Elemento | Tamanho atual | Adequado? |
|----------|---------------|-----------|
| Like button | ~24x24 (icon) | ❌ (muito pequeno) |
| Comment icon | ~24x24 | ❌ |
| Share button | ~20x20 | ❌ |
| Save button | ~20x20 | ❌ |
| Avatar (link) | 40x40 | ✅ |
| "Ver mais" | texto inline | ❌ (difícil de tocar) |

**Fix:**

```tsx
// Todos os botões de ação devem ter padding para atingir 44px
<button className="p-2.5 -m-1.5 rounded-full active:bg-gray-100 transition-colors">
  <svg className="w-6 h-6" ... />
</button>
// Resultado: 24px icon + 20px padding = 44px touch target
```

### 5.2 Layout Responsivo

```tsx
// Card adapta entre mobile e desktop
<article className={cn(
  // Mobile first
  'bg-white overflow-hidden',
  // Mobile: sem borda, full-width
  'border-b border-gray-100',
  // Desktop: card com cantos arredondados
  'sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-sm sm:mb-4',
)}>
```

### 5.3 Swipe Gestures

O `ImageCarousel` já implementa swipe, mas pode melhorar:

```tsx
// Usar Framer Motion para animação fluida no swipe
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

function SwipeableCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const x = useMotionValue(0);
  
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && index < images.length - 1) {
      setIndex(i => i + 1);
    } else if (info.offset.x > threshold && index > 0) {
      setIndex(i => i - 1);
    }
  };

  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex"
        animate={{ x: `-${index * 100}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
      >
        {images.map((src, i) => (
          <div key={i} className="w-full flex-shrink-0">
            <LazyImage src={src} alt="" priority={i === 0} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
```

### 5.4 Bottom Sheet para Comentários (Mobile)

Em vez de navegar para outra página, usar bottom sheet no mobile:

```tsx
// components/posts/CommentsSheet.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export function CommentsSheet({ isOpen, onClose, postId }: CommentsSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            
            {/* Header */}
            <div className="px-4 pb-3 border-b border-gray-100">
              <h3 className="text-center font-semibold">Comentários</h3>
            </div>
            
            {/* Comments list (scrollable) */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {/* CommentsSection aqui */}
            </div>
            
            {/* Input (fixed at bottom) */}
            <div className="border-t border-gray-100 p-3">
              <form className="flex gap-2">
                <input
                  type="text"
                  placeholder="Adicione um comentário..."
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  Publicar
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## 6. Interações: Like, Comentar, Compartilhar, Salvar

### 6.1 Like — Melhorias

O `LikeButton` atual é bom (optimistic update, animation). Sugestões:

```tsx
// Double-tap to like (Instagram-style)
function useDoubleTap(callback: () => void, delay = 300) {
  const lastTap = useRef(0);

  return useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < delay) {
      callback();
    }
    lastTap.current = now;
  }, [callback, delay]);
}

// No card de imagem:
<div
  onTouchEnd={useDoubleTap(() => {
    if (!liked) handleLike();
  })}
>
  <LazyImage ... />
  {/* Heart animation overlay on double-tap */}
  {showHeartOverlay && (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 1.2, opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <svg className="w-24 h-24 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </motion.div>
  )}
</div>
```

### 6.2 Haptic Feedback

```tsx
// utils/haptics.ts
export function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30],
    };
    navigator.vibrate(patterns[style]);
  }
}

// No LikeButton:
const handleClick = () => {
  hapticFeedback('light');
  // ... rest of logic
};
```

### 6.3 Share — Progressive Enhancement

O `ShareButton` atual é bom. Sugestão de melhoria:

```tsx
// Adicionar share sheet com opções
function ShareMenu({ postId, postTitle }: { postId: string; postTitle: string }) {
  const url = `${window.location.origin}/post/${postId}`;
  
  const options = [
    { label: 'Copiar link', icon: LinkIcon, action: () => navigator.clipboard.writeText(url) },
    { label: 'WhatsApp', icon: WhatsAppIcon, action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${postTitle} ${url}`)}`) },
    { label: 'Twitter', icon: TwitterIcon, action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(postTitle)}`) },
  ];
  
  // Em mobile, usar navigator.share primeiro (mais nativo)
  // Fallback para menu customizado
}
```

---

## 7. Análise do Código Atual — Problemas Identificados

### ⚠️ Problema Crítico 1: N+1 Requests nos Comentários

**Arquivo:** `InlineComments.tsx`  
**Impacto:** 🔴 Alto  

```typescript
// CADA card no feed faz um request separado para carregar comentários
useEffect(() => {
  if (commentsCount === 0) return;
  getPostComments(postId).then(...)
}, [postId, commentsCount]);
```

**Resultado:** Feed com 20 posts = 20 requests extras ao carregar a página.

**Solução:** Trazer preview de comentários junto com o post (JOIN no servidor).

### ⚠️ Problema Crítico 2: DOMPurify no Client Bundle

**Arquivo:** `PostCard.tsx`, `InstagramCard.tsx`  
**Impacto:** 🟡 Médio  

`isomorphic-dompurify` (~15KB gzipped) é importado em componentes client-side. Deveria sanitizar no servidor.

### ⚠️ Problema 3: Dois Componentes de Card Redundantes

**Arquivos:** `PostCard.tsx` + `InstagramCard.tsx`  
**Impacto:** 🟡 Médio  

Dois componentes fazem essencialmente o mesmo trabalho com layouts ligeiramente diferentes. Isso causa:
- Duplicação de lógica (sanitize, truncate, media detection)
- Inconsistência visual entre páginas
- Mais código para manter

**Solução:** Unificar em um único `PostCard` com variants.

### ⚠️ Problema 4: Sem Virtualização

**Arquivo:** `InfiniteFeed.tsx`  
**Impacto:** 🟡 Médio (cresce com mais usuários)  

Todos os posts carregados ficam no DOM. Com infinite scroll, o DOM cresce indefinidamente.

### ⚠️ Problema 5: Estimativa de Skeleton Não-Realista

**Arquivo:** `InfiniteFeed.tsx`  
**Impacto:** 🟢 Baixo  

Renderiza 10 skeletons idênticos. Deveriam variar (com/sem mídia) e renderizar só 3-4 (viewport).

### ⚠️ Problema 6: Touch Targets Pequenos

**Arquivo:** `InstagramCard.tsx`, `PostCard.tsx`  
**Impacto:** 🟡 Médio  

Botões de ação (like, comment, share, save) têm touch targets menores que 44px.

### ⚠️ Problema 7: Options Menu com Hover

**Arquivo:** `PostCard.tsx`  
**Impacto:** 🟡 Médio  

```tsx
// Menu que depende de hover — NÃO funciona em mobile
<div className="relative group">
  <button>⋯</button>
  <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible">
    {/* menu items */}
  </div>
</div>
```

**Solução:** Usar state-based toggle (`onClick`) em vez de CSS hover.

### ⚠️ Problema 8: Animações em Todos os Cards

**Arquivo:** `InfiniteFeed.tsx`  
**Impacto:** 🟢 Baixo  

```tsx
// Cada card tem animação com delay crescente
style={{
  animationDelay: `${Math.min(index * 50, 500)}ms`,
}}
```

Com muitos cards, isso causa jank. Melhor animar só os cards que entram no viewport.

### ⚠️ Problema 9: `useTransition` Importado mas Não Usado

**Arquivo:** `PostCard.tsx`  
**Impacto:** 🟢 Baixo  

`useTransition` é importado mas não utilizado diretamente no componente.

### ⚠️ Problema 10: Type Casting Excessivo

**Arquivo:** `PostCard.tsx`  
**Impacto:** 🟢 Baixo  

```typescript
const mediaType = (post as unknown as Record<string, unknown>).media_type as string || 'none';
const youtubeUrl = (post as unknown as Record<string, unknown>).youtube_url as string | null;
```

Indica que o tipo `PostWithAuthor` não reflete os dados reais. Deve ser corrigido no tipo.

---

## 8. Proposta de Melhorias com Código

### 8.1 PostCard v2 — Componente Unificado

```tsx
// components/posts/PostCardV2.tsx
'use client';

import { useState, useCallback, memo, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, MemberBadge } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { LikeButton } from './LikeButton';
import { SaveButton } from './SaveButton';
import { ShareButton } from './ShareButton';
import { LazyImage } from './LazyImage';
import type { PostWithAuthor, CommentPreview } from '@/types/post';

// ─── Types ──────────────────────────────────────────────────

interface PostCardV2Props {
  post: PostWithAuthor & {
    content_plain?: string;       // Texto truncado (do servidor)
    content_safe?: string;        // HTML sanitizado (do servidor)
    comment_previews?: CommentPreview[]; // Últimos 2 comments (do servidor)
  };
  priority?: boolean;  // Primeiro post visível — carrega imagens eager
  variant?: 'feed' | 'compact';
}

// ─── Constants ──────────────────────────────────────────────

const TEXT_TRUNCATE_LINES = {
  withMedia: 2,
  withoutMedia: 6,
} as const;

// ─── Component ──────────────────────────────────────────────

export const PostCardV2 = memo(function PostCardV2({
  post,
  priority = false,
  variant = 'feed',
}: PostCardV2Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const author = post.author || {
    id: post.user_id,
    full_name: 'Usuário',
    avatar_url: null,
    is_creator: false,
    member_number: null,
  };

  const hasImages = post.media_url && post.media_url.length > 0;
  const hasYoutube = !!post.youtube_url;
  const hasInstagram = !!post.instagram_url;
  const hasMedia = hasImages || hasYoutube || hasInstagram;
  const hasContent = post.content && post.content !== '<p></p>';
  
  // Texto já vem truncado/sanitizado do servidor
  const displayText = post.content_plain || '';
  const isLong = displayText.length > 150;
  const truncateClass = hasMedia ? 'line-clamp-2' : 'line-clamp-6';

  // ─── Compact Variant ───
  if (variant === 'compact') {
    return (
      <Link href={`/post/${post.id}`} className="block">
        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors active:bg-gray-100">
          <Avatar
            name={author.full_name || 'Usuário'}
            src={author.avatar_url || undefined}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-gray-900 text-sm truncate">
                {author.full_name || 'Usuário'}
              </span>
              <MemberBadge memberNumber={author.member_number} />
              <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>
            {post.title && (
              <h4 className="font-semibold text-gray-900 text-sm truncate mt-0.5">
                {post.title}
              </h4>
            )}
            <p className="text-sm text-gray-500 truncate">{displayText}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              {(post.likes_count || 0) > 0 && <span>❤️ {post.likes_count}</span>}
              {(post.comments_count || 0) > 0 && <span>💬 {post.comments_count}</span>}
            </div>
          </div>
          {hasImages && post.media_url && (
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              <img
                src={post.media_url[0]}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </Link>
    );
  }

  // ─── Feed Variant ───
  return (
    <article
      className={cn(
        'bg-white overflow-hidden',
        // Mobile: flat, sem borda lateral
        'border-b border-gray-100',
        // Desktop: card style
        'sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-sm',
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/profile/${author.id}`} className="flex-shrink-0">
          <Avatar
            name={author.full_name || 'Usuário'}
            src={author.avatar_url || undefined}
            size="md"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/profile/${author.id}`}
              className="font-semibold text-[15px] text-gray-900 hover:text-primary-600 transition-colors truncate"
            >
              {author.full_name || 'Usuário'}
            </Link>
            <MemberBadge memberNumber={author.member_number} />
            {author.is_creator && (
              <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">
                Criador
              </span>
            )}
          </div>
          <time
            dateTime={post.created_at}
            className="text-xs text-gray-400"
          >
            {formatRelativeTime(post.created_at)}
          </time>
        </div>

        {/* Options menu — state-based, não hover */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="p-2.5 -m-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Mais opções"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                <Link
                  href={`/post/${post.id}`}
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Ver post completo
                </Link>
                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Denunciar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Help Request Badge ── */}
      {post.content_category === 'help_request' && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
          <span className="text-xs text-blue-700 font-medium">
            💙 Pedido de ajuda
          </span>
        </div>
      )}

      {/* ── Media (ANTES do texto — Instagram style) ── */}
      {hasImages && post.media_url && (
        <MediaSection
          images={post.media_url}
          alt={post.title || 'Post image'}
          priority={priority}
        />
      )}

      {hasYoutube && !hasImages && (
        <div className="px-4 pb-2">
          <YouTubeEmbed url={post.youtube_url!} />
        </div>
      )}

      {/* ── Action Bar ── */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1">
          <LikeButton
            postId={post.id}
            initialCount={post.likes_count || 0}
            initialLiked={false}
          />
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 p-2.5 rounded-full text-gray-500 hover:text-primary-600 transition-colors"
            aria-label={`${post.comments_count || 0} comentários`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {(post.comments_count || 0) > 0 && (
              <span className="text-sm font-semibold tabular-nums">
                {post.comments_count}
              </span>
            )}
          </Link>
        </div>
        <div className="flex items-center gap-0.5">
          <SaveButton postId={post.id} />
          <ShareButton postId={post.id} postTitle={post.title} />
        </div>
      </div>

      {/* ── Likes count ── */}
      {(post.likes_count || 0) > 0 && (
        <div className="px-4 -mt-1">
          <p className="text-sm font-semibold text-gray-900">
            {post.likes_count} curtida{(post.likes_count || 0) !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* ── Text Content (DEPOIS da mídia e ações) ── */}
      {hasContent && (
        <div className="px-4 pt-1 pb-2">
          {post.title && (
            <h3 className="font-bold text-gray-900 text-[15px] leading-snug">
              {post.title}
            </h3>
          )}
          <p className={cn(
            'text-[15px] text-gray-700 leading-relaxed break-words mt-0.5',
            truncateClass,
          )}>
            {displayText}
          </p>
          {isLong && (
            <Link
              href={`/post/${post.id}`}
              className="text-sm text-gray-400 hover:text-gray-600 mt-0.5 inline-block"
            >
              ver mais
            </Link>
          )}
        </div>
      )}

      {/* ── Comment Previews (dados do servidor — ZERO requests) ── */}
      <CommentPreviews
        postId={post.id}
        previews={post.comment_previews}
        totalCount={post.comments_count || 0}
      />
    </article>
  );
});

// ─── Sub-components ─────────────────────────────────────────

function MediaSection({
  images,
  alt,
  priority,
}: {
  images: string[];
  alt: string;
  priority: boolean;
}) {
  if (images.length === 1) {
    return (
      <LazyImage
        src={images[0]}
        alt={alt}
        aspectRatio="4/5"
        priority={priority}
      />
    );
  }

  // Carousel para múltiplas imagens
  return (
    <ImageCarousel images={images} alt={alt} aspectRatio="portrait" />
  );
}

/**
 * Comment previews — dados vindos do servidor, ZERO requests extras
 */
function CommentPreviews({
  postId,
  previews,
  totalCount,
}: {
  postId: string;
  previews?: CommentPreview[];
  totalCount: number;
}) {
  if (totalCount === 0) return null;

  return (
    <div className="px-4 pb-3">
      {/* Link para ver todos */}
      {totalCount > 2 && (
        <Link
          href={`/post/${postId}`}
          className="block text-sm text-gray-400 hover:text-gray-600 transition-colors mb-1.5"
        >
          Ver todos os {totalCount} comentários
        </Link>
      )}

      {/* Preview de 1-2 comentários (dados do servidor) */}
      {previews && previews.length > 0 && (
        <div className="space-y-1">
          {previews.map((comment) => (
            <p key={comment.id} className="text-[14px] leading-snug">
              <Link
                href={`/profile/${comment.author_id}`}
                className="font-semibold text-gray-900 hover:text-primary-600"
              >
                {comment.author_name}
              </Link>{' '}
              <span className="text-gray-600 line-clamp-1">
                {comment.content}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 8.2 Feed Action para Incluir Comment Previews

```typescript
// actions/feed.ts — Modificar para incluir comment_previews

import DOMPurify from 'isomorphic-dompurify';

export async function getFeedPosts(params: FeedParams) {
  const { data: posts, error } = await supabase.rpc('get_feed_with_previews', {
    p_type: params.type,
    p_sort: params.sort,
    p_cursor: params.cursor,
    p_limit: params.limit,
  });

  if (error) throw error;

  // Sanitizar e processar no servidor
  return {
    data: posts.map((post: any) => ({
      ...post,
      // Texto sanitizado — client não precisa importar DOMPurify
      content_safe: post.content ? sanitize(post.content) : null,
      // Texto plain truncado para preview
      content_plain: post.content ? stripHtml(post.content).slice(0, 500) : null,
      // Comment previews já vêm do SQL
      comment_previews: post.comment_previews || [],
    })),
    nextCursor: posts.length === params.limit
      ? posts[posts.length - 1].created_at
      : null,
    hasMore: posts.length === params.limit,
  };
}

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
```

### 8.3 Supabase RPC para Feed com Previews

```sql
-- supabase/migrations/XXXXXX_feed_with_previews.sql

CREATE OR REPLACE FUNCTION get_feed_with_previews(
  p_type text DEFAULT 'all',
  p_sort text DEFAULT 'new',
  p_cursor timestamptz DEFAULT NULL,
  p_limit int DEFAULT 10
)
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        p.*,
        -- Author
        json_build_object(
          'id', prof.id,
          'full_name', prof.full_name,
          'avatar_url', prof.avatar_url,
          'is_creator', prof.is_creator,
          'member_number', prof.member_number
        ) as author,
        -- Comment previews (últimos 2)
        COALESCE(
          (
            SELECT json_agg(cp ORDER BY cp.created_at DESC)
            FROM (
              SELECT 
                c.id,
                c.content,
                c.created_at,
                c.user_id as author_id,
                cp.full_name as author_name,
                cp.avatar_url as author_avatar
              FROM comments c
              LEFT JOIN profiles cp ON c.user_id = cp.id
              WHERE c.post_id = p.id AND c.parent_id IS NULL
              ORDER BY c.created_at DESC
              LIMIT 2
            ) cp
          ),
          '[]'::json
        ) as comment_previews
      FROM posts p
      LEFT JOIN profiles prof ON p.user_id = prof.id
      WHERE p.status = 'approved'
        AND (p_cursor IS NULL OR p.created_at < p_cursor)
        AND (
          p_type = 'all'
          OR (p_type = 'creator' AND prof.is_creator = true)
          OR (p_type = 'community' AND prof.is_creator = false)
          OR (p_type = 'help_request' AND p.content_category = 'help_request')
        )
      ORDER BY
        CASE WHEN p_sort = 'new' THEN p.created_at END DESC,
        CASE WHEN p_sort = 'hot' THEN (
          COALESCE(p.likes_count, 0) * 2 + COALESCE(p.comments_count, 0) * 3 +
          EXTRACT(EPOCH FROM (NOW() - p.created_at)) / -3600
        ) END DESC
      LIMIT p_limit
    ) t
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

### 8.4 Type Definitions Update

```typescript
// types/post.ts — Adicionar tipos para comment preview

export interface CommentPreview {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
}

export interface PostWithAuthor {
  id: string;
  title: string;
  content: string;
  content_plain?: string;          // Novo: texto truncado
  content_safe?: string;           // Novo: HTML sanitizado
  content_category?: string;
  media_url: string[] | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  media_type?: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  comment_previews?: CommentPreview[];  // Novo
  rejection_reason?: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_creator: boolean;
    member_number: number | null;
  };
}
```

---

## 9. Prioridades de Implementação

### 🔴 P0 — Crítico (Semana 1)

| # | Tarefa | Impacto | Esforço |
|---|--------|---------|---------|
| 1 | **Eliminar N+1 requests de comments** — incluir comment_previews no feed query | Performance: -N requests | Médio |
| 2 | **Mover sanitização para servidor** — remover DOMPurify do client bundle | Bundle: -15KB | Baixo |
| 3 | **Fix menu hover → click** — menu de opções não funciona em mobile | UX mobile: broken | Baixo |

### 🟡 P1 — Importante (Semana 2-3)

| # | Tarefa | Impacto | Esforço |
|---|--------|---------|---------|
| 4 | **Unificar PostCard + InstagramCard** em PostCardV2 | Manutenibilidade | Médio |
| 5 | **Melhorar touch targets** — padding em botões de ação | Acessibilidade | Baixo |
| 6 | **Fix PostWithAuthor types** — eliminar type castings | DX, bugs | Baixo |
| 7 | **Skeleton shimmer** — substituir pulse por shimmer + reduzir de 10 para 4 | UX percebida | Baixo |
| 8 | **Remover input de comentário inline** do feed | Performance DOM | Baixo |

### 🟢 P2 — Nice to Have (Semana 4+)

| # | Tarefa | Impacto | Esforço |
|---|--------|---------|---------|
| 9 | **Virtualização** com `@tanstack/react-virtual` | Performance em feeds longos | Alto |
| 10 | **Bottom sheet de comentários** (mobile) | UX mobile | Médio |
| 11 | **Double-tap to like** | Engagement | Baixo |
| 12 | **Haptic feedback** nas interações | UX sensorial | Baixo |
| 13 | **Image grid adaptativo** (1, 2, 3, 4+ imgs) | UX visual | Médio |
| 14 | **LazyImage com blur placeholder** | UX percebida | Médio |

### Estimativa Total

| Prioridade | Tasks | Estimativa |
|------------|-------|-----------|
| P0 | 3 | ~3-4 dias |
| P1 | 5 | ~5-7 dias |
| P2 | 6 | ~10-14 dias |
| **Total** | **14** | **~3-4 semanas** |

---

## Apêndice: Métricas para Validar

Após implementar, medir:

1. **Lighthouse Performance Score** — meta: > 90
2. **Time to Interactive (TTI)** — meta: < 3s em 4G
3. **Total Blocking Time (TBT)** — meta: < 200ms
4. **Network requests no feed** — meta: 1 request para posts + comments (em vez de N+1)
5. **Bundle size** — meta: reduzir ~15KB (DOMPurify no client)
6. **DOM nodes no feed** — meta: < 500 nodes visíveis com virtualização
7. **Engagement rate** — likes + comments / views (baseline → após mudanças)

---

*Estudo elaborado com base na análise de código do repositório advocate-platform e benchmarking de plataformas líderes (Twitter/X, Instagram, Reddit, Facebook, Discord).*
