/**
 * Mock do cliente Supabase para testes
 *
 * Este mock simula as operações do Supabase client incluindo:
 * - Autenticação (auth.getUser)
 * - Queries (select, eq, single)
 * - Mutations (insert, update, delete)
 * - RPC functions
 */

type MockData = Record<string, any[]>;
type MockUser = { id: string; email: string; [key: string]: any } | null;

/**
 * Estado mock do Supabase
 */
class MockSupabaseState {
  private data: MockData = {};
  private user: MockUser = null;
  private rpcFunctions: Record<string, (...args: any[]) => any> = {};

  /**
   * Define o usuário autenticado para os testes
   */
  setUser(user: MockUser) {
    this.user = user;
  }

  /**
   * Obtém o usuário autenticado
   */
  getUser(): MockUser {
    return this.user;
  }

  /**
   * Define dados mock para uma tabela
   */
  setData(table: string, data: any[]) {
    this.data[table] = data;
  }

  /**
   * Obtém dados mock de uma tabela
   */
  getData(table: string): any[] {
    return this.data[table] || [];
  }

  /**
   * Adiciona um registro a uma tabela
   */
  addData(table: string, record: any) {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    this.data[table].push(record);
  }

  /**
   * Atualiza registros em uma tabela
   */
  updateData(table: string, predicate: (item: any) => boolean, updates: any) {
    if (!this.data[table]) return;
    this.data[table] = this.data[table].map(item =>
      predicate(item) ? { ...item, ...updates } : item
    );
  }

  /**
   * Remove registros de uma tabela
   */
  deleteData(table: string, predicate: (item: any) => boolean) {
    if (!this.data[table]) return;
    this.data[table] = this.data[table].filter(item => !predicate(item));
  }

  /**
   * Registra uma função RPC mock
   */
  setRpcFunction(name: string, fn: (...args: any[]) => any) {
    this.rpcFunctions[name] = fn;
  }

  /**
   * Executa uma função RPC mock
   */
  callRpc(name: string, params: any): any {
    if (this.rpcFunctions[name]) {
      return this.rpcFunctions[name](params);
    }
    return null;
  }

  /**
   * Reseta todo o estado mock
   */
  reset() {
    this.data = {};
    this.user = null;
    this.rpcFunctions = {};
  }
}

// Instância singleton do estado mock
export const mockSupabaseState = new MockSupabaseState();

/**
 * Query builder mock - simula operações de query do Supabase
 */
class MockQueryBuilder {
  private table: string;
  private selectedFields: string = '*';
  private filters: Array<{ field: string; operator: string; value: any }> = [];
  private orderBy: Array<{ field: string; ascending: boolean }> = [];
  private limitValue: number | null = null;
  private shouldReturnSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  /**
   * Mock do método select()
   */
  select(fields: string = '*') {
    this.selectedFields = fields;
    return this;
  }

  /**
   * Mock do método eq() - adiciona filtro de igualdade
   */
  eq(field: string, value: any) {
    this.filters.push({ field, operator: 'eq', value });
    return this;
  }

  /**
   * Mock do método lt() - adiciona filtro de menos que
   */
  lt(field: string, value: any) {
    this.filters.push({ field, operator: 'lt', value });
    return this;
  }

  /**
   * Mock do método gt() - adiciona filtro de maior que
   */
  gt(field: string, value: any) {
    this.filters.push({ field, operator: 'gt', value });
    return this;
  }

  /**
   * Mock do método or() - adiciona filtros OR complexos
   * Exemplo: 'likes_count.lt.5,and(likes_count.eq.5,id.lt.abc)'
   */
  or(condition: string) {
    this.filters.push({ field: '__or__', operator: 'or', value: condition });
    return this;
  }

  /**
   * Mock do método order() - ordena resultados
   */
  order(field: string, options?: { ascending?: boolean }) {
    this.orderBy.push({
      field,
      ascending: options?.ascending ?? true,
    });
    return this;
  }

