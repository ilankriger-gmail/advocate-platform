# 📊 Estudo UX/UI - Banners Link do Bem

## Objetivo
Apresentar campanhas do Link do Bem de forma não-intrusiva, mantendo a experiência agradável e aumentando engajamento.

---

## 🎯 Melhores Práticas do Mercado

### 1. **Banners Nativos (Native Ads)**
- Se integram ao design da plataforma
- Parecem conteúdo, não propaganda
- **CTR 40% maior** que banners tradicionais
- Menos "banner blindness"

### 2. **Posicionamento Estratégico**
- **Entre conteúdos**: Após 3-4 itens de feed
- **Fim de seção**: Após completar uma ação
- **Contexto relevante**: Relacionado ao que o usuário está vendo
- ❌ Evitar: Topo da página (ignorado), pop-ups (irritante)

### 3. **Frequência Controlada**
- Máximo **1 banner por sessão** ou **1 a cada 5 minutos**
- Rotação de campanhas (não repetir a mesma)
- Respeitar "X" de fechar (não mostrar de novo por 24h)

### 4. **Tamanhos Recomendados (Mobile-First)**
- **320×100** - Banner compacto (melhor UX)
- **300×250** - Card médio (bom para feed)
- ❌ Evitar: 320×50 (muito pequeno), fullscreen (intrusivo)

### 5. **Timing Inteligente**
- Mostrar após **ação positiva** (completou desafio, ganhou pontos)
- Momento de "pausa natural" (scroll parou, fim de lista)
- ❌ Evitar: Durante ações importantes

---

## 🎨 Proposta para Arena Te Amo

### Formato 1: **Card Nativo no Feed** ⭐ Recomendado
```
┌─────────────────────────────────────┐
│ 🤝 Campanha do Bem                 │
│ ┌─────────────────────────────────┐│
│ │        [IMAGEM]                 ││
│ └─────────────────────────────────┘│
│ Doação Geladeira                    │
│ Ajude alguém a ter uma geladeira   │
│ nova em casa!                       │
│                                     │
│ [    💚 Quero Ajudar    ]          │
└─────────────────────────────────────┘
```
- Aparece **1x no feed**, entre desafios
- Design igual aos cards de desafio
- Não parece propaganda

### Formato 2: **Banner de Celebração**
```
┌─────────────────────────────────────┐
│ 🎉 Você ganhou 50 corações!        │
│                                     │
│ Que tal conhecer uma campanha      │
│ do Link do Bem?                     │
│                                     │
│ [Ver Campanha] [Agora não]         │
└─────────────────────────────────────┘
```
- Aparece **após completar desafio**
- Momento positivo = receptividade maior
- Opção clara de recusar

### Formato 3: **Seção Dedicada**
```
Na página inicial, seção "Faça o Bem":
┌─────────────────────────────────────┐
│ 🤝 Campanhas do Bem                │
│ Ajude quem precisa                  │
│                                     │
│ [Card 1] [Card 2] [Card 3] →       │
│                                     │
└─────────────────────────────────────┘
```
- Carrossel horizontal
- Usuário escolhe ver ou não
- Zero intrusão

---

## 📍 Onde Implementar

| Local | Formato | Frequência |
|-------|---------|------------|
| Home (feed) | Card Nativo | 1x, posição 4 |
| Após completar desafio | Banner Celebração | 30% das vezes |
| Página de Prêmios | Seção dedicada | Sempre visível |
| Perfil | Nenhum | - |
| Durante desafio | Nenhum | - |

---

## ✅ Regras de Ouro

1. **Nunca interromper** uma ação do usuário
2. **Sempre ter opção** de fechar/ignorar
3. **Máximo 1 impressão** por sessão
4. **Design consistente** com a plataforma
5. **Conteúdo relevante** (campanhas ativas apenas)
6. **Mobile-first** - funcionar bem no celular

---

## 🚀 Implementação Sugerida

### Fase 1 (Simples)
- Seção "Campanhas do Bem" na Home
- Carrossel com campanhas ativas
- Sem pop-ups, sem interrupções

### Fase 2 (Inteligente)
- Card nativo no feed (posição 4)
- Rotação automática de campanhas
- Tracking de cliques

### Fase 3 (Personalizado)
- Banner pós-desafio (30% das vezes)
- Frequência baseada em engajamento
- A/B testing de formatos

---

## 📈 Métricas de Sucesso

- **CTR > 2%** = bom engajamento
- **Tempo na página** não diminuir
- **Bounce rate** não aumentar
- **NPS** manter ou melhorar
