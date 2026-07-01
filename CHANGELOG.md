# Changelog — Treinus

## [2026-06-30] — Homepage, Progresso: mini-stats com período, top exercícios, aba Evolução com gráfico de carga

### Homepage — `home.page.*`

**Avatar com iniciais do usuário:**
- Removido `<img class="hero-img">` (gif `hero-musculo.gif`) e seu bloco CSS `.hero-img`
- Adicionado `<div class="user-avatar">{{ userInitials }}</div>` no `.home-header`
- Getter `userInitials` já existia no TS: pega as duas primeiras iniciais de `user.name`, uppercase
- Estilo: círculo 44×44 px, `background: var(--purple)`, texto branco 15px bold, `flex-shrink: 0`; o `justify-content: space-between` do header já posiciona o avatar à direita

---

### Progresso — period-selector em mini-stats

#### Backend

**`ProgressController.getSummary`:** adicionado `@RequestParam(defaultValue = "ALL") String period` e repasse ao service.

**`ProgressService.getSummary(UUID userId, String period)`:**
- Calcula `Instant periodFrom` com switch:

| `period` | Filtro |
|---|---|
| `WEEK` | últimos 7 dias |
| `MONTH` | últimos 30 dias |
| `YEAR` | últimos 365 dias |
| `ALL` | `Instant.EPOCH` (sem filtro) |

- `periodSessions` = sessions filtradas por `startedAt > periodFrom`
- Campos filtrados pelo período: `totalWorkouts`, `totalSets`, `totalDurationSeconds`, `avgDurationSeconds`, `totalPersonalRecords`
- Campos sempre all-time: `streak`, `xp`, `level`, `workoutsThisWeek`, `volumeThisWeek`, `volumeLastWeek`

#### Frontend

**`progress.service.ts`:** `getSummary(period = 'ALL')` passa `period` como `HttpParams`.

**`progress.page.ts`:**
- `statsPeriod: MusclePeriod = 'ALL'`
- `loadSummary()`: método isolado que chama `getSummary(this.statsPeriod)`; `load()` delega a ele
- `selectStatsPeriod(p)`: early-return se mesmo período; atualiza estado e chama `loadSummary()`

**`progress.page.html`:** header acima do grid com label "Estatísticas" + period-selector (mesmos botões pill já existentes para o gráfico de músculo).

**`progress.page.scss`:**
- `.period-selector` e `.period-btn` extraídos de `.muscle-chart-card` para top-level (reutilizados pelos dois seletores)
- `.mini-stats-header`: flex `space-between` + `section-lbl` sem `margin-bottom`
- Removido stat "Esta semana" (`workoutsThisWeek`) dos mini-stats — redundante com period = WEEK
- Grid de 5 stats: Sequência · Treinos · Séries · Tempo médio · Tempo total

---

### Progresso — card "Exercícios frequentes"

#### Backend

**Novo DTO — `TopExerciseResponse.java`:**
```java
public record TopExerciseResponse(String exerciseId, String exerciseName, long timesPerformed) {}
```

**`ProgressService`:**
- `getExercisesDone(UUID userId)`: agrupa `SessionExercise` por `ExKey(id, name)` via `Collectors.groupingBy + counting()`, ordena por frequência decrescente, sem limite; retorna `List<TopExerciseResponse>`
- `getTopExercises(UUID userId, int limit)`: delega a `getExercisesDone` e aplica `.limit(limit)` — evita duplicação de query

**`ProgressController`:** `GET /api/v1/progress/top-exercises?limit=3`

**`progress.model.ts`:**
```typescript
export interface TopExercise { exerciseId: string; exerciseName: string; timesPerformed: number; }
```

**`progress.service.ts`:** `getTopExercises(limit = 3)` com `HttpParams`.

**`progress.page.ts`:** `topExercises: TopExercise[]`; carregado no `load()`.

**`progress.page.html`:** card `.top-exercises-card` entre o volume card e o XP card:
- 3 linhas com rank (círculo 20px), nome do exercício e contador `N×`
- Card só renderizado quando `topExercises.length > 0`