  /**
   * Mock do método limit() - limita número de resultados
   */
  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  /**
   * Mock do método single() - marca para retornar um único resultado
   */
  single() {
    this.shouldReturnSingle = true;
    return this;
  }

  /**
   * Executa a query e retorna os resultados
   */
  async then(resolve: (value: any) => void) {
    let data = mockSupabaseState.getData(this.table);

    // Aplica filtros
    for (const filter of this.filters) {
      if (filter.operator === 'eq') {
        data = data.filter(item => item[filter.field] === filter.value);
      } else if (filter.operator === 'lt') {
        data = data.filter(item => item[filter.field] < filter.value);
      } else if (filter.operator === 'gt') {
        data = data.filter(item => item[filter.field] > filter.value);
      } else if (filter.operator === 'or') {
        // Parse condição OR complexa
        // Exemplo: 'likes_count.lt.5,and(likes_count.eq.5,id.lt.abc)'
        data = data.filter(item => this.evaluateOrCondition(item, filter.value));
      }
    }

    // Aplica ordenação
    if (this.orderBy.length > 0) {
      data = [...data].sort((a, b) => {
        for (const order of this.orderBy) {
          const aVal = a[order.field];
          const bVal = b[order.field];

          if (aVal === bVal) continue;

          const comparison = aVal < bVal ? -1 : 1;
          return order.ascending ? comparison : -comparison;
        }
        return 0;
      });
    }

    // Aplica limit
    if (this.limitValue !== null) {
      data = data.slice(0, this.limitValue);
    }

    // Se for single, retorna apenas um resultado
    if (this.shouldReturnSingle) {
      const result = data.length > 0 ? data[0] : null;
      return resolve({ data: result, error: result ? null : { message: 'No rows found' } });
    }

    // Retorna array de resultados
    return resolve({ data, error: null });
  }

  /**
   * Avalia condição OR complexa
   * Suporta: 'field.lt.value,and(field.eq.value,field2.lt.value2)'
   */
  private evaluateOrCondition(item: any, condition: string): boolean {
    // Split por vírgula no nível superior
    const parts = condition.split(',and(');

    if (parts.length === 1) {
      // Condição simples: 'likes_count.lt.5'
      return this.evaluateSimpleCondition(item, parts[0]);
    }

    // Condição OR: primeira parte OU segunda parte
    const firstCondition = parts[0];
    const secondCondition = parts[1].replace(')', '');

    const firstResult = this.evaluateSimpleCondition(item, firstCondition);
    if (firstResult) return true;

    // Segunda parte é um AND de condições
    const andParts = secondCondition.split(',');
    return andParts.every(part => this.evaluateSimpleCondition(item, part));
  }

  /**
   * Avalia condição simples: 'field.operator.value'
   */
  private evaluateSimpleCondition(item: any, condition: string): boolean {
    const [field, operator, value] = condition.split('.');
    const itemValue = item[field];

    switch (operator) {
      case 'eq':
        return itemValue == value;
      case 'lt':
        return itemValue < value;
      case 'gt':
        return itemValue > value;
      default:
        return false;
    }
  }
}

/**
 * Insert builder mock - simula operações de insert do Supabase
 */
class MockInsertBuilder {
  private table: string;
  private insertData: any;
  private shouldSelect: boolean = false;
  private shouldReturnSingle: boolean = false;

  constructor(table: string, data: any) {
    this.table = table;
    this.insertData = data;
  }

  /**
   * Mock do método select() após insert
   */
  select() {
    this.shouldSelect = true;
    return this;
  }

  /**
   * Mock do método single() após insert
   */
  single() {
    this.shouldReturnSingle = true;
    return this;
  }

  /**
   * Executa o insert e retorna o resultado
   */
  async then(resolve: (value: any) => void) {
    // Gera ID se não existir
    const newRecord = {
      id: this.insertData.id || `mock-id-${Date.now()}`,
      ...this.insertData,
      created_at: this.insertData.created_at || new Date().toISOString(),
    };

    // Adiciona aos dados mock
    mockSupabaseState.addData(this.table, newRecord);

    if (this.shouldSelect) {
      const result = this.shouldReturnSingle ? newRecord : [newRecord];
      return resolve({ data: result, error: null });
    }

    return resolve({ data: null, error: null });
  }
}

