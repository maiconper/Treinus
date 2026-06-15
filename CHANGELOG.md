# Changelog — Treinus

## [2026-06-13] — Sessão de treino: fluxo de execução, presets e estado concluído

### Backend

#### `SessionService`

- `start()`: aceita `workoutId` de treino do usuário **ou** preset do SYSTEM (fix — usava só `findByIdAndUserId`)
- `getCurrent()`: alterado de `BusinessException` (422) para `ResourceNotFoundException` (404) quando não há sessão ativa — semântica HTTP correta para "não encontrado"

#### `SessionExerciseResponse`

Adicionados campos derivados do `WorkoutExercise` (nullable para sessões livres):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `plannedSets` | `Integer` | Número de séries planejadas |
| `plannedRepsMin` | `Integer` | Reps mínimas planejadas |
| `plannedRepsMax` | `Integer` | Reps máximas planejadas |
| `restSeconds` | `Integer` | Descanso planejado em segundos |

---

### Frontend

#### `ActiveSessionPage` — fluxo de execução melhorado

- **`plannedSets`**: usa o valor real do backend em vez de fixo em 3
- **`reps` inicial**: carregado de `plannedRepsMax ?? plannedRepsMin ?? 10` ao entrar no exercício
- **Descanso automático**: usa `restSeconds` do workout (fallback 90s)
- **Botão contextual no rodapé**:
  - Durante as séries: "Confirmar série" + "Pular exercício"
  - Após completar todas as séries (`completedSets >= plannedSets`): "Próximo exercício" (azul)
  - No último exercício concluído: "Finalizar treino" (verde)
  - Após pular o último exercício (`status === 'SKIPPED'`): "Finalizar treino" também aparece
- Ao avançar de exercício: timer de descanso é parado e inputs resetam para os valores planejados do próximo exercício

#### `WorkoutBuilderPage` — iniciar treino direto do builder

- Botão **"Iniciar treino"** aparece no rodapé do Passo 2 quando há pelo menos 1 exercício adicionado
- Ao clicar: cria sessão via `SessionService.start({ workoutId })` e navega para `/session/:id`
- "Salvar e sair" (ghost) mantém comportamento anterior de voltar para a lista

#### `SessionService`

- `getCurrent()`: limpa `_active` no erro (via `catchError`) para manter o `BehaviorSubject` consistente
- `activeSession$` (`BehaviorSubject`): já existia; `finishSession()` e `abandonSession()` continuam zerando

#### `HomePage` — banner de sessão ativa reativo

- Subscribes ao `activeSession$` do `SessionService` via `ngOnInit` → banner "Treino em andamento" desaparece imediatamente após `finishSession()`, sem depender de `ionViewWillEnter`
- `getCurrent()` ainda é chamado no `load()` para sincronizar estado inicial com o backend

#### Estado "Treino concluído" — `HomePage` e `WorkoutsPage`

- Getter `completedToday` compara `user.lastWorkoutDate` (data local do dispositivo, sem UTC offset) com a data de hoje
- Card "Treino de hoje" alterna entre:
  - **Normal**: botão "Iniciar treino" / "Continuar treino"
  - **Concluído**: card com borda verde + badge "Treino concluído!" / "Concluído!" (sem botão)
- Funciona após F5 pois `lastWorkoutDate` vem do banco via `GET /users/me`
- **TODO**: `lastWorkoutDate` indica que *algum* treino foi feito hoje, não que o treino específico do programa foi concluído. Se o usuário trocar o treino do dia no programa, o novo aparece incorretamente como concluído. Solução correta: vincular a sessão ao `programDayId` ou `workoutId` específico e consultar via endpoint dedicado.

#### `WorkoutsPage` — ajustes adicionais

- Carrega `user` via `UserService.getMe()` no `forkJoin` do `load()` para habilitar `completedToday`
- Mesmo estado de card concluído (verde) aplicado ao card "Treino de hoje"

---

## [2026-06-13] — Programas: iniciar, editar e página de detalhe

### Backend

#### Novos endpoints — `ProgramController`

| Método | Rota | Descrição |
|--------|------|-----------|
| `PUT` | `/api/v1/programs/{id}` | Atualizar nome/descrição do programa |
| `DELETE` | `/api/v1/programs/{id}` | Excluir programa (bloqueia se ACTIVE) |
| `DELETE` | `/api/v1/programs/{id}/weeks/{weekId}` | Remover semana (cascade deleta os dias) |
| `PUT` | `/api/v1/programs/{id}/weeks/{weekId}/days/{dayId}` | Trocar treino ou marcar descanso |
| `DELETE` | `/api/v1/programs/{id}/weeks/{weekId}/days/{dayId}` | Remover dia da semana |

#### Novos DTOs

- `UpdateProgramRequest` — `name` (obrigatório) + `description` (opcional)
- `UpdateProgramDayRequest` — `workoutId` (nullable) + `restDay` (boolean)