**`progress.page.scss` — `.top-exercises-card`:**
- `.top-ex-rank`: círculo 20px, `var(--surface2)`, `var(--text3)`
- `.top-ex-name`: flex-1, truncamento com `text-overflow: ellipsis`
- `.top-ex-count`: 13px bold, `var(--text1)`
- Separador entre linhas via `border-bottom: 0.5px solid var(--border)`; última linha sem borda

---

### Progresso — aba Evolução com gráfico de carga por exercício

#### Backend

**`ExerciseProgressResponse.SetHistoryEntry`:** adicionados `UUID sessionId` e `Instant sessionStartedAt` para o frontend poder agrupar sets por sessão:
```java
public record SetHistoryEntry(UUID sessionId, Instant sessionStartedAt, Instant completedAt, int reps, BigDecimal weightKg, boolean personalRecord) {}
```

**`ProgressController.getExerciseProgress`:** adicionado `@RequestParam(defaultValue = "all") String period`.

**`ProgressService.getExerciseProgress(UUID userId, UUID exerciseId, String period)`:**
- Para `"all"`: carrega via `findByUserIdAndStatusOrderByStartedAtDesc(Pageable.unpaged())`
- Para `1m / 3m / 6m`: usa `findByUserIdAndStatusAndFinishedAtBetween` com `Instant.now().minusSeconds(...)`
- Stream reestruturado com nested lambdas para manter `s` (session) no escopo ao criar `SetHistoryEntry`
- `personalRecord` e `totalSets` recalculados sobre o histórico filtrado

**`ProgressController`:** `GET /api/v1/progress/exercises-done` → `progressService.getExercisesDone(user.getId())`.

**`ProgressService.getExercisesDone`:** igual ao `getTopExercises` mas sem limite — fonte do autocomplete.

#### Frontend — models e service

**`progress.model.ts`:**
```typescript
export interface ExerciseProgressEntry {
  sessionId: string; sessionStartedAt: string;
  completedAt: string; reps: number; weightKg: number; personalRecord: boolean;
}
```

**`progress.service.ts`:**
- `getExercisesDone(): Observable<TopExercise[]>` → `GET /progress/exercises-done`
- `getExerciseProgress(exerciseId, period = 'all')` → passa `period` como `HttpParams`

#### Frontend — componente

**`progress.page.ts` — novos campos:**

| Campo | Tipo | Descrição |
|---|---|---|
| `activeTab` | `string` | `'resumo'` ou `'evolucao'` |
| `exercisesDone` | `TopExercise[]` | Fonte do autocomplete, ordenada por frequência |
| `searchText` | `string` | Valor do input de busca |
| `showSuggestions` | `boolean` | Controla visibilidade do dropdown |
| `selectedExercise` | `TopExercise \| null` | Exercício selecionado |
| `exerciseProgress` | `ExerciseProgress \| null` | Dados retornados pelo endpoint |
| `exerciseLoading` | `boolean` | Spinner de carregamento do exercício |
| `exPeriod` | `string` | `'1m' \| '3m' \| '6m' \| 'all'` |
| `exPeriods` | `array` | Labels dos botões de período do card |

**Constantes de layout do SVG** (privadas): `CL=40`, `CR=285`, `CT=12`, `CB=102`, `CW=245`, `CH=90`.

**Interfaces internas:**
```typescript
interface SessionPoint { sessionId; date; maxWeight; isPR; setsCount; dateLabel; dayNum; }
interface ChartPoint   { sessionId; maxWeight; isPR; cx; cy; }
```

**Getters computados:**

| Getter | Descrição |
|---|---|
| `filteredSuggestions` | Filtra `exercisesDone` pelo `searchText`; sem texto retorna os 6 primeiros |
| `sessionPoints` | Chama `groupBySession(history)` |
| `maxLoad` | `Math.max` de `sessionPoints.maxWeight` |
| `loadDelta` | `lastWeight − firstWeight`, arredondado em 1 decimal |
| `lastSessions` | `sessionPoints` reverso, primeiros 4 |
| `chartPoints` | Mapeia `sessionPoints` para `{cx, cy}` normalizados na área do SVG |
| `chartLinePath` | String SVG `M x0 y0 L x1 y1 ...` |
| `chartYLabels` | 3 labels (max, mid, min) com `cy` calculado |
| `chartXLabels` | Até 4 labels distribuídos no eixo X |

