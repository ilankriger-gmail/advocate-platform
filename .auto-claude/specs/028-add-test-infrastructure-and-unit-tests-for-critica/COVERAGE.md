# Test Coverage Documentation

## Como Executar Testes com Cobertura

### Comandos Disponíveis

```bash
# Executar testes com relatório de cobertura
npm run test:coverage

# Executar apenas os testes
npm test

# Executar testes em modo watch (útil durante desenvolvimento)
npm run test:watch
```

## Configuração de Cobertura

### Thresholds Configurados

A configuração do Jest (`jest.config.js`) define limites mínimos de cobertura:

#### Global (70%)
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

#### Arquivos Críticos (80%)
Os seguintes arquivos contêm lógica de negócio crítica e exigem **>80% de cobertura**:

1. **src/actions/rewards.ts**
   - Funções: `claimReward`, `cancelClaim`, `addCoinsToUser`
   - Lógica: Transações de moedas, resgates de recompensas

2. **src/actions/challenges.ts**
   - Funções: `participateInChallenge`, `approveParticipation`, `rejectParticipation`
   - Lógica: Participação em desafios, aprovação/rejeição

3. **src/lib/supabase/rewards.ts**
   - Funções: `canClaimReward`, `getRewardsStats`
   - Lógica: Validação de elegibilidade, estatísticas de recompensas

4. **src/lib/utils.ts**
   - Funções utilitárias: formatação de datas, strings, números, validações
   - Lógica: Transformações de dados, validações

## Relatórios de Cobertura

### Formatos Gerados

O comando `npm run test:coverage` gera múltiplos formatos de relatório:

1. **Console (text)**
   - Exibido diretamente no terminal
   - Mostra resumo de cobertura por arquivo

2. **HTML (html)**
   - Localização: `coverage/index.html`
   - Navegável no browser
   - Mostra linhas cobertas/não cobertas com destaque

3. **LCOV (lcov)**
   - Localização: `coverage/lcov.info`
   - Formato para integração com CI/CD
   - Compatível com ferramentas como Codecov, Coveralls

4. **JSON Summary (json-summary)**
   - Localização: `coverage/coverage-summary.json`
   - Formato machine-readable
   - Útil para scripts e automação

### Como Visualizar

#### Relatório HTML
```bash
# Após executar npm run test:coverage
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

#### Relatório Console
Exemplo de saída:

```
---------------------|---------|----------|---------|---------|-------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------|---------|----------|---------|---------|-------------------
All files            |   85.32 |    82.15 |   87.50 |   85.14 |
 actions             |   92.45 |    88.23 |   95.00 |   92.31 |
  challenges.ts      |   91.23 |    86.67 |   93.75 |   91.11 | 45,67,89
  rewards.ts         |   93.75 |    90.00 |   96.25 |   93.60 | 123,145
 lib                 |   88.76 |    85.42 |   90.32 |   88.54 |
  utils.ts           |   95.12 |    92.31 |   97.50 |   95.00 | 234,256
 lib/supabase        |   89.32 |    87.50 |   91.23 |   89.15 |
  rewards.ts         |   89.32 |    87.50 |   91.23 |   89.15 | 78,102