#### Mudanças no `ProgramService`

- `create()` agora pré-cria as semanas automaticamente com base em `weeksCount` — antes o campo era apenas metadata
- `delete()` lança `BusinessException` se o programa estiver `ACTIVE`
- Adicionados: `update()`, `removeWeek()`, `removeDay()`, `updateDay()`

#### Mudanças no `ProgramDayRepository`

- Adicionado método `findByIdAndProgramWeekId(UUID id, UUID programWeekId)`

---

### Frontend

#### Correção de modelo — `program.model.ts`

`ProgramStatus` corrigido para refletir o enum real do backend:

```
Antes:  'PENDING' | 'ACTIVE' | 'FINISHED'
Depois: 'DRAFT'   | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
```

#### Novo serviço — `ProgramService` (métodos adicionados)

- `update(id, { name, description? })` — renomear programa
- `delete(id)` — excluir programa
- `removeWeek(programId, weekId)` — remover semana
- `removeDay(programId, weekId, dayId)` — remover dia
- `updateDay(programId, weekId, dayId, { workoutId?, restDay })` — atualizar dia

#### Nova página — `ProgramDetailPage`

Rota: `/tabs/workouts/programs/:id`

Funcionalidades:
- **Nome editável inline** com auto-save no `blur`
- **Chip de status** (Rascunho / Ativo / Concluído / Cancelado) com cor correspondente
- **Botão "Iniciar programa"** (visível em DRAFT) com alert de confirmação
- **Botão "Concluir programa"** (visível em ACTIVE) com alert de confirmação
- **Cards de semanas colapsáveis** com botão de lixeira para remover
- **7 dias por semana** (Seg–Dom, dayOfWeek 1–7)
  - Cada dia mostra: nome do treino atribuído, "Descanso", ou "—"
  - Tocar num dia abre `ActionSheet` com: lista de treinos do usuário + "Descanso" + "Remover dia" (se já configurado)
- **Botão "Adicionar semana"** com borda tracejada (visível apenas em DRAFT e ACTIVE)
- **Toast de confirmação** ("Salvo", "Semana adicionada", "Dia removido") após cada ação
- Programas **DRAFT e ACTIVE** são editáveis; COMPLETED e CANCELLED são somente leitura

#### Mudanças em `WorkoutsPage`

- Clicar em um programa agora **navega para `ProgramDetailPage`** em vez de abrir alert
- Ícone de **play** no lugar do chevron para programas DRAFT
- **Botão lixeira** nos programas não-ativos (DRAFT / COMPLETED / CANCELLED)
- Após criar um programa: **navega direto para a página de detalhe** (em vez de voltar para a lista)
- `getProgramStatusLabel` e `getProgramStatusColor` atualizados para os status reais do backend

#### Módulo — `WorkoutsPageModule`

- `ProgramDetailPage` declarado e rota `programs/:id` registrada

---

## [2026-06-12/13] — Workout Builder e seed de exercícios

### Backend

- `V8__seed_exercises.sql` — 96 exercícios globais (`is_global = true`) em 10 categorias: CHEST, BACK, LEGS, GLUTES, SHOULDERS, ARMS, CORE, CALVES, CARDIO, FULL_BODY

### Frontend

#### `WorkoutBuilderPage` (novo, 2 passos)

**Passo 1 — Info:**
- Campo de nome do treino
- Grid de chips de grupos musculares (Peito, Costas, Ombros, Tríceps, Bíceps, Pernas, Glúteos, Core)

**Passo 2 — Exercícios:**
- Busca com debounce 250ms + `distinctUntilChanged`
- Seção "NO TREINO" com exercícios já adicionados: dot colorido por categoria, chips `séries × reps [peso]kg`, botão remover
- Duração estimada dinâmica (`totalSets * 130 + exercises.length * 60` segundos, arredondado a 5 min)
- Seção "ADICIONAR" com resultados filtrados (exclui já adicionados)

#### `ExerciseConfigModal` (bottom sheet)

- Steppers para **Séries** e **Repetições** com ícones distintos (layers-outline / repeat-outline)
- Input numérico para **Carga (kg)** opcional
- Preview chips coloridos antes de confirmar: `3 séries × 10 reps [80kg]`
- Abre via `ModalController` com `breakpoints: [0, 1]`, `initialBreakpoint: 1`

#### Navegação

- Lista de treinos: clicar navega para `WorkoutBuilderPage` em modo edição
- Clicar em "+" cria novo treino e vai para o builder

#### Correções de build

- `get firstName()` no `HomePage` para evitar erro de optional chaining em template
- `decWeight()` / `decReps()` no `ActiveSessionPage` para substituir `Math.max` em template (não permitido)
- `DecimalPipe` adicionado aos providers do `ProgressModule`