**`groupBySession(history)`:** itera os `SetHistoryEntry`, agrupa por `sessionId`; para cada grupo acumula `maxWeight`, `setsCount` e `isPR` (true se qualquer série for PR). Ordena por data asc. Formata `dateLabel` como `"15 Jun"` usando array de meses PT-BR.

**Métodos de interação:**

| Método | Comportamento |
|---|---|
| `onExerciseSearch(event)` | Atualiza `searchText`, exibe sugestões, limpa seleção |
| `onSearchBlur()` | `setTimeout 200ms` → fecha sugestões (permite click nas sugestões disparar antes) |
| `selectExercise(ex)` | Define seleção, fecha dropdown, chama `loadExerciseProgress()` |
| `clearExercise()` | Reseta seleção, progress e texto |
| `selectExPeriod(p)` | Early-return se mesmo período; chama `loadExerciseProgress()` |
| `loadExerciseProgress()` | Chama service com `exerciseId` + `exPeriod`; gerencia `exerciseLoading` |

#### Frontend — template (`progress.page.html`)

**Tabs no `ion-header`:** segundo `ion-toolbar` com `ion-segment` + `(ionChange)` que atualiza `activeTab` sem `ngModel`.

**Aba Resumo:** conteúdo existente envolvido em `@if (activeTab === 'resumo')`.

**Aba Evolução** (`@if (activeTab === 'evolucao')`): card `.evolution-card` com:
1. Input de busca com ícone + botão clear
2. Dropdown de autocomplete (até 6 sugestões com frequência `N×`)
3. Chips de atalho (top 3 de `topExercises`) quando nenhum exercício selecionado
4. Botões de período independentes: `1M · 3M · 6M · Tudo`
5. 3 chips de métricas: Máxima (kg) · Evolução (±kg) · Sessões
6. SVG 300×130 (`viewBox`): linhas de grade + path da linha + círculos (PR em âmbar `var(--amber)` raio 5.5, normal em `var(--blue)` raio 4) + labels X e Y
7. Label "Últimas sessões" + lista das 4 mais recentes: data · separador · peso max · nº séries · badge PR
8. Estado vazio quando `sessionPoints.length === 0`

#### Frontend — estilos (`progress.page.scss`)

Bloco `.evolution-card { }` com todos os seletores aninhados:
- `.ex-search-wrapper`: flex + `var(--surface2)` + borda, `border-radius: 10px`
- `.ex-suggestions`: dropdown com `box-shadow` e `border-radius: 10px`; itens com `border-bottom` e `:active` feedback
- `.ex-quick-chips` / `.ex-chip`: chips pill com `border-radius: 99px`
- `.ex-metrics`: 3 células flex-1 com `var(--surface2)`, fonte 16px bold; `.pos` em `var(--green)`, `.neg` em `#ef4444`
- `.ex-sess-row`: flex, `padding: 7px 6px`, `border-radius: 8px`; `.is-pr` com `background: rgba(245,158,11,0.08)`
- `.pr-badge`: flex, `color: var(--amber)`, 11px bold
- Peso em sessões com PR: `[style.color]="s.isPR ? 'var(--amber)' : null"` (binding direto, não depende de CSS cascade)

---

### Progresso — destaque de PR em sessões e histórico

**`ex-sessions`:** `.ex-sess-row.is-pr` com fundo âmbar `rgba(245,158,11,0.08)` (não usa `color-mix` por compatibilidade com WebView); badge `pr-badge` estilizado dentro de `.evolution-card`; peso colorido via `[style.color]` inline.

**`.hist-item`:** mesma classe `.is-pr` com `background: rgba(245,158,11,0.08); border-radius: 8px` acionada por `[class.is-pr]="h.newPersonalRecords > 0"`.

