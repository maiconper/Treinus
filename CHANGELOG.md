# Changelog — Treinus

## [2026-06-23] — Confirmação ao clicar dia sem treinos + fix nome no registro manual

### Bug fix: nome personalizado do treino não salvo após registro manual

**Causa raiz:** `workoutName` no `ManualRegisterPage` iniciava como `''` porque os callers não passavam o parâmetro. `register()` enviava `name: '' || undefined` → campo omitido do JSON → backend recebia `name = null` → fallback para o nome do treino planejado ("Legs — Pernas e Glúteos").

#### `workouts.page.ts`

- `onDayClick` (caminho 0 sessões) e action sheet "Registrar outro treino": adicionado `workoutName: this.getWorkoutForDay(d.day)?.name ?? ''` aos query params de navegação para `/tabs/workouts/register`

#### `session-detail.page.ts`

- `registerAnotherWorkout()`: adicionado `workoutName: this.session.workoutName` aos query params

#### `SessionService.java`

- `registerManual()`: o nome agora é resolvido **após** associar `programDay` e `workout`, garantindo que `session.getName()` nunca seja null:
  ```java
  String resolvedName = (request.name() != null && !request.name().isBlank())
          ? request.name()
          : (session.getWorkout() != null ? session.getWorkout().getName() : "Treino");
  session.setName(resolvedName);
  ```
  Isso elimina o fallback via relacionamento de workout em `SessionResponse.from()` para sessões registradas manualmente.

---

### Nova feature: alerta de confirmação ao clicar dia sem treinos registrados

#### `workouts.page.ts`

- `onDayClick()`: quando `sessions.length === 0`, exibe `AlertController` em vez de navegar diretamente:
  - **Header:** "Nenhum treino registrado"
  - **Message:** `"Nenhum treino registrado neste dia. Gostaria de registrar 'NomeDoTreino'?"` (com nome se disponível, genérico caso contrário)
  - **Botões:** "Cancelar" e "Registrar treino"
  - O botão "Registrar treino" navega para `/tabs/workouts/register` com `date`, `dayId`, `workoutId` e `workoutName`

> **Nota técnica:** `AlertController.message` no Ionic renderiza como texto puro — tags HTML (`<br>`, `<strong>`) aparecem literalmente. Usar texto plano com aspas normais para ênfase.

---

## [2026-06-20] — Ocultar card de treino após conclusão (home + workouts)

### Frontend

#### `home.page.ts`

- Getter `isTodayWorkoutDone`: retorna `true` se algum item de `todaySessions` tem `workoutId` igual ao `workoutId` do treino de hoje (`todayWorkout?.workoutId`)

#### `home.page.html`

- `workout-card` (seção "Treino de hoje") agora usa `@if (todayWorkout && !isTodayWorkoutDone)` — some após o treino ser concluído
- Label `section-lbl` "Treino de hoje" movido para dentro do bloco condicional — some junto com o card; evita label órfão sem conteúdo abaixo
- Bloco `@else if (!todayWorkout)` mantém o label + card "Nenhum treino para hoje" quando não há treino agendado
- O card "Concluídos hoje" (seção `todaySessions`, acima) já exibia o treino concluído — agora é a única referência visual ao treino do dia quando done

#### `workouts.page.ts`

- Getter `isTodayWorkoutDone`: análogo ao da home — compara `todayDay?.workoutId` com os `workoutId` de `todaySessions`

#### `workouts.page.html`

- `today-card` de iniciar treino usa `@if (todayDay && !todayDay.restDay && todayDay.workoutId && !isTodayWorkoutDone)` — some após conclusão
- O card `done` do loop `@for (s of todaySessions)` (exibido acima, com badge "Concluído!") permanece visível como referência

---

## [2026-06-20] — Conclusão explícita de exercício na execução de treino

### Backend

#### `SessionService.java`

- Novo método `completeExercise(sessionId, sessionExerciseId, userId)`:
  - Valida que a sessão está ativa e o exercício pertence a ela
  - Lança `BusinessException` se o exercício já está `SKIPPED` ou `COMPLETED`
  - Seta `status = COMPLETED` e persiste

#### `SessionController.java`

- Novo endpoint `POST /api/v1/sessions/{id}/exercises/{sessionExerciseId}/complete`
- Retorna `SessionResponse` atualizado

