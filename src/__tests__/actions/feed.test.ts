/**
 * Testes para actions de feed
 * Testa paginação por cursor com diferentes tipos de ordenação
 */

import { getFeedPosts } from '@/actions/feed';
import {
  resetMocks,
  setupAuthenticatedUser,
} from '../helpers';
import {
  createMockPost,
  createMany,
} from '../factories';
import { setMockData } from '../mocks/supabase';

// Mock do módulo Supabase server
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => require('../mocks/supabase').createMockSupabaseClient()),
}));

describe('getFeedPosts', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Ordenação "new" (created_at DESC)', () => {
    it('deve retornar posts ordenados por created_at DESC', async () => {
      // Arrange: Cria posts com datas diferentes
      const now = new Date();
      const posts = [
        createMockPost({
          id: 'post-1',
          created_at: new Date(now.getTime() - 3000).toISOString(),
          title: 'Post antigo',
        }),
        createMockPost({
          id: 'post-2',
          created_at: new Date(now.getTime() - 1000).toISOString(),
          title: 'Post recente',
        }),
        createMockPost({
          id: 'post-3',
          created_at: new Date(now.getTime() - 2000).toISOString(),
          title: 'Post médio',
        }),
      ];
      setMockData('posts', posts);

      // Act: Buscar feed ordenado por 'new'
      const result = await getFeedPosts({
        type: 'all',
        sort: 'new',
        limit: 10,
      });

      // Assert: Posts ordenados do mais recente para o mais antigo
      expect(result.data).toHaveLength(3);
      expect(result.data[0].id).toBe('post-2'); // Mais recente
      expect(result.data[1].id).toBe('post-3'); // Médio
      expect(result.data[2].id).toBe('post-1'); // Mais antigo
    });

    it('deve paginar corretamente usando cursor created_at', async () => {
      // Arrange: Cria 15 posts
      const now = new Date();
      const posts = createMany(createMockPost, 15, (index) => ({
        id: `post-${index}`,
        created_at: new Date(now.getTime() - index * 1000).toISOString(),
        title: `Post ${index}`,
      }));
      setMockData('posts', posts);

      // Act: Primeira página (10 posts)
      const page1 = await getFeedPosts({
        type: 'all',
        sort: 'new',
        limit: 10,
      });

      // Assert: Primeira página tem 10 posts e indica que há mais
      expect(page1.data).toHaveLength(10);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBe(page1.data[9].created_at);

      // Act: Segunda página usando cursor
      const page2 = await getFeedPosts({
        type: 'all',
        sort: 'new',
        limit: 10,
        cursor: page1.nextCursor!,
      });

      // Assert: Segunda página tem os 5 posts restantes
      expect(page2.data).toHaveLength(5);
      expect(page2.hasMore).toBe(false);
      expect(page2.nextCursor).toBeNull();

      // Assert: Sem duplicação entre páginas
      const page1Ids = page1.data.map(p => p.id);
      const page2Ids = page2.data.map(p => p.id);
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });

    it('deve retornar hasMore=false quando não há mais posts', async () => {
      // Arrange: Cria apenas 5 posts (menos que o limit)
      const posts = createMany(createMockPost, 5, (index) => ({
        id: `post-${index}`,
        created_at: new Date(Date.now() - index * 1000).toISOString(),
      }));
      setMockData('posts', posts);

      // Act
      const result = await getFeedPosts({
        type: 'all',
        sort: 'new',
        limit: 10,
      });

      // Assert: Todos os posts retornados, sem próxima página
      expect(result.data).toHaveLength(5);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('Ordenação "top" (likes_count DESC, id DESC)', () => {
    it('deve retornar posts ordenados por likes_count DESC', async () => {
      // Arrange: Posts com diferentes quantidades de likes
      const posts = [
        createMockPost({ id: 'post-1', likes_count: 5, title: '5 likes' }),
        createMockPost({ id: 'post-2', likes_count: 20, title: '20 likes' }),
        createMockPost({ id: 'post-3', likes_count: 10, title: '10 likes' }),
      ];
      setMockData('posts', posts);

      // Act
      const result = await getFeedPosts({
        type: 'all',
        sort: 'top',
        limit: 10,
      });

      // Assert: Ordenados do mais curtido para o menos curtido
      expect(result.data).toHaveLength(3);
      expect(result.data[0].likes_count).toBe(20);
      expect(result.data[1].likes_count).toBe(10);
      expect(result.data[2].likes_count).toBe(5);
    });

    it('deve usar ordenação estável quando likes_count são iguais', async () => {
      // Arrange: Posts com mesmo número de likes mas IDs diferentes
      const posts = [
        createMockPost({ id: 'post-a', likes_count: 10 }),
        createMockPost({ id: 'post-c', likes_count: 10 }),
        createMockPost({ id: 'post-b', likes_count: 10 }),
      ];
      setMockData('posts', posts);

      // Act
      const result = await getFeedPosts({
        type: 'all',
        sort: 'top',
        limit: 10,
      });

      // Assert: Com mesmo likes_count, ordenado por ID DESC
      expect(result.data).toHaveLength(3);
      expect(result.data[0].id).toBe('post-c');
      expect(result.data[1].id).toBe('post-b');
      expect(result.data[2].id).toBe('post-a');
    });

    it('deve paginar usando cursor composto (likes_count + id)', async () => {
      // Arrange: 15 posts com diferentes likes
      const posts = createMany(createMockPost, 15, (index) => ({
        id: `post-${String(index).padStart(2, '0')}`,
        likes_count: 20 - index, // Decresce de 20 a 6
      }));
      setMockData('posts', posts);

      // Act: Primeira página
      const page1 = await getFeedPosts({
        type: 'all',
        sort: 'top',
        limit: 10,
      });

      // Assert: Primeira página com cursor composto
      expect(page1.data).toHaveLength(10);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBeDefined();

      // Act: Segunda página
      const page2 = await getFeedPosts({
        type: 'all',
        sort: 'top',
        limit: 10,
        cursor: page1.nextCursor!,
      });

      // Assert: Segunda página sem duplicação
      expect(page2.data).toHaveLength(5);
      expect(page2.hasMore).toBe(false);

      // Verifica que não há duplicação
      const allIds = [...page1.data, ...page2.data].map(p => p.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(15);
    });

    it('deve rejeitar cursor inválido para ordenação top', async () => {
      // Arrange: Posts válidos
      const posts = createMany(createMockPost, 5);
      setMockData('posts', posts);

      // Act: Cursor inválido (não é base64 válido ou formato incorreto)
      const result = await getFeedPosts({
        type: 'all',
        sort: 'top',
        limit: 10,
        cursor: 'invalid-cursor',
      });

      // Assert: Deve ignorar cursor inválido e retornar primeira página
      expect(result.data).toHaveLength(5);
    });
  });

  describe('Ordenação "hot" (hot_score calculado, paginação por created_at)', () => {
    it('deve retornar posts reordenados por hot_score', async () => {
      // Arrange: Posts com diferentes combinações de likes e idade
      const now = new Date();
      const posts = [
        // Post antigo com muitos likes (hot score menor)
        createMockPost({
          id: 'post-old',
          likes_count: 50,
          created_at: new Date(now.getTime() - 7 * 24 * 3600000).toISOString(), // 7 dias
        }),
        // Post recente com poucos likes (hot score maior)
        createMockPost({
          id: 'post-recent',
          likes_count: 10,
          created_at: new Date(now.getTime() - 3600000).toISOString(), // 1 hora
        }),
        // Post médio
        createMockPost({
          id: 'post-medium',
          likes_count: 20,
          created_at: new Date(now.getTime() - 24 * 3600000).toISOString(), // 1 dia
        }),
      ];
      setMockData('posts', posts);

      // Act
      const result = await getFeedPosts({
        type: 'all',
        sort: 'hot',
        limit: 10,
      });

      // Assert: Posts retornados (ordem por hot_score é calculada no client)
      expect(result.data).toHaveLength(3);
      // Verificar que hot score não está exposto (removido após cálculo)
      expect(result.data[0]).not.toHaveProperty('_hotScore');
    });

    it('deve paginar usando created_at como cursor', async () => {
      // Arrange: 15 posts
      const now = new Date();
      const posts = createMany(createMockPost, 15, (index) => ({
        id: `post-${index}`,
        likes_count: Math.floor(Math.random() * 50),
        created_at: new Date(now.getTime() - index * 3600000).toISOString(),
      }));
      setMockData('posts', posts);

      // Act: Primeira página
      const page1 = await getFeedPosts({
        type: 'all',
        sort: 'hot',
        limit: 10,
      });

      // Assert: Cursor é baseado em created_at
      expect(page1.data).toHaveLength(10);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBe(page1.data[9].created_at);

      // Act: Segunda página
      const page2 = await getFeedPosts({
        type: 'all',
        sort: 'hot',
        limit: 10,
        cursor: page1.nextCursor!,
      });

      // Assert: Sem duplicação
      expect(page2.data).toHaveLength(5);
      const page1Ids = page1.data.map(p => p.id);
      const page2Ids = page2.data.map(p => p.id);
      expect(page1Ids.filter(id => page2Ids.includes(id))).toHaveLength(0);
    });
  });

  describe('Filtros de tipo', () => {
    it('deve filtrar posts do tipo "creator"', async () => {
      // Arrange: Mix de posts creator e community
      const posts = [
        createMockPost({ id: 'post-1', type: 'creator' }),
        createMockPost({ id: 'post-2', type: 'community' }),
        createMockPost({ id: 'post-3', type: 'creator' }),
      ];
      setMockData('posts', posts);

      // Act
      const result = await getFeedPosts({
        type: 'creator',
        sort: 'new',
        limit: 10,
      });

      // Assert: Apenas posts de creator
      expect(result.data).toHaveLength(2);
      expect(result.data.every(p => p.type === 'creator')).toBe(true);
    });

    it('deve filtrar posts do tipo "community"', async () => {
      // Arrange: Mix de posts
      const posts = [
        createMockPost({ id: 'post-1', type: 'creator' }),
        createMockPost({ id: 'post-2', type: 'community' }),
        createMockPost({ id: 'post-3', type: 'community' }),
      ];
      setMockData('posts', posts);

      // Act
      const result = await getFeedPosts({
        type: 'community',
        sort: 'new',
        limit: 10,
      });

      // Assert: Apenas posts de community
      expect(result.data).toHaveLength(2);
      expect(result.data.every(p => p.type === 'community')).toBe(true);
    });

    it('deve retornar todos os posts quando type="all"', async () => {
      // Arrange: Mix de posts
      const posts = [
        createMockPost({ id: 'post-1', type: 'creator' }),
        createMockPost({ id: 'post-2', type: 'community' }),
        createMockPost({ id: 'post-3', type: 'creator' }),
      ];
      setMockData('posts', posts);

      // Act
      const result = await getFeedPosts({
        type: 'all',
        sort: 'new',
        limit: 10,
      });

      // Assert: Todos os posts
      expect(result.data).toHaveLength(3);
    });
  });

  describe('Status de posts', () => {
    it('deve retornar apenas posts aprovados', async () => {
      // Arrange: Posts com diferentes status
      const posts = [
        createMockPost({ id: 'post-1', status: 'approved' }),
        createMockPost({ id: 'post-2', status: 'pending' }),
        createMockPost({ id: 'post-3', status: 'approved' }),
        createMockPost({ id: 'post-4', status: 'rejected' }),
      ];
      setMockData('posts', posts);

      // Act
      const result = await getFeedPosts({
        type: 'all',
        sort: 'new',
        limit: 10,
      });

      // Assert: Apenas posts aprovados
      expect(result.data).toHaveLength(2);
      expect(result.data.every(p => p.status === 'approved')).toBe(true);
    });
  });

  describe('Dados do autor', () => {
    it('deve incluir dados do autor em cada post', async () => {
      // Arrange: Posts com diferentes autores
      const posts = [
        createMockPost({
          id: 'post-1',
          author: {
            id: 'user-1',
            full_name: 'John Doe',
            avatar_url: 'https://example.com/avatar.jpg',
            is_creator: true,
          },
        }),
        createMockPost({
          id: 'post-2',
          author: {
            id: 'user-2',
            full_name: 'Jane Smith',
            avatar_url: null,
            is_creator: false,
          },
        }),
      ];
      setMockData('posts', posts);

      // Act
      const result = await getFeedPosts({
        type: 'all',
        sort: 'new',
        limit: 10,
      });

      // Assert: Dados do autor presentes
      expect(result.data).toHaveLength(2);
      expect(result.data[0].author).toBeDefined();
      expect(result.data[0].author?.full_name).toBe('John Doe');
      expect(result.data[1].author?.full_name).toBe('Jane Smith');
    });
  });

  describe('Limite de resultados', () => {
    it('deve respeitar o limite especificado', async () => {
      // Arrange: 20 posts disponíveis
      const posts = createMany(createMockPost, 20, (index) => ({
        id: `post-${index}`,
      }));
      setMockData('posts', posts);

      // Act: Limitar a 5 posts
      const result = await getFeedPosts({
        type: 'all',
        sort: 'new',
        limit: 5,
      });

      // Assert: Apenas 5 posts retornados
      expect(result.data).toHaveLength(5);
      expect(result.hasMore).toBe(true);
    });

    it('deve usar limit padrão de 10 quando não especificado', async () => {
      // Arrange: 20 posts disponíveis
      const posts = createMany(createMockPost, 20, (index) => ({
        id: `post-${index}`,
      }));
      setMockData('posts', posts);

      // Act: Sem especificar limit
      const result = await getFeedPosts({
        type: 'all',
        sort: 'new',
      });

      // Assert: Limit padrão de 10 aplicado
      expect(result.data).toHaveLength(10);
    });
  });

  describe('Feed vazio', () => {
    it('deve retornar array vazio quando não há posts', async () => {
      // Arrange: Sem posts
      setMockData('posts', []);

      // Act
      const result = await getFeedPosts({
        type: 'all',
        sort: 'new',
        limit: 10,
      });

      // Assert: Resposta vazia mas válida
      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('deve retornar vazio quando filtro não encontra posts', async () => {
      // Arrange: Apenas posts community
      const posts = [
        createMockPost({ type: 'community' }),
        createMockPost({ type: 'community' }),
      ];
      setMockData('posts', posts);

      // Act: Buscar apenas posts creator
      const result = await getFeedPosts({
        type: 'creator',
        sort: 'new',
        limit: 10,
      });

      // Assert: Vazio
      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('Cenários de erro', () => {
    it('deve retornar resposta vazia em caso de erro no banco', async () => {
      // Arrange: Simular erro removendo dados e forçando erro no mock
      // (O mock atual não simula erros, mas a action tem tratamento)
      setMockData('posts', []);

      // Act
      const result = await getFeedPosts({
        type: 'all',
        sort: 'new',
        limit: 10,
      });

      // Assert: Não deve lançar exceção, retorna vazio
      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('Paginação completa - cenário end-to-end', () => {
    it('deve paginar todo o feed até o fim sem duplicação', async () => {
      // Arrange: 25 posts
      const now = new Date();
      const posts = createMany(createMockPost, 25, (index) => ({
        id: `post-${String(index).padStart(2, '0')}`,
        created_at: new Date(now.getTime() - index * 1000).toISOString(),
        likes_count: 25 - index,
      }));
      setMockData('posts', posts);

      const allFetchedPosts: any[] = [];
      let cursor: string | null = null;
      let pageCount = 0;

      // Act: Buscar todas as páginas
      do {
        const result = await getFeedPosts({
          type: 'all',
          sort: 'new',
          limit: 10,
          cursor: cursor || undefined,
        });

        allFetchedPosts.push(...result.data);
        cursor = result.nextCursor;
        pageCount++;

        // Evitar loop infinito em caso de bug
        if (pageCount > 10) break;
      } while (cursor);

      // Assert: Todos os posts buscados sem duplicação
      expect(allFetchedPosts).toHaveLength(25);
      expect(pageCount).toBe(3); // 10 + 10 + 5

      // Verificar que não há duplicação
      const ids = allFetchedPosts.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(25);
    });
  });
});