---

### Progresso — PRs nos mini-stats

**`ProgressSummaryResponse`:** campo `long totalPersonalRecords` adicionado ao record.

**`ProgressService.getSummary`:** conta sets com `isPersonalRecord() == true` dentro de `periodSessions`:
```java
long totalPersonalRecords = periodSessions.stream()
    .flatMap(s -> s.getExercises().stream())
    .flatMap(se -> se.getSets().stream())
    .filter(SessionSet::isPersonalRecord)
    .count();
```

**`ProgressSummary` (frontend):** campo `totalPersonalRecords: number`.

**`progress.page.html`:** 6º mini-stat com valor em `color: var(--amber)` e label "PRs"; grid `1fr 1fr 1fr` acomoda 6 itens em 2 linhas sem ajuste.

---

## [2026-06-30] — Gráfico de pizza: séries por músculo na tela de Progresso

### Backend

**Novo DTO — `MuscleSetStatResponse.java`** (`com.treinus.progress.dto`):
```java
public record MuscleSetStatResponse(String category, long sets) {}
```

**`ProgressService.getSetsByMuscle(UUID userId, String period)`:**

| `period` | Filtro aplicado |
|---|---|
| `WEEK` | `finishedAt` nos últimos 7 dias |
| `MONTH` | `finishedAt` nos últimos 30 dias |
| `YEAR` | `finishedAt` nos últimos 365 dias |
| `ALL` | Sem filtro de data |

- Filtra via `findByUserIdAndStatusAndFinishedAtBetween` para períodos com data; `findByUserIdAndStatusOrderByStartedAtDesc(Pageable.unpaged())` para `ALL`
- Agrupa séries COMPLETED por `exercise.category.name()` via `Collectors.groupingBy` + `summingLong(se -> se.getSets().size())`
- Ignora exercícios sem categoria ou sem séries registradas
- Retorna lista ordenada por `sets` decrescente

**`ProgressController`:** `GET /api/v1/progress/sets-by-muscle?period=MONTH`
- `@RequestParam(defaultValue = "MONTH")` — padrão é Mês

### Frontend

**Modelo — `progress.model.ts`:**
```typescript
export interface MuscleSetStat { category: string; sets: number; }
```

**Service — `progress.service.ts`:**
```typescript
getSetsByMuscle(period = 'ALL'): Observable<MuscleSetStat[]>
// passa period como HttpParams
```

**Componente — `progress.page.ts`:**

| Adição | Detalhe |
|---|---|
| `MusclePeriod` | Tipo `'WEEK' \| 'MONTH' \| 'YEAR' \| 'ALL'` |
| `musclePeriod` | Estado local, inicializado como `'MONTH'` |
| `periods` | Array `['WEEK', 'MONTH', 'YEAR', 'ALL']` para iterar no template |
| `periodLabels` | Mapa de rótulos PT-BR (`WEEK → Semana`, etc.) |
| `loadMuscleChart()` | Chamada isolada ao service; atualiza `muscleSlices` e `totalMusclesSets` |
| `selectPeriod(p)` | Early-return se mesmo período; atualiza estado e chama `loadMuscleChart()` |
| `buildPieSlices(data)` | Gera paths SVG de donut: raio externo 80, interno 52, centro 100×100, início no topo (`-π/2`); retorna `PieSlice[]` com `path`, `color`, `label`, `sets`, `percentage` |

Cores por grupo muscular (constante `MUSCLE_COLORS` no módulo): CHEST `#f97316`, BACK `#3b82f6`, LEGS `#22c55e`, SHOULDERS `#a855f7`, ARMS `#ec4899`, CORE `#eab308`, CARDIO `#06b6d4`, FULL_BODY `#ef4444`, GLUTES `#f43f5e`, CALVES `#84cc16`, FOREARMS `#14b8a6`, NECK `#8b5cf6`.