> **Mudança de comportamento:** anteriormente `COMPLETED` só era atribuído aos exercícios pelo método `finish()` ao encerrar a sessão. A partir desta versão, `COMPLETED` pode ser setado explicitamente durante a sessão ativa via este endpoint.

### Frontend

#### `session.service.ts`

- Novo método `completeExercise(sessionId, exerciseId): Observable<Session>` → `POST .../complete`

#### `active-session.page.ts`

| Mudança | Detalhe |
|---|---|
| `isExerciseDone` | Inclui `status === 'COMPLETED'` como condição adicional (além de `sets >= planned` e `SKIPPED`) |
| `nextExercise()` | Antes de navegar, verifica se `status === 'IN_PROGRESS' && isExerciseDone`: se sim, chama `completeExercise` e aguarda a resposta antes de mover para o próximo |
| `moveToNext()` | Extrato privado com a lógica de navegação, chamado de `nextExercise()` para evitar duplicação |
| `completeExercise()` | Async; exibe `AlertController` de confirmação; se `plannedSets - completedSets > 0`, a mensagem do alert informa quantas séries ainda restam |
| `currentExerciseVolume` | Getter: soma `weightKg × reps` de todas as séries registradas no exercício atual |
| `currentExerciseHasPR` | Getter: `true` se alguma série do exercício atual tem `personalRecord === true` |

#### `active-session.page.html`

- Inputs de carga/reps, timer de descanso e botões de ação (`btn-confirm`, secondary-actions, `btn-end-early`) encapsulados em `@if (!isExerciseDone)` — somem ao concluir o exercício
- Botão **"Concluir exercício"** (`.btn-complete`, outline azul) adicionado em `.secondary-actions` ao lado de "Pular exercício"
- **Card de conclusão** (`.done-card`) exibido quando `isExerciseDone`:
  - Estado `COMPLETED`: ícone `checkmark-circle` (48px, azul), título "Exercício concluído!", linha com número de séries e volume total em kg; badge dourado "Novo recorde pessoal!" se `currentExerciseHasPR`
  - Estado `SKIPPED`: ícone `remove-circle` (cinza), "Exercício pulado", motivo se preenchido
- Botões "Próximo exercício" / "Finalizar treino" posicionados abaixo do card de conclusão (dentro do `@if (isExerciseDone)`)
- Todo HTML novo usa `@if`/`@else` (Angular 17+) — sem `*ngIf` introduzido

#### `active-session.page.scss`

- `.done-card`: `background: var(--blue-bg)`, `border: 1px solid #85B7EB`, `border-radius: 16px`, flex coluna centrado; variante `.skipped` com `var(--surface2)` e textos em cinza
- `.done-pr`: badge inline dourado (`#FFF8DC` / `#DAA520`)
- `.secondary-actions`: flex coluna, `margin-top: 8px`
- `.btn-complete`: outline azul (`border: 1.5px solid var(--blue)`, `color: var(--blue)`)

---

## [2026-06-19] — Catálogo de exercícios: descrições, imagens e painel expansível no builder

### Backend

#### `V14__exercise_descriptions_and_images.sql`

