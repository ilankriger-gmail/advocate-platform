# Criar hook useEvents para eventos

## Overview

Criar um hook useEvents seguindo o padrao de usePosts e useProfile, encapsulando as server actions de eventos (registerForEvent, cancelEventRegistration, checkInEvent, submitEventFeedback) com tratamento de estado de loading, erro e refresh automatico.

## Rationale

O padrao de hooks ja esta bem estabelecido em usePosts (6 actions) e useProfile. As server actions de eventos ja existem em actions/events.ts mas nao tem um hook correspondente. Isso facilita o uso em client components e mantem consistencia arquitetural.

---
*This spec was created from ideation and is pending detailed specification.*