**Template — `progress.page.html`:** card `.muscle-chart-card` inserido entre o card de XP e o Histórico:
- `.chart-header` (flex, `space-between`): título "Séries por músculo" + `.period-selector` com 4 botões pill
- `<svg viewBox="0 0 200 200">`: slices via `@for <path>` + `<text>` central com total de séries
- `.muscle-legend` em grid 2 colunas: dot colorido · nome · quantidade · percentual
- Card só renderizado quando `muscleSlices.length > 0`

**Estilos — `progress.page.scss`:**
- `.period-btn`: pill `border-radius: 99px`, estado `.active` com fundo e borda `var(--blue)`, cor `#fff`
- `.pie-svg`: 180×180px; `.pie-total-num` 22px bold; `.pie-total-lbl` 10px `var(--text3)`
- `.muscle-legend`: grid 2 colunas, gap 6px×12px
- `.legend-dot`: 8px circle; `.legend-name`: 11px, truncado; `.legend-sets`: 11px bold; `.legend-pct`: 10px `var(--text3)`

---

## [2026-06-30] — XP real, níveis progressivos, PRs no histórico e melhorias na tela de Progresso

### Fórmula de XP por treino

**`SessionService.java` — `calculateXp(int newPRs, int currentStreak)`** (método privado):

| Componente | Valor |
|---|---|
| Base | +100 XP por treino concluído |
| Recorde pessoal | +50 XP por série com `is_personal_record = true` |
| Streak 3–6 dias | +25 XP |
| Streak 7–13 dias | +50 XP |
| Streak 14+ dias | +75 XP |

- `updateUserProgress(UUID userId, int xpEarned)`: assinatura atualizada para receber o XP como parâmetro e somá-lo ao XP existente do perfil (antes sempre incrementava valor fixo)
- `finish()` e `registerManual()`: ambos calculam XP via `calculateXp()` antes de salvar a sessão

### Backfill de XP histórico — `V17__backfill_xp_earned.sql`

Nova migration Flyway que preenche o XP das sessões já registradas no banco:
1. Recalcula `xp_earned` de todas as sessões `COMPLETED` com `xp_earned = 0`: `100 + (COUNT(séries PR) × 50)` — streak ignorado (não havia como saber o streak na época)
2. Recalcula `user_profiles.xp` somando todos os `xp_earned` de sessões COMPLETED por usuário

### Sistema de níveis progressivos

#### `XpCalculator.java` — novo utilitário (`com.treinus.shared`)

Curva progressiva com 20% de crescimento por nível:
- Nível N → N+1 custa `1000 × 1.2^N` XP
- XP total para atingir nível N: `5000 × (1.2^N − 1)`

| Nível | XP para subir | XP acumulado |
|---|---|---|
| 0 → 1 | 1.000 | 1.000 |
| 1 → 2 | 1.200 | 2.200 |
| 2 → 3 | 1.440 | 3.640 |
| 3 → 4 | 1.728 | 5.368 |
| 5 → 6 | 2.488 | 9.930 |
| 9 → 10 | 5.160 | 25.959 |

Métodos públicos: `levelFromXp(int)`, `totalXpForLevel(int)`, `xpInCurrentLevel(int)`, `xpForCurrentLevel(int)`.
O nível **não é armazenado no banco** — calculado sob demanda em cada resposta.

#### Detecção de level-up em `SessionService.finish()`

Lê XP do perfil antes de atualizar → calcula `levelBefore` → após `updateUserProgress` calcula `levelAfter` → `leveledUp = levelAfter > levelBefore`.

#### DTOs e respostas atualizadas

| Arquivo | Campos adicionados |
|---|---|
| `SessionSummaryResponse.java` | `boolean leveledUp`, `int newLevel` |
| `UserResponse.java` | `Integer level` (calculado via `XpCalculator.levelFromXp`) |
| `ProgressSummaryResponse.java` | `int level`, `int xpInCurrentLevel`, `int xpForCurrentLevel` |
| `ProgressService.getSummary()` | Computa os 3 campos de nível via `XpCalculator` |

#### Frontend — modelos TypeScript