- Adicionada coluna `gif_url VARCHAR(500)` à tabela `exercises`
- Preenchida coluna `description` para todos os **91 exercícios globais** do catálogo (PT-BR, 1–2 frases focadas em execução e técnica)
- Preenchida coluna `gif_url` para **22 exercícios** com imagens do dataset open-source [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (fotos JPG hospedadas no GitHub via `raw.githubusercontent.com`). Exercícios cobertos:
  - Peito: Supino reto com barra, Supino inclinado com barra, Supino declinado com barra, Crossover alto/baixo, Mergulho entre barras (peito)
  - Costas: Barra fixa supinada, Remada curvada com barra, Levantamento terra
  - Pernas: Agachamento livre, Agachamento hack, Passada
  - Glúteos: Hip thrust com barra
  - Ombros: Desenvolvimento com barra, Desenvolvimento Arnold
  - Braços: Rosca direta com barra, Rosca martelo, Rosca concentrada, Mergulho no banco (tríceps)
  - Core: Abdominal supra, Abdominal no cabo
  - Panturrilha: Panturrilha no leg press
  - Full Body: Clean and jerk

#### `Exercise.java` / `ExerciseResponse.java`

- Campo `gifUrl` (`String`) adicionado à entidade e ao DTO de resposta

### Frontend

#### `exercise.model.ts`

- Campo `gifUrl?: string` adicionado à interface `Exercise`

#### `workout-builder.page` (passo 2 — exercícios)

**Painel expansível por exercício:**

- Cada exercício nas seções "NO TREINO" e "ADICIONAR" ganhou um botão chevron (`∨`/`∧`) à direita
- Ao abrir, o card do exercício conecta visualmente com um painel abaixo (sem gap, bordas inferiores quadradas no card + bordas superiores quadradas no painel) exibindo:
  - **Foto** do exercício (`<img loading="lazy">`, carregada apenas ao abrir — sem impacto de performance)
  - **Descrição** textual em PT-BR
  - **Badge roxo** com músculo principal (`body-outline` icon + `primaryMuscleGroup`)
  - **Badge cinza** com equipamento (`getEquipmentLabel` — BARBELL → "Barra", DUMBBELL → "Halteres", etc.)
- Clicar no chevron usa `stopPropagation()` para não disparar ações do item pai (editar/adicionar)
- `expandedIds: Set<string>` controla quais exercícios estão abertos; `exerciseMap: Map<string, Exercise>` para lookup O(1) na seção "NO TREINO" (que só tem `exerciseId`, não os dados completos do exercício)
- HTML usa sintaxe de controle de fluxo do Angular 17+ (`@for`/`@if`)

---

## [2026-06-16] — Home: faixa de semana fixa · Treinos: timeline rolável e ordem de abas

### Frontend

#### `HomePage` — faixa "Sua semana" fixa acima da tab bar

- Bloco "Sua semana" movido do conteúdo rolável para um `<ion-footer>`, posicionado após o `</ion-content>`
- Cada página de aba tem seu próprio `ion-header`/`ion-content`/`ion-footer`, dimensionado para caber acima do `ion-tab-bar` global — o footer fica sempre visível, sem cálculo manual de offset/safe-area
- `*ngFor` convertido para `@for` no bloco movido (sintaxe de controle de fluxo do Angular 17+)
- CSS: `.week-footer` com `background: var(--surface)` e `border-top`, seguindo o mesmo padrão já usado em `.builder-footer` (`workout-builder.page.scss`)

#### `WorkoutsPage` — "Meus treinos" como aba padrão

- `segment` inicial alterado de `'programs'` para `'workouts'`
- Ordem dos botões do segmento invertida: "Meus treinos" aparece primeiro, "Programas" em seguida

#### `WorkoutsPage` — timeline rolável do programa (substitui strip da semana atual)

- A faixa de dias deixou de mostrar só os 7 dias da semana atual e passou a exibir **uma linha do tempo única com todos os dias de todas as semanas do programa ativo**, lado a lado e rolável horizontalmente (`overflow-x: auto`, sem barra de rolagem visível, scroll por toque/arraste)
- `timelineDays` (nova interface `TimelineDay`): array plano construído em `buildTimeline()` a partir de `activeProgram.weeks`, com um índice global por dia (`globalIndex = (weekNumber - 1) * 7 + (dayOfWeek - 1)`)
- Ao carregar a página, a faixa rola automaticamente para centralizar o dia de hoje (`scrollToToday()`, via `@ViewChild('weekStrip')`)
- **Label "SEMANA X" dinâmico**: `viewedWeekNumber` é recalculado a cada scroll (`(scroll)="onStripScroll()"`, com throttle via `requestAnimationFrame`) comparando o centro de cada célula (`data-week`) com o centro visível da faixa — o label sempre reflete a semana atualmente centralizada na tela, não mais a semana "de hoje" fixa
- **Dia do mês por célula**: cada `day-cell` agora mostra `d.date.getDate()` acima do dia da semana. A data é calculada relativa a hoje (`hoje ± diferença de índice global`) para não depender do alinhamento exato entre `startedAt` do programa e os dias da semana reais
- CSS: células com largura fixa (38px, antes `flex: 1`), pequeno espaçamento extra a cada domingo (`.week-end`) para separar visualmente as semanas; destaque azul/bold também no número do dia quando `is-today`

---

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