---------------------|---------|----------|---------|---------|-------------------
```

## Suites de Teste

### Arquivos de Teste Criados

1. **src/__tests__/lib/utils.test.ts**
   - ~155 testes
   - Cobertura: Formatação de datas, strings, números, validações
   - Funções testadas: formatDate, formatDateTime, formatRelativeTime, getInitials, truncate, slugify, isValidEmail, isValidUrl, formatPoints, formatCompactNumber

2. **src/__tests__/actions/rewards.test.ts**
   - ~50 testes
   - Cobertura: Sistema de recompensas e transações de moedas
   - Funções testadas: claimReward, cancelClaim, addCoinsToUser
   - Cenários: Validações, fluxos de sucesso, edge cases

3. **src/__tests__/actions/challenges.test.ts**
   - ~40 testes
   - Cobertura: Sistema de desafios e participações
   - Funções testadas: participateInChallenge, approveParticipation, rejectParticipation
   - Cenários: Validações, aprovações, rejeições, análise de IA

4. **src/__tests__/lib/supabase/rewards.test.ts**
   - ~40 testes
   - Cobertura: Queries e estatísticas de recompensas
   - Funções testadas: canClaimReward, getRewardsStats
   - Cenários: Elegibilidade, cálculos de estatísticas

5. **src/__tests__/helpers/index.test.ts**
   - ~15 testes
   - Cobertura: Funções auxiliares de teste
   - Funções testadas: setupAuthenticatedUser, setupAdminUser, resetMocks

### Total de Testes

- **Aproximadamente 300+ testes individuais**
- **6 arquivos de teste principais**
- **Infraestrutura completa de mocks e factories**

## Interpretação dos Resultados

### Métricas de Cobertura

1. **Statements (Declarações)**
   - Porcentagem de declarações executadas
   - Meta: >70% global, >80% arquivos críticos

2. **Branches (Ramificações)**
   - Porcentagem de branches (if/else, switch, ternary) executados
   - Meta: >70% global, >80% arquivos críticos

3. **Functions (Funções)**
   - Porcentagem de funções chamadas
   - Meta: >70% global, >80% arquivos críticos

4. **Lines (Linhas)**
   - Porcentagem de linhas executadas
   - Meta: >70% global, >80% arquivos críticos

### O que fazer se os thresholds falharem

Se o comando `npm run test:coverage` falhar com erro de threshold:

```bash
Jest: "global" coverage threshold for statements (70%) not met: 65%
```

**Ações:**
1. Identifique arquivos com baixa cobertura no relatório HTML
2. Adicione testes para cenários não cobertos
3. Verifique linhas não cobertas (Uncovered Line #s)
4. Priorize arquivos críticos (actions, lib/supabase)

## Boas Práticas

### Durante Desenvolvimento

1. **Execute testes em watch mode**
   ```bash
   npm run test:watch
   ```

2. **Verifique cobertura antes de commit**
   ```bash
   npm run test:coverage
   ```

3. **Revise relatório HTML para gaps**
   - Abra `coverage/index.html`
   - Clique nos arquivos
   - Identifique linhas vermelhas (não cobertas)

### Manutenção de Testes

1. **Mantenha >80% em arquivos críticos**
   - rewards.ts, challenges.ts sempre bem testados
   - Lógica financeira não pode ter bugs

2. **Teste edge cases**
   - Valores boundary (0, 1, máximo)
   - Casos de erro
   - Estados inválidos

3. **Isole testes**
   - Use `resetMocks()` em beforeEach
   - Não compartilhe estado entre testes
   - Cada teste deve ser independente

## Integração CI/CD

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Arquivos e Pastas de Cobertura

### Ignorados no Git

A pasta `coverage/` deve estar no `.gitignore`:

```gitignore
# Test coverage
coverage/
*.lcov
```

### Estrutura da Pasta Coverage

```
coverage/
├── index.html              # Página inicial do relatório HTML
├── lcov.info              # Dados LCOV para CI/CD
├── coverage-summary.json  # Resumo em JSON
└── [arquivos HTML por módulo]
```

## Troubleshooting

### Problema: Testes passam mas cobertura não é gerada

**Solução:**
```bash
# Limpe cache do Jest
npx jest --clearCache

# Execute novamente
npm run test:coverage
```

### Problema: Thresholds muito altos

**Solução:**
- Ajuste thresholds em `jest.config.js` se necessário
- Certifique-se que são realistas para o projeto
- Comece com 70% e aumente gradualmente

### Problema: Arquivos não relacionados aparecem no coverage

**Solução:**
- Verifique `collectCoverageFrom` em `jest.config.js`
- Adicione padrões de exclusão conforme necessário
- Exemplos: stories, mocks, type definitions

## Referências

- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [Istanbul Coverage Formats](https://github.com/istanbuljs/istanbuljs)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