| Arquivo | Campos adicionados |
|---|---|
| `session.model.ts` (`SessionSummary`) | `leveledUp: boolean`, `newLevel: number` |
| `user.model.ts` (`User`) | `level: number` |
| `progress.model.ts` (`ProgressSummary`) | `level`, `xpInCurrentLevel`, `xpForCurrentLevel` |

#### Frontend — telas

| Tela | Mudança |
|---|---|
| `post-workout.page.html` | Banner "Você chegou ao Nível X!" exibido quando `summary.leveledUp` |
| `home.page.html` | Stat-pill exibe `Nível X · N XP` (antes só mostrava XP) |
| `profile.page.html` | Terceiro `stat-card` com o nível atual |
| `progress.page.html` | Card XP: título "Nível X", barra de progresso via `xpInCurrentLevel / xpForCurrentLevel`, texto "N XP para o Nível X+1" |

---

### Troféu de PRs no histórico de treinos

**`WorkoutHistoryResponse.java`** — novo campo `int newPersonalRecords`; `from()` recebe parâmetro adicional.

**`ProgressService.getHistory()` e `getHistoryForDate()`** — adicionada contagem de séries com `isPersonalRecord = true` para cada sessão via stream (exercises/sets já carregados nesse contexto).

**Frontend:**
- `progress.model.ts` (`WorkoutHistoryItem`): `newPersonalRecords: number`
- `progress.page.html`: badge `<span class="pr-badge">` com `ion-icon name="trophy-outline"` e contagem, visível apenas quando `> 0`
- `progress.page.scss`: `.pr-badge` — flex, ícone 13px, cor `var(--amber)`

---

### PRs no stats-grid do detalhe da sessão

Sem mudança no backend — `personalRecord` já era retornado em cada `SessionSet` do endpoint `GET /sessions/{id}`.

**`session-detail.page.ts`** — getter `totalPRs`: `exercises.reduce(...sets.filter(s => s.personalRecord).length)`

**`session-detail.page.html`** — novo `stat-cell` com troféu e contagem, exibido apenas quando `totalPRs > 0`.

**`session-detail.page.scss`:**
- Grid alterado de `repeat(4, 1fr)` para `repeat(auto-fit, minmax(60px, 1fr))` — acomoda 4 ou 5 células sem quebrar layout
- Estilo `.stat-val.pr`: cor âmbar, `display: flex`, `align-items: center`, ícone 13px

---

### Estatísticas adicionais na tela de Progresso

Novas métricas exibidas nos `mini-stats` (passa de 3 para 6 cells em 2 linhas de 3):

| Métrica | Fonte |
|---|---|
| Séries totais | Query JPQL dedicada em `TrainingSessionRepository` (COUNT via JOIN, sem carregar exercises lazily) |
| Tempo médio | `totalDurationSeconds / totalWorkouts` calculado em `ProgressService.getSummary()` |
| Tempo total | Soma de `Duration.between(startedAt, finishedAt)` das sessões já carregadas |

**Arquivos modificados:**
- `TrainingSessionRepository.java`: `countTotalSetsByUserId(@Param UUID userId)` com `@Query` JPQL
- `ProgressSummaryResponse.java`: `long totalSets`, `long totalDurationSeconds`, `long avgDurationSeconds`
- `ProgressService.java`: import `java.time.Duration` adicionado; lógica de cálculo dos 3 campos
- `progress.model.ts`: 3 campos adicionados em `ProgressSummary`
- `progress.page.html`: 3 novos `mini-stat` cells usando `formatDuration()` já existente

---

### Paginação do histórico — botão "Ver mais 20 treinos"

Sem mudança no backend — endpoint `GET /progress/history?page=N&size=20` já existia.

**`progress.page.ts`:**
- `private page = 0` e `hasMore = false` para controle de estado
- `load()`: reseta `page = 0`, atualiza `hasMore` com `h.number + 1 < h.totalPages`
- `loadMore()`: incrementa `page`, acumula resultados via `[...history, ...h.content]`

**`progress.page.html`:** botão `btn-load-more` abaixo da lista, visível apenas quando `hasMore`.

