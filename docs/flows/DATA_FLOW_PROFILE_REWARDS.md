# 👤 Fluxo de Perfil e Recompensas

Este documento detalha todos os fluxos relacionados à gestão de perfil, sistema de níveis de advocate, resgate de recompensas e histórico de participações da plataforma NextLOVERS.

## Índice

1. [Visão Geral](#visão-geral)
2. [Gestão de Perfil](#gestão-de-perfil)
3. [Sistema de Níveis de Advocate](#sistema-de-níveis-de-advocate)
4. [Resgate de Recompensas](#resgate-de-recompensas)
5. [Histórico de Participações](#histórico-de-participações)
6. [Fluxo Admin - Gestão de Recompensas](#fluxo-admin---gestão-de-recompensas)
7. [Fluxo Completo de Dados](#fluxo-completo-de-dados)
8. [Arquivos Relacionados](#arquivos-relacionados)

---

## Visão Geral

O sistema de perfil e recompensas gerencia as informações dos usuários, progresso no programa de advocates, saldo de moedas virtuais (corações ❤️) e resgate de prêmios. O sistema integra dados de diversas fontes (posts, eventos, desafios) para construir o histórico completo de participações do usuário.

### Características Principais

- 👤 **Perfil Customizável**: Nome, bio, avatar, links sociais
- 📊 **Estatísticas Integradas**: Posts, likes, eventos, desafios
- 🏆 **Níveis de Advocate**: Sistema de progressão baseado em engajamento
- 💰 **Moedas Virtuais**: Sistema de corações para recompensas
- 🎁 **Resgate de Prêmios**: Marketplace de recompensas
- 📜 **Histórico Completo**: Timeline de todas as participações
- 🔒 **Segurança**: RLS protege dados pessoais

### Arquitetura Geral

```mermaid
graph TB
    subgraph "Client Layer"
        A[🖥️ PerfilPage<br/>Server Component]
        B[📝 EditProfileForm<br/>Client Component]
        C[🎁 PremiosPage<br/>Server Component]
        D[📊 StatsCards<br/>Client Component]
    end

    subgraph "Server Actions"
        E[👤 updateProfile]
        F[📊 getCurrentProfile]
        G[📈 getProfileStats]
        H[🎁 claimReward]
        I[❌ cancelClaim]
        J[➕ createReward<br/>Admin]
        K[✅ approveClaim<br/>Admin]
        L[🚚 markClaimShipped<br/>Admin]
    end

    subgraph "Server Components"
        M[📄 Profile Page<br/>Server Component]
        N[🎁 Premios Page<br/>Server Component]
        O[👨‍💼 Admin Premios<br/>Server Component]
    end

    subgraph "Supabase"
        P[(👥 users)]
        Q[(💰 user_coins)]
        R[(📝 coin_transactions)]
        S[(🎁 rewards)]
        T[(🏆 reward_claims)]
        U[(📄 posts)]
        V[(📅 event_registrations)]
        W[(🎯 challenge_participants)]
        X[🛡️ RLS Policies]
    end

    A -->|render| B
    A -->|fetch data| P
    A -->|fetch stats| U
    A -->|fetch coins| Q

    B -->|call| E
    E -->|update| P

    F -->|query| P
    G -->|aggregate| U

    C -->|fetch| S
    C -->|fetch| T

    H -->|insert| T
    H -->|update| Q
    H -->|insert| R
    H -->|decrement stock| S

    I -->|update| T
    I -->|refund| Q
    I -->|insert| R

    X -->|protect| P
    X -->|protect| Q
    X -->|protect| T

    style A fill:#e3f2fd
    style B fill:#fff3e0
    style E fill:#f3e5f5
    style H fill:#e8f5e9
```

---

## Gestão de Perfil

O usuário pode visualizar e editar seu perfil, incluindo informações pessoais, links de redes sociais e bio.

### Arquitetura de Perfil

```mermaid
graph TB
    subgraph "Profile Views"
        A[🖥️ /perfil<br/>View Profile]
        B[✏️ /perfil/editar<br/>Edit Profile]
        C[👁️ /usuarios/[id]<br/>Public Profile]
    end

    subgraph "Profile Data"
        D[👤 Basic Info<br/>name, email, avatar]
        E[📱 Social Links<br/>instagram, tiktok, youtube]
        F[📝 Bio<br/>description]
        G[🏷️ Metadata<br/>role, is_creator, level]
    end

    subgraph "Stats Aggregation"
        H[📄 Posts Stats<br/>total, approved, likes]
        I[📅 Events Stats<br/>registered, attended]
        J[🎯 Challenges Stats<br/>participated, won]
        K[💰 Coins Balance<br/>earned, spent]
    end

    A -->|display| D
    A -->|display| E
    A -->|display| F
    A -->|display| G

    B -->|update| D
    B -->|update| E
    B -->|update| F

    A -->|aggregate| H
    A -->|aggregate| I
    A -->|aggregate| J
    A -->|aggregate| K

    C -->|public view| D
    C -->|public view| E
    C -->|public view| F

    style A fill:#e3f2fd
    style B fill:#fff3e0
    style H fill:#e8f5e9
    style K fill:#f3e5f5
```

### Fluxo de Visualização de Perfil

```mermaid
sequenceDiagram
    actor User
    participant Page as PerfilPage<br/>(Server Component)
    participant Auth as Supabase Auth
    participant DB as Supabase DB
    participant Stats as Stats Aggregator

    User->>Page: Acessa /perfil
    Page->>Auth: getUser()
    Auth-->>Page: user session

    par Fetch Profile Data
        Page->>DB: SELECT * FROM users WHERE id = user.id
        DB-->>Page: profile data
    and Fetch Coins Balance
        Page->>DB: SELECT balance FROM user_coins WHERE user_id = user.id
        DB-->>Page: coins balance
    and Fetch Stats
        Page->>Stats: getUserStats(user.id)
        Stats->>DB: SELECT posts, likes, events, challenges
        DB-->>Stats: aggregated data
        Stats-->>Page: stats object
    end

    Page-->>User: 🖥️ Renderiza perfil com todos os dados

    Note over Page,DB: Server Component<br/>Fetch paralelo<br/>Dados já renderizados
```

### Fluxo de Edição de Perfil

```mermaid
sequenceDiagram
    actor User
    participant Form as EditProfileForm<br/>(Client Component)
    participant Action as updateProfile<br/>(Server Action)
    participant DB as Supabase DB
    participant Cache as Next.js Cache

    User->>Form: Preenche formulário
    User->>Form: Clica "Salvar"

    Form->>Form: ✅ Validação client-side

    Form->>Action: updateProfile(data)

    Action->>DB: getUser() para verificar sessão
    DB-->>Action: user session

    alt Usuário autenticado
        Action->>DB: UPDATE users SET {data} WHERE id = user.id

        alt Update bem-sucedido
            DB-->>Action: success
            Action->>Cache: revalidatePath('/perfil')
            Action->>Cache: revalidatePath('/dashboard')
            Action-->>Form: { success: true }
            Form-->>User: ✅ Perfil atualizado com sucesso
        else Erro no update
            DB-->>Action: error
            Action-->>Form: { error: 'Erro ao atualizar perfil' }
            Form-->>User: ❌ Mensagem de erro
        end
    else Não autenticado
        Action-->>Form: { error: 'Usuario nao autenticado' }
        Form-->>User: ❌ Redireciona para login
    end

    Note over Action,DB: RLS Policy verifica:<br/>auth.uid() = id
```

### Código: Server Action updateProfile

```typescript
// src/actions/profile.ts
'use server';

export async function updateProfile(data: UpdateProfileData): Promise<ActionResponse> {
  const supabase = await createClient();

  // 1. Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuario nao autenticado' };
  }

  // 2. Atualizar perfil (RLS protege)
  const { error } = await supabase
    .from('users')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { error: 'Erro ao atualizar perfil' };
  }

  // 3. Revalidar cache
  revalidatePath('/perfil');
  revalidatePath('/dashboard');

  return { success: true };
}
```

### Campos do Perfil

```mermaid
graph LR
    subgraph "Dados Pessoais"
        A[full_name]
        B[avatar_url]
        C[bio]
    end

    subgraph "Redes Sociais"
        D[instagram_handle]
        E[tiktok_handle]
        F[youtube_handle]
        G[twitter_handle]
        H[website_url]
    end

    subgraph "Metadata Sistema"
        I[role: creator/fan]
        J[is_creator: boolean]
        K[advocate_level: 1-5]
        L[created_at]
        M[updated_at]
    end

    subgraph "Perfil Público"
        N[👁️ Public View]
    end

    A --> N
    B --> N
    C --> N
    D --> N
    E --> N
    F --> N

    style A fill:#e3f2fd
    style I fill:#fff3e0
    style N fill:#e8f5e9
```

---

## Sistema de Níveis de Advocate

O sistema de níveis incentiva o engajamento progressivo dos usuários através de 5 níveis de advocate.

### Níveis de Advocate

```mermaid
graph LR
    A[🌱 Nível 1<br/>INICIANTE] -->|Engajamento| B[🌿 Nível 2<br/>ATIVO]
    B -->|Mais Engajamento| C[⭐ Nível 3<br/>ENGAJADO]
    C -->|Alto Engajamento| D[💎 Nível 4<br/>SUPER ADVOCATE]
    D -->|Máximo Engajamento| E[👑 Nível 5<br/>ELITE]

    style A fill:#e8f5e9
    style B fill:#c8e6c9
    style C fill:#81c784
    style D fill:#4caf50
    style E fill:#2e7d32,color:#fff
```

### Critérios de Progressão

```mermaid
flowchart TB
    Start[👤 Novo Usuário<br/>Nível 1] -->|Cria conta| Level1

    Level1[🌱 Nível 1 - INICIANTE<br/>0-99 pontos] --> Check1{Pontos ≥ 100?}
    Check1 -->|Não| Level1
    Check1 -->|Sim| Level2

    Level2[🌿 Nível 2 - ATIVO<br/>100-299 pontos] --> Check2{Pontos ≥ 300?}
    Check2 -->|Não| Level2
    Check2 -->|Sim| Level3

    Level3[⭐ Nível 3 - ENGAJADO<br/>300-599 pontos] --> Check3{Pontos ≥ 600?}
    Check3 -->|Não| Level3
    Check3 -->|Sim| Level4

    Level4[💎 Nível 4 - SUPER ADVOCATE<br/>600-999 pontos] --> Check4{Pontos ≥ 1000?}
    Check4 -->|Não| Level4
    Check4 -->|Sim| Level5

    Level5[👑 Nível 5 - ELITE<br/>1000+ pontos] --> Elite[🎯 Acesso a eventos<br/>e recompensas exclusivas]

    style Level1 fill:#e8f5e9
    style Level2 fill:#c8e6c9
    style Level3 fill:#81c784
    style Level4 fill:#4caf50
    style Level5 fill:#2e7d32,color:#fff
    style Elite fill:#f3e5f5
```

### Tabela de Pontuação

| Ação | Pontos | Moedas (❤️) |
|------|--------|-------------|
| Post aprovado | 10 pontos | 5 ❤️ |
| Like recebido | 1 ponto | - |
| Comentário | 2 pontos | - |
| Participação em evento | 20 pontos | 10 ❤️ |
| Desafio físico concluído | 50 pontos | 20-100 ❤️ |
| Desafio engajamento | 15 pontos | 10 ❤️ |
| Check-in em evento | 10 pontos | 5 ❤️ |

### Benefícios por Nível

```mermaid
graph TB
    subgraph "Nível 1 - INICIANTE"
        A1[✅ Criar posts]
        A2[✅ Participar de eventos públicos]
        A3[✅ Comentar e curtir]
    end

    subgraph "Nível 2 - ATIVO"
        B1[✅ Tudo do Nível 1]
        B2[🆕 Participar de desafios físicos]
        B3[🆕 Eventos nível 2]
    end

    subgraph "Nível 3 - ENGAJADO"
        C1[✅ Tudo do Nível 2]
        C2[🆕 Recompensas exclusivas]
        C3[🆕 Eventos nível 3]
        C4[🆕 Badge no perfil]
    end

    subgraph "Nível 4 - SUPER ADVOCATE"
        D1[✅ Tudo do Nível 3]
        D2[🆕 Eventos VIP]
        D3[🆕 Prêmios premium]
        D4[🆕 Destaque no feed]
    end

    subgraph "Nível 5 - ELITE"
        E1[✅ Tudo do Nível 4]
        E2[🆕 Eventos exclusivos]
        E3[🆕 Prêmios de alto valor]
        E4[🆕 Programa de embaixadores]
        E5[🆕 Acesso antecipado]
    end

    style A1 fill:#e8f5e9
    style B1 fill:#c8e6c9
    style C1 fill:#81c784
    style D1 fill:#4caf50
    style E1 fill:#2e7d32,color:#fff
```

### Validação de Nível em Eventos

```mermaid
sequenceDiagram
    actor User
    participant Page as EventPage
    participant Action as registerForEvent
    participant DB as Supabase DB

    User->>Page: Clica "Participar"
    Page->>Action: registerForEvent(eventId)

    Action->>DB: SELECT * FROM events WHERE id = eventId
    DB-->>Action: event data (required_level: 3)

    Action->>DB: SELECT advocate_level FROM users WHERE id = user.id
    DB-->>Action: user data (advocate_level: 2)

    alt user.level >= event.required_level
        Action->>DB: INSERT INTO event_registrations
        Action-->>Page: { success: true }
        Page-->>User: ✅ Inscrito com sucesso!
    else user.level < event.required_level
        Action-->>Page: { error: 'Nivel minimo requerido: 3' }
        Page-->>User: ❌ Você precisa ser nível 3<br/>Seu nível atual: 2
    end

    Note over Action,DB: Sistema previne inscrição<br/>em eventos acima do nível
```

### Código: Verificação de Nível

```typescript
// src/actions/events.ts - registerForEvent()

// Verificar nivel do usuario
const { data: userProfile } = await supabase
  .from('users')
  .select('advocate_level')
  .eq('id', user.id)
  .single();

if (userProfile && event.required_level > (userProfile.advocate_level || 1)) {
  return { error: `Nivel minimo requerido: ${event.required_level}` };
}
```

---

## Resgate de Recompensas

Os usuários podem resgatar prêmios físicos e digitais usando seu saldo de moedas (corações ❤️).

### Arquitetura de Recompensas

```mermaid
graph TB
    subgraph "User Flow"
        A[🎁 Browse Rewards<br/>PremiosPage]
        B[💰 Check Balance<br/>user_coins]
        C[🛒 Click Resgatar]
        D[✅ Confirm Purchase]
    end

    subgraph "Server Action"
        E[🎁 claimReward<br/>Server Action]
    end

    subgraph "Validations"
        F{Reward Active?}
        G{Stock Available?}
        H{Balance Sufficient?}
    end

    subgraph "Transaction"
        I[📝 Create Claim<br/>reward_claims]
        J[💸 Deduct Coins<br/>user_coins]
        K[📋 Record Transaction<br/>coin_transactions]
        L[📦 Update Stock<br/>rewards]
    end

    subgraph "Admin"
        M[👨‍💼 Admin Reviews]
        N[✅ Approve Claim]
        O[🚚 Mark Shipped]
        P[📬 Mark Delivered]
    end

    A --> B --> C --> D --> E
    E --> F --> G --> H
    H -->|All Pass| I --> J --> K --> L
    H -->|Fail| Z[❌ Error Message]

    I --> M
    M --> N --> O --> P

    style A fill:#e3f2fd
    style E fill:#f3e5f5
    style I fill:#e8f5e9
    style M fill:#fff3e0
```

### Fluxo Completo de Resgate

```mermaid
sequenceDiagram
    actor User
    participant Page as PremiosPage
    participant Action as claimReward
    participant DB as Supabase DB
    participant Coins as user_coins
    participant Trans as coin_transactions

    User->>Page: Visualiza prêmios disponíveis
    Page->>DB: SELECT * FROM rewards WHERE is_active = true
    DB-->>Page: lista de rewards

    Page->>Coins: SELECT balance FROM user_coins
    Coins-->>Page: balance: 150 ❤️

    Page-->>User: 🎁 Exibe prêmios (destaca os acessíveis)

    User->>Page: Clica "Resgatar" (custo: 100 ❤️)
    Page->>Action: claimReward(rewardId)

    rect rgb(240, 240, 255)
    Note over Action,Trans: VALIDAÇÕES

    Action->>DB: SELECT * FROM rewards WHERE id = rewardId
    DB-->>Action: reward (coins_required: 100, stock: 5)

    alt Reward não encontrada
        Action-->>Page: { error: 'Recompensa nao encontrada' }
    end

    alt Stock esgotado
        Action-->>Page: { error: 'Estoque esgotado' }
    end

    Action->>Coins: SELECT balance WHERE user_id = user.id
    Coins-->>Action: balance: 150

    alt Saldo insuficiente
        Action-->>Page: { error: 'Saldo insuficiente' }
    end
    end

    rect rgb(240, 255, 240)
    Note over Action,Trans: TRANSAÇÃO

    Action->>DB: INSERT INTO reward_claims (user_id, reward_id, status: 'pending')
    DB-->>Action: claim created (id: xxx)

    Action->>Coins: UPDATE user_coins SET balance = 50 WHERE user_id = user.id

    alt Erro ao deduzir saldo
        Action->>DB: DELETE FROM reward_claims WHERE id = xxx (ROLLBACK)
        Action-->>Page: { error: 'Erro ao deduzir saldo' }
    end

    Coins-->>Action: success

    Action->>Trans: INSERT INTO coin_transactions (amount: -100, type: 'spent')
    Trans-->>Action: transaction logged

    Action->>DB: UPDATE rewards SET quantity_available = 4
    DB-->>Action: stock updated
    end

    Action-->>Page: { success: true, data: claim }
    Page-->>User: ✅ Resgate realizado com sucesso!<br/>Novo saldo: 50 ❤️

    Note over Action,Trans: Se qualquer etapa falhar,<br/>rollback é executado
```

### Estados de um Resgate

```mermaid
stateDiagram-v2
    [*] --> pending: Resgate Criado
    pending --> approved: Admin Aprova
    pending --> cancelled: User Cancela
    approved --> shipped: Admin Marca como Enviado
    shipped --> delivered: Admin Marca como Entregue
    delivered --> [*]: Fluxo Completo
    cancelled --> [*]: Moedas Devolvidas

    note right of pending
        Status inicial
        Aguardando aprovação admin
        Moedas já deduzidas
        User pode cancelar
    end note

    note right of approved
        Admin verificou dados
        Prêmio será enviado
        User não pode mais cancelar
    end note

    note right of shipped
        Prêmio despachado
        Código de rastreio (opcional)
        User aguarda entrega
    end note

    note right of delivered
        Prêmio entregue
        Fluxo concluído
        Feedback opcional
    end note

    note right of cancelled
        Resgate cancelado por user
        Moedas devolvidas ao saldo
        Estoque incrementado
    end note
```

### Código: Server Action claimReward

```typescript
// src/actions/rewards.ts
'use server';

export async function claimReward(rewardId: string): Promise<ActionResponse> {
  const supabase = await createClient();

  // 1. Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Usuario nao autenticado' };

  // 2. Buscar recompensa
  const { data: reward } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .eq('is_active', true)
    .single();

  if (!reward) return { error: 'Recompensa nao encontrada' };
  if (reward.quantity_available <= 0) return { error: 'Estoque esgotado' };

  // 3. Verificar saldo
  const { data: userCoins } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  if (!userCoins || userCoins.balance < reward.coins_required) {
    return { error: 'Saldo insuficiente' };
  }

  // 4. Criar resgate
  const { data: claim, error: claimError } = await supabase
    .from('reward_claims')
    .insert({
      user_id: user.id,
      reward_id: rewardId,
      status: 'pending',
      coins_spent: reward.coins_required,
    })
    .select()
    .single();

  if (claimError) return { error: 'Erro ao criar resgate' };

  // 5. Deduzir moedas
  const { error: balanceError } = await supabase
    .from('user_coins')
    .update({
      balance: userCoins.balance - reward.coins_required,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (balanceError) {
    // ROLLBACK: Deletar resgate
    await supabase.from('reward_claims').delete().eq('id', claim.id);
    return { error: 'Erro ao deduzir saldo' };
  }

  // 6. Registrar transação
  await supabase.from('coin_transactions').insert({
    user_id: user.id,
    amount: -reward.coins_required,
    type: 'spent',
    description: `Resgate: ${reward.name}`,
    reference_id: claim.id,
  });

  // 7. Decrementar estoque
  await supabase
    .from('rewards')
    .update({ quantity_available: reward.quantity_available - 1 })
    .eq('id', rewardId);

  // 8. Revalidar cache
  revalidatePath('/premios');
  revalidatePath('/dashboard');

  return { success: true, data: claim };
}
```

### Fluxo de Cancelamento de Resgate

```mermaid
sequenceDiagram
    actor User
    participant Page as MeusResgatesPage
    participant Action as cancelClaim
    participant DB as reward_claims
    participant Coins as user_coins
    participant Trans as coin_transactions
    participant Stock as rewards

    User->>Page: Clica "Cancelar" em resgate pendente
    Page->>Action: cancelClaim(claimId)

    Action->>DB: SELECT * FROM reward_claims WHERE id = claimId AND status = 'pending'

    alt Resgate não encontrado ou status != 'pending'
        DB-->>Action: null
        Action-->>Page: { error: 'Resgate nao pode ser cancelado' }
        Page-->>User: ❌ Apenas resgates pendentes podem ser cancelados
    else Resgate pendente encontrado
        DB-->>Action: claim (coins_spent: 100, reward_id: xxx)

        rect rgb(240, 255, 240)
        Note over Action,Stock: ESTORNO

        Action->>DB: UPDATE reward_claims SET status = 'cancelled'
        DB-->>Action: success

        Action->>Coins: SELECT balance WHERE user_id = user.id
        Coins-->>Action: current balance: 50

        Action->>Coins: UPDATE SET balance = 150
        Coins-->>Action: balance updated

        Action->>Trans: INSERT INTO coin_transactions (amount: +100, type: 'earned')
        Trans-->>Action: refund logged

        Action->>Stock: RPC increment_reward_stock(reward_id)
        Stock-->>Action: stock incremented
        end

        Action-->>Page: { success: true }
        Page-->>User: ✅ Resgate cancelado<br/>Moedas devolvidas: 100 ❤️
    end

    Note over Action,Stock: Apenas resgates com<br/>status 'pending' podem<br/>ser cancelados
```

### Tipos de Recompensas

```mermaid
graph TB
    subgraph "Digital Rewards"
        A[🎮 Códigos de jogos]
        B[🎬 Vouchers streaming]
        C[📱 Apps premium]
        D[📚 E-books exclusivos]
    end

    subgraph "Physical Rewards"
        E[👕 Camisetas]
        F[📦 Produtos da marca]
        G[🎁 Kits exclusivos]
        H[🏆 Troféus personalizados]
    end

    subgraph "Entrega"
        I[📧 Email instantâneo<br/>Digital]
        J[📮 Correios<br/>Physical]
    end

    A --> I
    B --> I
    C --> I
    D --> I

    E --> J
    F --> J
    G --> J
    H --> J

    style A fill:#e3f2fd
    style E fill:#fff3e0
    style I fill:#e8f5e9
    style J fill:#f3e5f5
```

---

## Histórico de Participações

O histórico consolida todas as atividades do usuário na plataforma em uma timeline unificada.

### Fontes de Dados

```mermaid
graph TB
    subgraph "Atividades do Usuário"
        A[📄 Posts<br/>created, approved, rejected]
        B[❤️ Likes<br/>given, received]
        C[💬 Comments<br/>authored]
        D[📅 Events<br/>registered, attended]
        E[🎯 Challenges<br/>participated, won]
        F[🎁 Rewards<br/>claimed, received]
        G[💰 Coins<br/>earned, spent]
    end

    subgraph "Timeline Consolidada"
        H[📜 Activity Feed<br/>Ordenada por data]
    end

    subgraph "Visualizações"
        I[📊 Dashboard Stats]
        J[👤 Profile Page]
        K[📈 Progress Report]
    end

    A --> H
    B --> H
    C --> H
    D --> H
    E --> H
    F --> H
    G --> H

    H --> I
    H --> J
    H --> K

    style A fill:#e3f2fd
    style D fill:#fff3e0
    style E fill:#e8f5e9
    style H fill:#f3e5f5
```

### Estrutura do Histórico

```mermaid
graph LR
    subgraph "Activity Types"
        A[post_created]
        B[post_approved]
        C[event_registered]
        D[event_attended]
        E[challenge_completed]
        F[reward_claimed]
        G[coins_earned]
        H[coins_spent]
        I[level_up]
    end

    subgraph "Activity Entry"
        J[timestamp]
        K[activity_type]
        L[description]
        M[metadata JSON]
        N[coins_change]
        O[points_change]
    end

    A --> J
    B --> J
    C --> J

    A --> K
    B --> K
    C --> K

    J --> P[📜 Timeline UI]
    K --> P
    L --> P

    style A fill:#e3f2fd
    style J fill:#e8f5e9
    style P fill:#f3e5f5
```

### Timeline Visual

```mermaid
gantt
    title Exemplo de Timeline de Participações de um Advocate
    dateFormat YYYY-MM-DD
    section Posts
    Criou primeiro post               :done, 2024-01-05, 1d
    Post aprovado (+5❤️)              :done, 2024-01-06, 1d
    Criou segundo post                :done, 2024-01-10, 1d
    section Eventos
    Inscrito em Workshop              :done, 2024-01-12, 1d
    Check-in Workshop (+10❤️)         :active, 2024-01-15, 1d
    section Desafios
    Participou desafio físico         :done, 2024-01-18, 1d
    Desafio aprovado (+50❤️)          :done, 2024-01-20, 1d
    section Recompensas
    Resgatou camiseta (-100❤️)        :done, 2024-01-22, 1d
    section Níveis
    Subiu para Nível 2                :milestone, 2024-01-23, 0d
```

### Agregação de Estatísticas

```mermaid
flowchart TB
    Start[👤 User Profile] --> Fetch[🔍 Fetch All Activities]

    Fetch --> Posts[📄 Query Posts]
    Fetch --> Events[📅 Query Events]
    Fetch --> Challenges[🎯 Query Challenges]
    Fetch --> Coins[💰 Query Coins]

    Posts --> AggPosts[📊 Aggregate:<br/>total, approved, likes]
    Events --> AggEvents[📊 Aggregate:<br/>registered, attended]
    Challenges --> AggChallenges[📊 Aggregate:<br/>participated, won, ranking]
    Coins --> AggCoins[📊 Aggregate:<br/>balance, earned, spent]

    AggPosts --> Combine[🔄 Combine Stats]
    AggEvents --> Combine
    AggChallenges --> Combine
    AggCoins --> Combine

    Combine --> Points[🎯 Calculate Total Points]
    Points --> Level[🏆 Determine Level]
    Level --> Badges[🏅 Assign Badges]

    Badges --> Display[🖥️ Display Profile with Stats]

    style Fetch fill:#e3f2fd
    style Combine fill:#e8f5e9
    style Display fill:#f3e5f5
```

### Código: Agregação de Stats

```typescript
// src/lib/supabase/queries.ts

export async function getUserStats(userId: string) {
  const supabase = await createClient();

  // Buscar posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, status, likes_count')
    .eq('user_id', userId);

  const allPosts = posts || [];
  const approvedPosts = allPosts.filter((p) => p.status === 'approved');
  const totalLikes = approvedPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

  // Buscar eventos
  const { data: events } = await supabase
    .from('event_registrations')
    .select('status')
    .eq('user_id', userId);

  const totalEvents = events?.length || 0;
  const attendedEvents = events?.filter(e => e.status === 'attended').length || 0;

  // Buscar desafios
  const { data: challenges } = await supabase
    .from('challenge_participants')
    .select('status')
    .eq('user_id', userId);

  const totalChallenges = challenges?.length || 0;
  const approvedChallenges = challenges?.filter(c => c.status === 'approved').length || 0;

  // Buscar moedas
  const { data: coins } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('amount, type')
    .eq('user_id', userId);

  const totalEarned = transactions?.filter(t => t.type === 'earned')
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalSpent = transactions?.filter(t => t.type === 'spent')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

  return {
    posts: {
      total: allPosts.length,
      approved: approvedPosts.length,
      total_likes: totalLikes,
    },
    events: {
      registered: totalEvents,
      attended: attendedEvents,
    },
    challenges: {
      participated: totalChallenges,
      approved: approvedChallenges,
    },
    coins: {
      balance: coins?.balance || 0,
      earned: totalEarned,
      spent: totalSpent,
    },
  };
}
```

### Exibição no Perfil

```mermaid
graph TB
    subgraph "Profile Page Layout"
        A[👤 Avatar & Name]
        B[🏆 Level Badge]
        C[💰 Coins Balance]

        D[📊 Stats Card]
        E[📜 Activity Timeline]
        F[🏅 Badges & Achievements]
    end

    subgraph "Stats Card"
        G[📄 Posts: 25 total, 20 approved]
        H[❤️ Likes: 340 received]
        I[📅 Eventos: 8 attended]
        J[🎯 Desafios: 5 completed]
    end

    subgraph "Activity Timeline"
        K[📅 Last 30 days]
        L[Filtros: Posts, Eventos, Desafios]
        M[Lista cronológica com ícones]
    end

    D --> G
    D --> H
    D --> I
    D --> J

    E --> K
    E --> L
    E --> M

    style A fill:#e3f2fd
    style D fill:#e8f5e9
    style E fill:#fff3e0
```

---

## Fluxo Admin - Gestão de Recompensas

Admins gerenciam o catálogo de recompensas e aprovam resgates.

### Painel Admin de Recompensas

```mermaid
graph TB
    subgraph "Admin Views"
        A[📋 Lista de Recompensas]
        B[➕ Criar Nova Recompensa]
        C[📊 Resgates Pendentes]
        D[📦 Resgates em Envio]
        E[✅ Resgates Finalizados]
    end

    subgraph "Actions"
        F[✏️ Editar Recompensa]
        G[🔄 Ativar/Desativar]
        H[📦 Ajustar Estoque]
        I[✅ Aprovar Resgate]
        J[🚚 Marcar como Enviado]
        K[📬 Marcar como Entregue]
    end

    A --> F
    A --> G
    A --> H

    C --> I
    D --> J
    E --> K

    style A fill:#e3f2fd
    style I fill:#e8f5e9
    style C fill:#fff3e0
```

### Fluxo Admin: Criar Recompensa

```mermaid
sequenceDiagram
    actor Admin
    participant Form as CreateRewardForm
    participant Action as createReward
    participant DB as Supabase DB
    participant Cache as Next.js Cache

    Admin->>Form: Preenche formulário
    Note over Form: name, description, image_url<br/>coins_cost, stock, type (digital/physical)

    Admin->>Form: Clica "Criar"
    Form->>Action: createReward(data)

    Action->>DB: SELECT role FROM users WHERE id = admin.id

    alt Admin autorizado
        DB-->>Action: role: 'admin' ou is_creator: true

        Action->>DB: INSERT INTO rewards {data}
        DB-->>Action: reward created

        Action->>Cache: revalidatePath('/premios')
        Action->>Cache: revalidatePath('/admin/premios')

        Action-->>Form: { success: true, data: reward }
        Form-->>Admin: ✅ Recompensa criada com sucesso
    else Não autorizado
        DB-->>Action: role: 'fan'
        Action-->>Form: { error: 'Acesso nao autorizado' }
        Form-->>Admin: ❌ Sem permissão
    end

    Note over Action,DB: RLS Policy verifica:<br/>role = 'admin' OR is_creator = true
```

### Fluxo Admin: Aprovar Resgate

```mermaid
sequenceDiagram
    actor Admin
    participant Page as AdminPremiosPage
    participant Action as approveClaim
    participant DB as reward_claims
    participant User as Notification

    Admin->>Page: Visualiza resgates pendentes
    Page->>DB: SELECT * FROM reward_claims WHERE status = 'pending'
    DB-->>Page: lista de claims pendentes

    Page-->>Admin: 📋 Mostra lista (nome user, prêmio, data)

    Admin->>Page: Clica "Aprovar" em resgate
    Page->>Action: approveClaim(claimId)

    Action->>DB: SELECT role FROM users

    alt Admin autorizado
        DB-->>Action: role: 'admin'

        Action->>DB: UPDATE reward_claims SET status = 'approved'
        DB-->>Action: success

        Action-->>Page: { success: true }
        Page-->>Admin: ✅ Resgate aprovado

        opt Notificação (future feature)
            Page->>User: 🔔 "Seu resgate foi aprovado!"
        end
    else Não autorizado
        DB-->>Action: role: 'fan'
        Action-->>Page: { error: 'Acesso nao autorizado' }
        Page-->>Admin: ❌ Sem permissão
    end

    Note over Action,DB: Após aprovação, admin deve<br/>providenciar envio e marcar<br/>como 'shipped' depois
```

### Pipeline de Entrega

```mermaid
stateDiagram-v2
    direction LR

    [*] --> pending: User resgata prêmio<br/>Moedas deduzidas
    pending --> approved: Admin aprova<br/>Verifica dados de entrega
    approved --> shipped: Admin marca enviado<br/>Adiciona código rastreio (opcional)
    shipped --> delivered: Admin confirma entrega<br/>ou User confirma recebimento
    delivered --> [*]: Fluxo completo

    note right of pending
        🕐 Aguardando revisão admin
        ⏱️ SLA: 24-48h
    end note

    note right of approved
        📋 Admin verificou dados
        📦 Preparando envio
    end note

    note right of shipped
        🚚 Em trânsito
        📍 Rastreamento ativo
    end note

    note right of delivered
        ✅ Prêmio recebido
        ⭐ Feedback opcional
    end note
```

### Código: Server Action approveClaim

```typescript
// src/actions/rewards.ts
'use server';

export async function approveClaim(claimId: string): Promise<ActionResponse> {
  const supabase = await createClient();

  // 1. Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Usuario nao autenticado' };

  // 2. Verificar se é admin/creator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_creator')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
    return { error: 'Acesso nao autorizado' };
  }

  // 3. Atualizar status
  const { error } = await supabase
    .from('reward_claims')
    .update({ status: 'approved' })
    .eq('id', claimId);

  if (error) return { error: 'Erro ao aprovar resgate' };

  // 4. Revalidar cache
  revalidatePath('/admin/premios');

  return { success: true };
}
```

---

## Fluxo Completo de Dados

Visão integrada de como todos os sistemas se conectam.

### Arquitetura Completa: Profile & Rewards

```mermaid
graph TB
    subgraph "Client Layer"
        A[🖥️ PerfilPage<br/>Server Component]
        B[✏️ EditProfileForm<br/>Client Component]
        C[🎁 PremiosPage<br/>Server Component]
        D[📊 StatsCards<br/>Client Component]
        E[📜 ActivityTimeline<br/>Client Component]
    end

    subgraph "Server Actions"
        F[👤 updateProfile]
        G[📊 getProfileStats]
        H[💰 getUserCoins]
        I[🎁 claimReward]
        J[❌ cancelClaim]
        K[➕ createReward<br/>Admin]
        L[✅ approveClaim<br/>Admin]
    end

    subgraph "Server Components"
        M[📄 Profile Page<br/>SSR]
        N[🎁 Rewards Page<br/>SSR]
        O[👨‍💼 Admin Dashboard<br/>SSR]
    end

    subgraph "Database - Supabase"
        P[(👥 users<br/>profile data, advocate_level)]
        Q[(💰 user_coins<br/>balance)]
        R[(📝 coin_transactions<br/>history)]
        S[(🎁 rewards<br/>catalog)]
        T[(🏆 reward_claims<br/>redemptions)]
        U[(📄 posts<br/>user content)]
        V[(📅 event_registrations<br/>participation)]
        W[(🎯 challenge_participants<br/>challenges)]
    end

    subgraph "RLS Policies"
        X[🛡️ User Profile<br/>Owner or Public Read]
        Y[🛡️ User Coins<br/>Owner Only]
        Z[🛡️ Reward Claims<br/>Owner + Admin]
        AA[🛡️ Rewards<br/>Public Read, Admin Write]
    end

    A -->|fetch| M
    B -->|submit| F
    C -->|fetch| N
    D -->|aggregate| G
    E -->|display| G

    F -->|update| P
    G -->|query| U
    G -->|query| V
    G -->|query| W
    H -->|query| Q
    I -->|insert| T
    I -->|update| Q
    I -->|insert| R

    M -->|read| P
    M -->|read| Q
    M -->|read| U
    N -->|read| S
    N -->|read| T
    O -->|manage| S
    O -->|manage| T

    X -->|protect| P
    Y -->|protect| Q
    Z -->|protect| T
    AA -->|protect| S

    style A fill:#e3f2fd
    style F fill:#f3e5f5
    style P fill:#e8f5e9
    style X fill:#fff3e0
```

### Diagrama ERD: Relacionamentos de Dados

```mermaid
erDiagram
    USERS ||--o{ USER_COINS : has
    USERS ||--o{ COIN_TRANSACTIONS : has
    USERS ||--o{ REWARD_CLAIMS : makes
    USERS ||--o{ POSTS : creates
    USERS ||--o{ EVENT_REGISTRATIONS : participates
    USERS ||--o{ CHALLENGE_PARTICIPANTS : joins

    REWARDS ||--o{ REWARD_CLAIMS : redeemed_in

    USERS {
        uuid id PK
        string full_name
        string avatar_url
        text bio
        string instagram_handle
        string tiktok_handle
        int advocate_level
        string role
        boolean is_creator
        timestamp created_at
    }

    USER_COINS {
        uuid id PK
        uuid user_id FK
        int balance
        timestamp updated_at
    }

    COIN_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        int amount
        string type
        text description
        uuid reference_id
        timestamp created_at
    }

    REWARDS {
        uuid id PK
        string name
        text description
        string image_url
        int coins_required
        int quantity_available
        string type
        boolean is_active
        timestamp created_at
    }

    REWARD_CLAIMS {
        uuid id PK
        uuid user_id FK
        uuid reward_id FK
        string status
        int coins_spent
        timestamp created_at
    }

    POSTS {
        uuid id PK
        uuid user_id FK
        text content
        string status
        int likes_count
        timestamp created_at
    }

    EVENT_REGISTRATIONS {
        uuid id PK
        uuid user_id FK
        uuid event_id FK
        string status
        timestamp registration_time
    }

    CHALLENGE_PARTICIPANTS {
        uuid id PK
        uuid user_id FK
        uuid challenge_id FK
        string status
        int result_value
        timestamp created_at
    }
```

### Fluxo de Pontos e Moedas

```mermaid
flowchart TB
    Start[🎯 User Action] --> Type{Tipo de Ação}

    Type -->|Post Aprovado| PostCoins[+5 ❤️<br/>+10 pontos]
    Type -->|Like Recebido| LikePoints[+1 ponto]
    Type -->|Evento Participado| EventCoins[+10 ❤️<br/>+20 pontos]
    Type -->|Desafio Concluído| ChallengeCoins[+20-100 ❤️<br/>+50 pontos]

    PostCoins --> UpdateCoins[💰 UPDATE user_coins]
    EventCoins --> UpdateCoins
    ChallengeCoins --> UpdateCoins

    UpdateCoins --> LogTransaction[📝 INSERT coin_transactions]

    PostCoins --> UpdatePoints[🎯 Calcular Pontos Totais]
    LikePoints --> UpdatePoints
    EventCoins --> UpdatePoints
    ChallengeCoins --> UpdatePoints

    UpdatePoints --> CheckLevel{Pontos ≥<br/>Próximo Nível?}

    CheckLevel -->|Sim| LevelUp[🎉 LEVEL UP!<br/>UPDATE advocate_level]
    CheckLevel -->|Não| End[✅ Ação Completa]

    LevelUp --> Notify[🔔 Notificação de Level Up]
    Notify --> UnlockFeatures[🔓 Desbloquear Novos Recursos]
    UnlockFeatures --> End

    style PostCoins fill:#e8f5e9
    style EventCoins fill:#e8f5e9
    style ChallengeCoins fill:#e8f5e9
    style LevelUp fill:#f3e5f5
```

### Timeline Integrada: Exemplo Real

```mermaid
gantt
    title Jornada Completa de um Advocate - Janeiro 2024
    dateFormat YYYY-MM-DD

    section Perfil
    Cadastro na plataforma          :milestone, 2024-01-01, 0d
    Upload de avatar                :done, 2024-01-02, 1d

    section Posts
    Primeiro post criado            :done, 2024-01-03, 1d
    Post aprovado (+5❤️)            :done, 2024-01-04, 1d
    Segundo post (+5❤️)             :done, 2024-01-08, 1d
    Terceiro post (+5❤️)            :done, 2024-01-12, 1d

    section Eventos
    Inscrito em Workshop Online     :done, 2024-01-05, 1d
    Participou Workshop (+10❤️)     :done, 2024-01-10, 1d
    Inscrito em Meetup Presencial   :done, 2024-01-15, 1d
    Check-in Meetup (+10❤️)         :done, 2024-01-20, 1d

    section Desafios
    Inscrito desafio 100 flexões    :done, 2024-01-14, 1d
    Desafio aprovado (+50❤️)        :done, 2024-01-16, 1d
    Desafio engajamento IG (+10❤️)  :done, 2024-01-22, 1d

    section Recompensas
    Resgatou camiseta (-100❤️)      :done, 2024-01-25, 1d
    Admin aprovou resgate           :done, 2024-01-26, 1d
    Prêmio enviado                  :active, 2024-01-28, 3d

    section Níveis
    Nível 1 - INICIANTE             :done, 2024-01-01, 17d
    Subiu para Nível 2 - ATIVO      :milestone, 2024-01-18, 0d
```

---

## Políticas RLS

Documentação completa das políticas de segurança Row Level Security.

### RLS: users

```sql
-- Leitura: Todos podem ver perfis públicos
CREATE POLICY "Public profiles are viewable by everyone"
ON users FOR SELECT
USING (true);

-- Atualização: Apenas o próprio usuário pode atualizar seu perfil
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);
```

### RLS: user_coins

```sql
-- Leitura: Apenas o próprio usuário pode ver seu saldo
CREATE POLICY "Users can view own coins"
ON user_coins FOR SELECT
USING (auth.uid() = user_id);

-- Atualização: Server Actions gerenciam (via service role)
-- Usuários NÃO podem atualizar diretamente
```

### RLS: coin_transactions

```sql
-- Leitura: Apenas o próprio usuário pode ver suas transações
CREATE POLICY "Users can view own transactions"
ON coin_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Inserção: Apenas Server Actions (service role)
-- Garante auditoria confiável
```

### RLS: rewards

```sql
-- Leitura: Todos podem ver recompensas ativas
CREATE POLICY "Active rewards are viewable by everyone"
ON rewards FOR SELECT
USING (is_active = true);

-- Gestão: Apenas admins/creators
CREATE POLICY "Admins can manage rewards"
ON rewards FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR is_creator = true)
  )
);
```

### RLS: reward_claims

```sql
-- Leitura: User vê próprios resgates, Admin vê todos
CREATE POLICY "Users can view own claims"
ON reward_claims FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR is_creator = true)
  )
);

-- Inserção: Apenas via Server Action (validações server-side)
-- Atualização: Apenas admins (aprovar, enviar, entregar)
CREATE POLICY "Admins can update claims"
ON reward_claims FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (role = 'admin' OR is_creator = true)
  )
);
```

### Matriz de Permissões

| Tabela | Ação | Advocate | Admin | Service Role |
|--------|------|----------|-------|--------------|
| `users` | SELECT | ✅ Todos (público) | ✅ Todos | ✅ Todos |
| `users` | UPDATE | ✅ Próprio perfil | ✅ Todos | ✅ Todos |
| `user_coins` | SELECT | ✅ Próprio saldo | ✅ Todos | ✅ Todos |
| `user_coins` | UPDATE | ❌ Não | ❌ Não | ✅ Sim |
| `coin_transactions` | SELECT | ✅ Próprias | ✅ Todas | ✅ Todas |
| `coin_transactions` | INSERT | ❌ Não | ❌ Não | ✅ Sim |
| `rewards` | SELECT | ✅ Ativos | ✅ Todos | ✅ Todos |
| `rewards` | INSERT/UPDATE/DELETE | ❌ Não | ✅ Sim | ✅ Sim |
| `reward_claims` | SELECT | ✅ Próprios | ✅ Todos | ✅ Todos |
| `reward_claims` | INSERT | ❌ Via Action | ❌ Via Action | ✅ Sim |
| `reward_claims` | UPDATE | ❌ Não | ✅ Status | ✅ Sim |

---

## Arquivos Relacionados

### Server Actions

```
src/actions/
├── profile.ts                 # Gestão de perfil
│   ├── updateProfile()        # Atualizar dados do perfil
│   ├── getCurrentProfile()    # Buscar perfil atual
│   ├── getProfileStats()      # Estatísticas agregadas
│   └── getPublicProfile()     # Perfil público de usuário
│
└── rewards.ts                 # Sistema de recompensas
    ├── claimReward()          # Resgatar prêmio
    ├── cancelClaim()          # Cancelar resgate (pending)
    ├── toggleRewardActive()   # Admin: ativar/desativar
    ├── approveClaim()         # Admin: aprovar resgate
    ├── markClaimShipped()     # Admin: marcar enviado
    ├── markClaimDelivered()   # Admin: marcar entregue
    ├── createReward()         # Admin: criar recompensa
    ├── updateReward()         # Admin: atualizar recompensa
    └── addCoinsToUser()       # Admin: adicionar moedas
```

### Components

```
src/app/(dashboard)/
├── perfil/
│   ├── page.tsx               # Página de perfil (Server Component)
│   ├── editar/
│   │   └── page.tsx           # Edição de perfil (Client Component)
│   └── [userId]/
│       └── page.tsx           # Perfil público
│
├── premios/
│   └── page.tsx               # Marketplace de recompensas
│
└── admin/
    ├── premios/
    │   ├── page.tsx           # Admin: gestão de recompensas
    │   └── RewardAdminComponents.tsx  # Client Components
    └── usuarios/
        └── page.tsx           # Admin: gestão de usuários
```

### Types

```
src/types/
└── profile.ts                 # Tipos de perfil
    ├── User                   # Tipo base do usuário
    ├── PublicProfile          # Perfil público (sem dados sensíveis)
    ├── UserStats              # Estatísticas agregadas
    ├── ProfileWithStats       # Perfil + estatísticas
    └── UpdateProfileData      # Dados de atualização
```

### Database Schema

```sql
-- Perfis e níveis
users (
  id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  bio text,
  instagram_handle text,
  tiktok_handle text,
  advocate_level int DEFAULT 1,  -- Nível do advocate (1-5)
  role text DEFAULT 'fan',
  is_creator boolean DEFAULT false,
  created_at timestamptz,
  updated_at timestamptz
)

-- Saldo de moedas
user_coins (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  balance int DEFAULT 0,
  updated_at timestamptz
)

-- Histórico de transações
coin_transactions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  amount int NOT NULL,
  type text CHECK (type IN ('earned', 'spent')),
  description text,
  reference_id uuid,  -- ID da ação que gerou a transação
  created_at timestamptz
)

-- Catálogo de recompensas
rewards (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  coins_required int NOT NULL,
  quantity_available int,  -- NULL = ilimitado
  type text CHECK (type IN ('digital', 'physical')),
  is_active boolean DEFAULT true,
  created_at timestamptz
)

-- Resgates de prêmios
reward_claims (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  reward_id uuid REFERENCES rewards(id),
  status text CHECK (status IN ('pending', 'approved', 'shipped', 'delivered', 'cancelled')),
  coins_spent int NOT NULL,
  created_at timestamptz
)
```

### Mapa de Responsabilidades

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[PerfilPage.tsx<br/>Visualização de perfil]
        B[EditProfileForm<br/>Edição de dados]
        C[PremiosPage.tsx<br/>Marketplace]
        D[AdminPremios.tsx<br/>Gestão admin]
    end

    subgraph "Business Logic Layer"
        E[profile.ts<br/>4 actions de perfil]
        F[rewards.ts<br/>9 actions de recompensas]
        G[queries.ts<br/>Agregação de stats]
    end

    subgraph "Data Layer"
        H[(users<br/>Perfis)]
        I[(user_coins<br/>Saldos)]
        J[(coin_transactions<br/>Histórico)]
        K[(rewards<br/>Catálogo)]
        L[(reward_claims<br/>Resgates)]
    end

    A --> E
    A --> G
    B --> E
    C --> F
    C --> G
    D --> F

    E --> H
    F --> I
    F --> J
    F --> K
    F --> L
    G --> H
    G --> I
    G --> J

    style A fill:#e3f2fd
    style E fill:#f3e5f5
    style H fill:#e8f5e9
```

---

## Resumo

O sistema de **Perfil e Recompensas** da plataforma NextLOVERS oferece:

1. ✅ **Gestão de Perfil Completa**: Edição de dados pessoais, links sociais e bio
2. ✅ **Sistema de Níveis**: 5 níveis de advocate com benefícios progressivos
3. ✅ **Moedas Virtuais**: Sistema de corações (❤️) com histórico completo
4. ✅ **Marketplace de Recompensas**: Prêmios físicos e digitais
5. ✅ **Histórico Integrado**: Timeline consolidada de todas as participações
6. ✅ **Painel Admin**: Gestão completa de recompensas e resgates
7. ✅ **RLS Policies**: Segurança em todas as operações
8. ✅ **Server Actions**: Validações robustas server-side

**Tecnologias:** Next.js 15 (App Router), Supabase (Database + RLS), TypeScript, Server Actions, Server Components

**Próximos Passos:**
- Sistema de badges e conquistas visuais
- Notificações push para resgates aprovados
- Gamificação adicional (streaks, missões diárias)
- Programa de embaixadores para nível 5
- Dashboard analytics para admins