/**
 * Update builder mock - simula operações de update do Supabase
 */
class MockUpdateBuilder {
  private table: string;
  private updateData: any;
  private filters: Array<{ field: string; value: any }> = [];

  constructor(table: string, data: any) {
    this.table = table;
    this.updateData = data;
  }

  /**
   * Mock do método eq() após update
   */
  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  /**
   * Executa o update
   */
  async then(resolve: (value: any) => void) {
    // Cria predicado baseado nos filtros
    const predicate = (item: any) => {
      return this.filters.every(filter => item[filter.field] === filter.value);
    };

    // Atualiza os dados
    mockSupabaseState.updateData(this.table, predicate, this.updateData);

    return resolve({ data: null, error: null });
  }
}

/**
 * Delete builder mock - simula operações de delete do Supabase
 */
class MockDeleteBuilder {
  private table: string;
  private filters: Array<{ field: string; value: any }> = [];

  constructor(table: string) {
    this.table = table;
  }

  /**
   * Mock do método eq() após delete
   */
  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  /**
   * Executa o delete
   */
  async then(resolve: (value: any) => void) {
    // Cria predicado baseado nos filtros
    const predicate = (item: any) => {
      return this.filters.every(filter => item[filter.field] === filter.value);
    };

    // Remove os dados
    mockSupabaseState.deleteData(this.table, predicate);

    return resolve({ data: null, error: null });
  }
}

/**
 * Mock do cliente Supabase
 */
export const createMockSupabaseClient = () => {
  return {
    /**
     * Mock de autenticação
     */
    auth: {
      /**
       * Mock do método getUser()
       */
      getUser: jest.fn(async () => {
        const user = mockSupabaseState.getUser();
        return {
          data: { user },
          error: user ? null : { message: 'Not authenticated' },
        };
      }),
    },

    /**
     * Mock do método from() - inicia uma query em uma tabela
     */
    from: jest.fn((table: string) => {
      return {
        select: jest.fn((fields?: string) => new MockQueryBuilder(table).select(fields)),
        insert: jest.fn((data: any) => new MockInsertBuilder(table, data)),
        update: jest.fn((data: any) => new MockUpdateBuilder(table, data)),
        delete: jest.fn(() => new MockDeleteBuilder(table)),
      };
    }),

    /**
     * Mock do método rpc() - chama funções RPC
     */
    rpc: jest.fn(async (functionName: string, params?: any) => {
      const result = mockSupabaseState.callRpc(functionName, params);
      return { data: result, error: null };
    }),
  };
};

/**
 * Mock da função createClient do Supabase
 */
export const mockCreateClient = jest.fn(() => {
  return Promise.resolve(createMockSupabaseClient());
});

/**
 * Helper para resetar todos os mocks do Supabase
 */
export const resetSupabaseMocks = () => {
  mockSupabaseState.reset();
  jest.clearAllMocks();
};

/**
 * Helper para configurar um usuário autenticado nos testes
 */
export const setMockUser = (user: MockUser) => {
  mockSupabaseState.setUser(user);
};

/**
 * Helper para configurar dados mock em uma tabela
 */
export const setMockData = (table: string, data: any[]) => {
  mockSupabaseState.setData(table, data);
};

/**
 * Helper para adicionar um registro a uma tabela mock
 */
export const addMockData = (table: string, record: any) => {
  mockSupabaseState.addData(table, record);
};

/**
 * Helper para configurar uma função RPC mock
 */
export const setMockRpcFunction = (name: string, fn: (...args: any[]) => any) => {
  mockSupabaseState.setRpcFunction(name, fn);
};

/**
 * Helper para obter dados mock de uma tabela
 */
export const getMockData = (table: string): any[] => {
  return mockSupabaseState.getData(table);
};