**`progress.page.scss`:** `.btn-load-more` — largura 100%, borda `1px solid var(--border)`, cor `var(--blue)`.

---

## [2026-06-28] — Dia de descanso na home, opções de ação nos cards e abandono de programa

### Dia de descanso na home (`home.page`)

**Antes:** quando `todayWorkout` era null o template sempre exibia "Nenhum treino para hoje", mesmo que o programa ativo marcasse o dia como descanso.

**Agora:** dois caminhos distintos:
- **Dia de descanso** (`isTodayRestDay = true`): card `.rest-day-card` com ícone lua, título "Dia de descanso" e subtítulo com semana do programa inline ("Semana 1 · Aproveite para recuperar. O descanso é parte do treino.")
- **Sem treino marcado** (`!isTodayRestDay`): card `.no-workout-card` original (inalterado)

**Novos getters em `home.page.ts`:**

| Getter | Descrição |
|---|---|
| `isTodayRestDay` | Percorre semanas do programa ativo procurando entry com `restDay: true` para hoje |
| `todayProgramDay` | Mesmo que `todayWorkout` mas sem filtrar `!restDay` — retorna qualquer entrada do dia |

### Treino de amanhã no card de descanso

Quando hoje é dia de descanso e `tomorrowWorkout` existe, exibe a seção "Treino de amanhã" logo abaixo do card de descanso — mesmo card já usado no fluxo pós-treino (nome, stats, prévia dos 3 primeiros exercícios, clicável para o builder).

### Botão de opções (⋮) no card de descanso

Botão `btn-edit` posicionado absolutamente no canto superior direito do `.rest-day-card` (`position: relative` + `.rest-day-menu { position: absolute; top: 10px; right: 10px }`).

**Action sheet "Dia de descanso" — novos métodos em `home.page.ts`:**

| Método | Descrição |
|---|---|
| `openRestDayOptions()` | Abre action sheet com as duas opções abaixo |
| `openRestDayWorkoutPicker()` | Lista treinos do usuário + presets para seleção |
| `assignWorkoutToRestDay(workoutId)` | Chama `programService.updateDay(..., { workoutId, restDay: false })` usando `todayProgramDay.id` — converte descanso em treino |

Opções do action sheet:
- **Adicionar treino ao programa** → picker → `updateDay` converte o dia de descanso em treino
- **Registrar treino feito** → navega para `/tabs/workouts/register?date=<hoje>`

### Botão de opções (⋮) no card "Nenhum treino para hoje"

Mesmo padrão visual do card de descanso (`.no-workout-menu`, `position: absolute`).

**Action sheet "O que deseja fazer?" — novos métodos em `home.page.ts`:**

| Método | Descrição |
|---|---|
| `openNoWorkoutOptions()` | Action sheet dinâmico: "Adicionar ao programa" só aparece se `activeProgram && todayProgramWeek` |
| `openNoWorkoutPicker()` | Lista treinos + presets para seleção |
| `addWorkoutToToday(workoutId)` | Chama `programService.addDay(programId, weekId, { dayOfWeek, workoutId, restDay: false })` — cria nova entrada para o dia |

Opções do action sheet:
- **Adicionar treino ao programa** (condicional) → picker → `addDay` cria entrada do dia
- **Registrar treino feito** → `/tabs/workouts/register?date=<hoje>`
- **Iniciar treino livre** → `/tabs/workouts`

### Abandonar programa ativo (`program-detail.page` + backend)

**Backend — `ProgramService.java`:**
- Novo método `cancel(UUID id, UUID userId)`: valida que o programa está `ACTIVE`, seta `CANCELLED` + `endedAt`, salva

**Backend — `ProgramController.java`:**
- `POST /api/v1/programs/{id}/cancel` → `programService.cancel(id, user.getId())`

**Frontend — `program.service.ts`:**
- `cancel(id: string): Observable<Program>` → `POST /programs/{id}/cancel`

**Frontend — `program-detail.page.ts`:**
- `abandonProgram()`: alert de confirmação ("O programa será marcado como cancelado. O histórico de treinos será mantido.") com botão destructive "Abandonar"

**Frontend — `program-detail.page.html`:**
- Botão `.btn-abandon` adicionado abaixo do `.btn-finish` quando `program.status === 'ACTIVE'`

**Frontend — `program-detail.page.scss`:**
- `.btn-abandon`: `background: transparent`, `border: 1px solid var(--ion-color-danger)`, `color: var(--ion-color-danger)`, `margin-top: 10px` — visualmente secundário em relação ao "Concluir"

### Week strip visível sem programa ativo (`workouts.page.html`)

**Antes:** todo o bloco week-strip + label estava dentro de `@if (activeProgram)` — sem programa ativo, mesmo com histórico de treinos, o strip nunca aparecia.

**Agora:**
- Week strip e label movidos para `@if (timelineDays.length > 0)` — independente de programa ativo
- Label adaptado: mostra `· NOME DO PROGRAMA` apenas quando `activeProgram` existe
- "Treino de hoje" e "Próxima semana" continuam dentro de `@if (activeProgram)` (dependem de programa)
- `buildTimeline()` já construía `timelineDays` quando havia histórico sem programa (o early return `if (allHistory.length === 0 && !activeProgram) return` só bloqueia quando não há nada a mostrar)

---

## [2026-06-26] — Timeline completa com todos os treinos históricos

### `ProgressService.getAllHistory()` — `progress.service.ts`

- Novo método que busca todas as sessões do usuário sem limite, percorrendo as páginas automaticamente via RxJS `expand` + `reduce` (100 itens por página)
- Retorna `Observable<WorkoutHistoryItem[]>` já concatenado
- `workouts.page.ts`: substituiu `getHistory(0, 200)` por `getAllHistory()`; `allHistory = history` (não mais `history.content`)

### `buildTimeline()` reescrito — `workouts.page.ts`

**Antes:** iterava apenas as semanas do programa ativo; sem programa, não mostrava nada; sessões avulsas nunca apareciam.

**Agora:** itera dia a dia de `startDate` até `endDate`, incluindo qualquer dia com sessão registrada, independente de programa.

#### Detalhes da nova lógica

| Conceito | Valor |
|---|---|
| `programStart` | `activeProgram.startedAt` — ancora o lookup de dias no programa |
| `startDate` | mínimo entre `programStart` e sessão mais antiga do histórico, alinhado para segunda-feira |
| `endDate` | último dia da última semana do programa, ou hoje (o que for maior) |
| `globalIndex` | dias desde `startDate` — consistente para todos os dias |
| `weekNumber` | semanas desde `startDate` (para display e agrupamento) |
| Lookup `programDayMap` | usa `programWeek = daysSinceProgram / 7 + 1` relativo ao `programStart` — **desacoplado** do `weekNumber` da timeline |

**Por que separar `programWeek` de `weekNumber`:** sem a separação, dias do programa que caem após semanas de história pré-programa recebem um `weekNumber` maior que o número real da semana no programa, resultando em `programDay = undefined` e os treinos atuais sumindo do strip.

#### Helper `toIso(d: Date)` extraído

Lógica de formatação `YYYY-MM-DD` era repetida inline; agora método privado reutilizável.

#### Campo `_todayGlobalIndex`

Calculado em `buildTimeline()` e retornado pelo getter `todayGlobalIndex`. O getter antigo calculava `(currentWeekNumber - 1) * 7 + (todayDow - 1)`, que não era mais válido com o novo indexing relativo a `startDate`.

### Fix: `tag-empty` em dias com treino avulso — `workouts.page.html`

Dias com sessão avulsa (sem `ProgramDay`) exibem o nome abreviado do treino com `tag-workout` (azul), em vez de `—` vazio:

```html
} @else if (d.sessions.length > 0) {
  <span class="day-tag tag-workout">{{ abbrev(d.sessions[0].workoutName) }}</span>
} @else {
  <span class="day-tag tag-empty">—</span>
}
```

---

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
