# Changelog — Treinus

## [2026-07-16] — Fix: 500 em todos os endpoints de Progresso, overlays escuros do Ionic e posição do btn-edit

### Bug fix crítico: 500 Internal Server Error em `/api/v1/progress/*` — `backend/pom.xml`

**Causa raiz:** o commit `97a2a521` ("Step 3: Upgrade Java Version to 25", 2026-06-11) adicionou um bloco `<configuration>` customizado no `maven-compiler-plugin` (só para registrar o annotation processor do Lombok) que **substituiu** a configuração padrão herdada do `spring-boot-starter-parent` — e essa configuração padrão inclui a flag `-parameters`. Sem ela, as classes compiladas perdem os nomes dos parâmetros de método via reflection, e o Spring 6.2 não tem mais fallback para `LocalVariableTable`: qualquer `@RequestParam`/`@PathVariable` sem `name=`/`value=` explícito falha em runtime com `IllegalArgumentException: Name for argument of type [...] not specified... Ensure that the compiler uses the '-parameters' flag`, capturado pelo `GlobalExceptionHandler` genérico (500 "An unexpected error occurred").

Como **todos** os parâmetros do `ProgressController` (`period`, `months`, `weeks`, `limit`, `exerciseId`) usam a forma curta sem nome explícito, os 6 endpoints de progresso (`summary`, `history`, `top-exercises`, `heatmap`, `weekly-volume`, `sets-by-muscle`) quebravam sempre — inclusive para um usuário novo sem nenhum dado, confirmando que não era um problema de volume/performance. Endpoints sem query params (`personal-records`, `exercises-done`) continuavam funcionando, mascarando o escopo real do bug. Também afeta silenciosamente outros controllers com o mesmo padrão (ex.: filtros `category`/`equipment` em `ExerciseController`).

**Fix:** `<parameters>true</parameters>` adicionado à configuração do `maven-compiler-plugin`. Requer rebuild completo do backend para ter efeito (build incremental não recompila arquivos inalterados).

> **Diagnóstico:** reproduzido via instância descartável do backend em porta alternativa (8081, mesmo banco) para capturar o stack trace real sem interromper a sessão de debug ativa do usuário (JDWP attach na porta 8080); confirmado com usuário de teste recém-registrado (zero sessões) antes de aplicar o fix.

---

### Overlays do Ionic (action-sheet, alert, popover) com fundo branco ilegível — `theme/variables.scss`

**Causa raiz:** nenhuma variável `--ion-overlay-background-color` estava definida, então o Ionic assume tema claro para esses componentes (`ion-action-sheet`, `ion-alert`, `ion-popover`) independentemente do resto do app já estar no tema escuro Volt — o menu de opções "Treino de hoje" (Editar/Substituir/Remover) abria com fundo branco e texto de baixo contraste.

**Fix:** adicionado `--ion-overlay-background-color: var(--surface)` + `--ion-color-step-50`/`--ion-color-step-100`/`--ion-color-step-150` em `:root`, corrigindo o fundo de qualquer action-sheet/alert/popover do app de uma vez.

---

### Botão de opções do card de hoje fora do canto — `home.page.html`/`.scss`

O `btn-edit` (⋮) do `.day-card` (treino de hoje) estava dentro do `.wc-title-row` como item de flexbox, alinhado à direita da linha do título mas não fixado no canto do card. Movido para fora do `wc-title-row`, como filho direto de `.day-card`, com posicionamento absoluto (`.day-menu { position: absolute; top: 13px; right: 14px }`) — mesmo padrão já usado em `.rest-day-menu`/`.no-workout-menu`. Adicionado `padding-right` ao `wc-title-row` para o título não ficar embaixo do botão.

---

### Auditoria de TODOs pendentes — nenhum encontrado; 1 doc desatualizada corrigida

Busca por `TODO`/`FIXME` em todo o projeto encontrou só 2 ocorrências reais (o resto — "CORPO TODO" em migrations e `ExerciseSyncService.java` — é o rótulo da categoria "corpo todo"/full body, falso positivo):

- **`CHANGELOG.md:1319`** (registrado em 2026-06-20): TODO sobre `lastWorkoutDate` marcar "treino concluído hoje" mesmo com o treino do dia trocado no programa. **Já resolvido** — `home.page.ts` (`isTodayWorkoutDone`) hoje compara `todaySessions` pelo `workoutId` específico, não mais pela data genérica. Mantido no changelog como registro histórico.
- **`backend/README.md:184`**: `XP | Estrutura implementada — fórmula a definir (TODO)`. Doc desatualizada — `XpCalculator.java` já tem a fórmula implementada (`5000 * (1.2^N - 1)`). Corrigido para refletir o código atual.

---

## [2026-07-01] — Identidade visual Treinus (Volt/Gelo): reskin completo do app e conquistas com tiers

### Contexto

Pedido: aplicar a identidade visual "Treinus — Performance atlética" (fundo preto, acento único Volt `#F2FF49`, tipografia Oswald itálica + Manrope, ícones em traço) descrita em `design_handoff_treinus_brand/README.md` (+ `Identidade Treinus.dc.html`, turn 5 / badge `5a`) em **todas as telas existentes** do frontend, não só nas duas com mockup em alta fidelidade (Início e Treino ativo). Ao longo da sessão o escopo evoluiu em passos: (1) reskin completo do app claro→escuro, (2) introdução de uma segunda cor de marca "Gelo" `#35CDEA` com papel próprio em data-viz, (3) restyle da tela de Conquistas a partir de um HTML de referência (`Conquistas Treinus.html`) com 4 tiers.

---

### 1. Fundação (tokens, fontes, ícones) — `frontend/src/theme/variables.scss`, `global.scss`, `index.html`

**Tokens substituídos** (tema claro bege multicolor → dark mono + Volt):
```
--bg:#0A0A0A  --surface:#1A1A1A  --surface2:#141414
--border:rgba(255,255,255,.08)  --border2:rgba(255,255,255,.16)
--text1:#FFFFFF  --text2:#888888  --text3:#5B5B5B
--volt:#F2FF49  --on-volt:#0A0A0A  --volt-bg:rgba(242,255,73,.12)
--danger:#FF453A  --danger-bg:rgba(255,69,58,.12)
--font-display:'Oswald'  --font-body:'Manrope'
```
Removidos `--blue/--purple/--green/--orange/--amber` (e variantes `-bg/-dark/-mid`) — toda cor categórica antiga foi remapeada para Volt (ação/pico/agora) ou tons neutros de texto/superfície. Overrides do Ionic atualizados (`--ion-color-primary` → Volt, `--ion-tab-bar-background`, `--ion-font-family` → Manrope).

**Fontes:** `index.html` ganhou `<link>` do Google Fonts para `Oswald:wght@700` e `Manrope:wght@400;500;600;700;800` (+ preconnect).

**Classes globais novas em `global.scss`** (reusadas em todo o app): `.font-display` (Oswald itálico uppercase), `.section-lbl`, `.btn-primary`/`.btn-secondary`/`.btn-dark`, `.chip`/`.chip.selected`, `.stat-card`/`.stat-card-value`/`.stat-card-label`, além de resets escuros para `ion-content`, `ion-toolbar`, `ion-tab-bar`, `ion-item`, `ion-input`/`ion-textarea`. Regra global `ion-title { font-family: Oswald itálico uppercase }` — garante que todo header de página (Treinos, Progresso, Perfil, etc.) segue a tipografia de marca sem precisar estilizar cada tela.

**Componente de ícone — `frontend/src/app/shared/icon/icon.component.ts`:** standalone `<app-icon>` com os 12 SVGs em traço 2px definidos no guia (`home, dumbbell, bar-chart, timer, person, flame, play, plus, check, calendar, heart-rate, settings`), inputs `name`/`size`/`color` (default `currentColor`)/`strokeWidth`. Importado (como standalone, via `imports`, não `declarations`) nos módulos que precisam: `TabsPageModule`, `HomePageModule`, `SessionModule`, `OnboardingPageModule`, `ProfilePageModule`. Ícones Ionicons fora desse set (dezenas de usos em todo o app) foram mantidos — já herdam `color` via CSS, então recolorem automaticamente com os novos tokens sem precisar trocar de biblioteca.

---

### 2. Tab bar — `frontend/src/app/tabs/tabs.page.html`/`.scss`

Reimplementada como pílula: `ion-tab-bar` com `--background:#141414`; cada `ion-tab-button` usa `<app-icon>` dentro de um wrapper `.tab-pill`. A aba ativa (`ion-tab-button.tab-selected`, classe que o próprio Ionic aplica no host) ganha fundo Volt + label; as inativas mostram só o ícone. Ajuste posterior: `ion-tab-bar` passou de barra flutuante com margem lateral (`border-radius:16px; margin:0 14px 6px; width:calc(100% - 28px)`) para **largura total da tela** (`width:100%; margin:0`), a pedido do usuário.

---

### 3. Home e Treino ativo — reprodução em alta fidelidade

**`home.page.html`/`.scss`/`.ts`:** header com data + saudação Oswald + avatar `#1C1C1C`; card do dia em Volt com marca d'água da letra do treino (`rgba(10,10,10,.08)`, Oswald ~62px) — letra derivada via novo getter `todayWorkoutLetter` (posição do dia entre os dias de treino não-descanso da semana, já que `ProgramDay` não tem campo de letra); botão "Iniciar treino" preto com ícone play Volt; stat cards de streak e volume semanal (novo campo `summary: ProgressSummary` carregado via `progressService.getSummary()`, com helper `formatVolume()` para exibir `"18t"`/`"320kg"`); footer da semana com dots de estado. Estados alternativos (descanso, sem treino, concluído hoje, amanhã) migrados para os novos componentes. Ajuste posterior: `.week-footer` (o `ion-footer`) passou de `background: var(--surface2)` para **transparente**, com `box-shadow:none` para remover a elevação MD que sobrava como halo claro no fundo escuro.

**`active-session.page.html`/`.scss`:** contexto "EXERCÍCIO · i/total" + cronômetro em pílula Volt; nome do exercício em Oswald; lista de séries reaproveitando `completedSets`/`plannedSets` mas com o visual de linha do guia (inativa `#1A1A1A`, concluída com check, ativa em Volt); stepper de peso/reps (botão "–" escuro/símbolo Volt, botão "+" Volt/símbolo preto); demais elementos sem mockup exato (painel de info, bloco de descanso, botões concluir/pular/finalizar, nav entre exercícios) seguem os mesmos tokens/componentes.

---

### 4. Reskin em lote — demais telas (mesmos tokens, sem mockup pixel-exato)

Convertidas seguindo o princípio "Volt só onde importa": `features/auth/{welcome,login,register,onboarding}` (+ `auth-shared.scss`), `features/workouts/{workouts.page, builder/*, manual-register, programs/program-detail}`, `features/session/finish/post-workout.page`, `features/progress/{progress.page, session-detail.page}`, `features/profile/{profile.page, achievements.page}`. Padrão aplicado: cores antigas → tokens novos; botões primários/secundários → `.btn-primary`/`.btn-secondary`; seleção tipo chip (grupo muscular, nível/objetivo no onboarding, segmentos) → padrão Volt/preto quando selecionado; badges de sucesso/conquista → Volt; títulos → `.font-display`. No onboarding, os campos `bg`/`color` por opção de nível (`onboarding.page.ts`) foram removidos — a seleção agora é 100% dirigida pelo estado `.selected`, não por cor fixa por item. Limpeza: removidos 2 métodos mortos (`getCategoryColor` em `workout-builder.page.ts` e `exercise-picker.modal.ts`) que ficaram sem uso após a troca de dots coloridos por ícone neutro.

---

### 5. Cor secundária "Gelo" `#35CDEA` — papel de "dado" vs. Volt como "pico/agora/recorde"

**Regra introduzida:** Volt fica reservado a no máximo 1–2 pontos por tela — ação primária, dado ativo/"agora" (treino em andamento, aba ativa, dia de hoje), e **recordes/PRs/contagens** (que continuam Volt por definição). Todo o restante de data-viz que antes era Volt/oliva virou Gelo.

**Novos tokens em `variables.scss`:**
```
--ice:#35CDEA  --ice-bg:rgba(53,205,234,.12)
--ice-track:#161719  --ice-track-border:rgba(255,255,255,.04)
--ice-1:#0F3A4A  --ice-2:#176079  --ice-3:#2494B4  --ice-4:#35CDEA
--ice-grad-start:#37CDEA  --ice-grad-end:#1E7C98
```

**Heatmap de frequência (`progress.page.ts`/`.html`):** saiu do esquema de opacidade única (`heatmapCellOpacity`, removido) e passou a uma escala graduada discreta — `heatmapCellColor(cell)` mapeia contagem 0→`--ice-track`, 1→`--ice-1`, 2→`--ice-2`, 3→`--ice-3`, ≥4→`--ice-4`; novo getter `heatmapMaxCount` identifica o dia-recorde do período (só quando `maxCount ≥ 2`, para não pintar de Volt todo dia comum de treino), que é renderizado em Volt. Legenda "Menos → Mais" atualizada para os 4 tons de Gelo.

**Volume por semana:** barras não-atuais passaram a usar `<linearGradient id="wv-ice-gradient">` (180deg, `--ice-grad-start` → `--ice-grad-end`) definido inline no SVG; a barra da semana atual continua sólida em Volt (o "pico/agora" do gráfico).

**Evolução de carga:** linha e pontos do SVG (`stroke`/`fill`) viraram Gelo; pontos de PR (`pt.isPR`) continuam Volt e maiores, com contorno `--on-volt` — o pico do gráfico.

**Demais conversões Volt → Gelo** (dado informativo, não pico/PR/ação): XP (valor, barra de progresso, badge no histórico — `progress.page`, `session-detail.page`), streak "dias seguidos" (`home.page`, `profile.page`), barra de progresso de programa (`home.page`), dias concluídos no heatmap semanal da Home (`.day-dot.done`) e no strip de dias da tela Treinos (`.tag-workout`, `.day-done-dot`), badge "preset" (`workouts.page`), badge "Rascunho" (`workout-builder.page`), delta de evolução positivo (`.em-val.pos`), check de séries já concluídas no Treino ativo, barra de progresso do treino no topo (`.progress-bar-fill`), passo já concluído do onboarding (`.dot.done`).

**Mantido em Volt** (conforme a regra): navegação/abas/pílula ativa, botões primários, chips de seleção, badges de contagem (séries, exercícios), valores/badges de PR, estados "agora" (cronômetro, série ativa, dia de hoje, programa ativo, indicador de treino em andamento), e os banners de XP/level-up pós-treino (tratados como o momento "agora" de celebração, não como gráfico).

---

### 6. Conquistas — dark theme com 4 tiers, a partir de `Conquistas Treinus.html`

**`achievements.page.html`:** adicionada legenda de tiers no topo (`.achv-legend` — Bronze/Prata/Ouro/Platina com dot colorido), reproduzindo a seção `.legend` do HTML de referência.

**`achievements.page.scss` — reescrita completa de `.achv-icon`:** selo circular 58px (antes 52px) com tratamento por tier:
- `.tier-bronze` (`--tier-bronze:#C58B54`, novo token) e `.tier-silver` (`--tier-silver:#C2C7D0`, novo token): `radial-gradient(circle at 50% 34%, rgba(TIER,.16), var(--surface2) 72%)` + anel `1.5px solid rgba(TIER,.42)`, sem glow.
- `.tier-gold` (reusa `--volt`) e `.tier-platinum` (reusa `--ice`): mesmo tratamento + `box-shadow: 0 0 22px -6px rgba(TIER,.55)` — só esses dois tiers brilham, reforçando a hierarquia de prestígio.
- `.locked`: fundo `--surface2` liso, anel `rgba(255,255,255,.1)`, ícone `#4a4a4a`, sem gradiente/glow.

Ícones mantidos como estavam (Tabler webfont, `<i class="ti {{a.icon}}">`) — só o container mudou. Nenhum "card de detalhe" ou "notificação de desbloqueio" com cor de tier foi encontrado em outro lugar do app (o detalhe de conquista é um `AlertController` nativo sem estilo customizado), então não havia mais nada para sincronizar.

---

### Verificação

- `cd frontend && npx ng build --configuration development` limpo após cada etapa (fundação, telas hifi, cada lote de reskin, Gelo, Conquistas).
- Varredura `grep -r "var(--blue\|--purple\|--green\|--amber\|--orange"` no app confirmando zero tokens antigos remanescentes.
- Checagem visual ao vivo: `ng serve` (porta 4300) + backend real (`mvn spring-boot:run`) via Playwright/Chromium headless — registrado usuário de teste pela UI (senha do usuário seed `teste@gmail.com` não é conhecida) e navegado pelas telas autenticadas (Início, Treinos, Progresso, Perfil, Treino ativo, Conquistas). Confirmado via inspeção de DOM: célula do heatmap em `rgb(15,58,74)` (`--ice-1`), `<linearGradient id="wv-ice-gradient">` presente com os stops corretos, barra da semana atual em Volt, e selo de conquista Bronze com o gradiente/anel esperado.

---

## [2026-07-01] — Sistema de Conquistas (Achievements): catálogo, motor de desbloqueio e UI

### Contexto

Pedido: adicionar uma seção "Conquistas" na tela de Perfil, a partir de um mockup HTML com 33 badges (ícones [Tabler](https://tabler.io/icons)) agrupados em 7 categorias, e um contrato de API (`GET /api/v1/achievements`, `POST /api/v1/achievements/ack`) descrito **como se já existisse**. Uma busca em todo o repositório (backend e frontend) confirmou que não havia nenhum código de achievements — nem entidade, nem endpoint, nem migration. O usuário optou por implementar o backend completo (catálogo real + lógica de desbloqueio baseada em dados reais de treino), não uma versão mockada.

---

### Backend — novo pacote `com.treinus.achievements`

**Migration:** `V18__create_user_achievements.sql` — única tabela nova, `user_achievements (id, user_id, code, unlocked_at, acknowledged)` com `UNIQUE(user_id, code)`. O catálogo das 33 conquistas em si **não é seed de banco** — vive como dado estático em código Java (`AchievementCatalog.ALL`), já que não há UI de admin para editá-las.

**Catálogo:**
- `AchievementCategory` (enum): `FREQUENCY, CONSISTENCY, RECORDS, VOLUME, PROGRAMS, EXPLORATION, RESILIENCE` — a 7ª categoria (`RESILIENCE`) foi incluída apesar do contrato JSON do usuário só listar 6, porque o mockup HTML claramente tinha essa categoria com 3 badges (provável esquecimento do usuário ao descrever o contrato).
- `AchievementTier` (enum): `BRONZE(25), SILVER(50), GOLD(100), PLATINUM(250)` — XP por tier, não por conquista individual.
- `Achievement` (record): `code, name, description, category, tier, icon`.
- `AchievementCatalog`: lista imutável com as 33 entradas transcritas do mockup (códigos, nomes, ícones e tiers exatamente como no HTML) + descrições em PT-BR escritas para cada uma.

**Persistência:** `UserAchievement` (entidade) + `UserAchievementRepository` (`findByUserId`, `existsByUserIdAndCode`, `acknowledgeAllForUser` via `@Modifying @Query`).

**`AchievementService`** — núcleo da feature:
- `evaluate(userId)`: carrega os códigos já desbloqueados (1 query), monta um "bundle" de estatísticas do usuário com poucas queries agregadas, e roda os predicados só para os códigos ainda bloqueados, em memória. Persiste `UserAchievement` para cada novo desbloqueio.
- `getAll(userId)`: chama `evaluate()` primeiro (retroativo) e depois combina `AchievementCatalog.ALL` com o que está salvo — importante porque usuários já existentes (ex. `teste@gmail.com`, 52 sessões) recebem conquistas retroativamente assim que a feature entra no ar.
- `ack(userId)`: marca tudo como `acknowledged = true`.

**Regras de desbloqueio implementadas** (heurísticas documentadas em código, em métodos privados isolados para fácil ajuste de limiares):

| Código | Regra |
|---|---|
| `FIRST_WORKOUT` / `WORKOUTS_10/50/100/500` | contagem de sessões `COMPLETED` |
| `YEAR_OF_WORK` | gap entre primeira e última sessão completa ≥ 365 dias |
| `STREAK_7/30/100` | maior streak já alcançado (simulado a partir do histórico de datas, não do `UserProfile.streak` atual) |
| `PERFECT_MONTH` | existe um mês em que todos os dias do calendário tiveram sessão completa |
| `FIRST_PR` / `PR_10` / `PR_50` | contagem de `SessionSet.personalRecord = true` |
| `PR_STREAK_WEEK` | ≥3 PRs na mesma semana ISO |
| `BIG_JUMP` | PR com peso ≥ 1.2× o recorde anterior do exercício |
| `VOLUME_10K/100K/1M` | soma de `totalVolumeKg` de sessões completas |
| `HEAVY_SESSION` | uma sessão com `totalVolumeKg` ≥ 5000kg |
| `PROGRAM_1` / `PROGRAM_3` | contagem de `Program.status = COMPLETED` |
| `CREATED_WORKOUT` / `CREATED_PROGRAM` | hook direto em `create()` (não conta presets adotados) |
| `NO_SKIPS_10` | ≥10 dias não-descanso completados no programa ativo, sem nenhuma sessão `ABANDONED` vinculada a um dia dele |
| `EARLY_BIRD` | sessão iniciada antes das 06:00 (hora local) |
| `WEEKEND_WARRIOR` | sessões completas no sábado e domingo da mesma semana ISO |
| `NEW_MUSCLE_GROUP` | sessão contém categoria de exercício nunca vista em sessão anterior |
| `PROGRESSIVE_OVERLOAD` | carga máxima de um exercício aumenta em 3 sessões consecutivas |
| `NO_SKIPS_PROGRAM` | programa `COMPLETED` onde todo dia não-descanso teve sessão completa |
| `HOLIDAY_WORKOUT` | sessão completa em feriado nacional fixo (sem Carnaval/Páscoa, que são móveis) |
| `COMEBACK` | streak resetou após gap ≥7 dias sem treinar |
| `SECOND_STREAK` | o streak simulado cruza o limiar de 7 dias pela 2ª vez (após um reset) |
| `RESUMED_PROGRAM` | gap ≥14 dias entre dois dias completados de um mesmo programa, seguido de outro dia completado |

**Nota de arquitetura importante:** `ProgramDay` não tem data de calendário (só `day_of_week` 1–7 relativo à semana), então nenhuma regra depende de "qual dia é hoje no programa" — tudo é derivado de timestamps reais de `TrainingSession` (`startedAt`/`finishedAt`).

**Hooks (chamada síncrona, sem eventos/`@Scheduled` — projeto não usa esse padrão):**
- `SessionService.finish()` e `registerManual()` — logo após `updateUserProgress()`
- `ProgramService.create()` e `finish()`
- `WorkoutService.create()`

**Endpoints (`AchievementController`):**
- `GET /api/v1/achievements` → `List<AchievementResponse>`
- `POST /api/v1/achievements/ack` → 204

**Métodos de repositório adicionados** (sem novas classes): `TrainingSessionRepository.findByUserIdAndStatusOrderByFinishedAtAsc`; `SessionSetRepository.findAllCompletedByUserId` (fetch join até exercise/session); `ProgramRepository.findAllByUserIdAndStatus`, `countByUserId`, `countByUserIdAndStatus`; `WorkoutRepository.countByUserId`.

---

### Frontend — modelo, service e UI

- `index.html`: adicionado `<link>` do Tabler Icons webfont (`@tabler/icons-webfont@latest/dist/tabler-icons.min.css` — **com** `/dist/`, sem o qual a fonte não carrega).
- `core/models/achievement.model.ts` + `core/services/achievement.service.ts` (`getAll()`, `ack()`) seguindo o padrão de `progress.service.ts`.
- Seção "Conquistas" adicionada inicialmente na própria tela de Perfil (grid por categoria, cores de tier reaproveitando os tokens já existentes em `variables.scss`).

---

### Bug fix — `NullPointerException` em `AchievementService.computeResults`

**Sintoma:** `GET /api/v1/achievements` retornava 500 para `teste@gmail.com` assim que a feature foi ligada: `NullPointerException: instant` em `LocalDate.ofInstant(s.getFinishedAt(), ZONE)`.

**Causa raiz:** o código assumia que toda sessão `COMPLETED` tem `finishedAt` preenchido, mas parte do histórico seedado/manual do usuário de teste tinha sessões `COMPLETED` com `finishedAt = null`.

**Fix:** helper `effectiveInstant(session)` que usa `finishedAt` e cai para `startedAt` (`NOT NULL` no schema) quando ausente — aplicado em todos os pontos que derivavam data a partir de `finishedAt` (lista de dias distintos para as regras de streak, e timestamps de conclusão de dias de programa).

---

### Bug fix — tags HTML aparecendo literalmente no alert de detalhe da conquista

**Sintoma:** ao tocar numa conquista desbloqueada, a mensagem exibia `<br><br>` e `+25 XP` literalmente na tela em vez de quebras de linha.

**Causa raiz:** `AlertController.message` no Ionic renderiza como texto puro, não HTML — padrão já registrado em memória de uma sessão anterior, mas não consultado antes de escrever esse código.

**Fix:** mensagem reescrita como uma única linha usando `·` como separador: `"{descrição} · Desbloqueado em {data} · +{xp} XP"`.

---

### Refactor — Conquistas movidas para tela dedicada

**Pedido do usuário:** a seção de Conquistas no Perfil devia virar uma única linha em `info-card` (como as demais: Nível, Objetivo, Peso), que ao ser tocada abre uma tela separada com o grid completo.

**`profile.page.ts`/`.html`/`.scss`:**
- Removida a lógica de agrupamento/categoria/modal de detalhe (movida para a nova página).
- `load()` ainda busca `GET /achievements` (necessário para mostrar a contagem `X/33` e o indicador de "novo"), mas **não chama mais `ack()`** — isso passou a ser responsabilidade da tela dedicada.
- Novo `info-row.is-clickable` com ícone `trophy-outline`, valor `{{ unlockedAchievementsCount }}/{{ achievements.length }}`, dot laranja se houver conquista nova (`hasNewAchievements`), e chevron (`chevron-forward-outline`, mesmo ícone usado em todas as outras linhas navegáveis do app).
- `goToAchievements()` → `router.navigate(['/tabs/profile/achievements'])`.

**Nova página `AchievementsPage`** (`features/profile/achievements.page.ts/.html/.scss`):
- Registrada como rota irmã dentro do mesmo `ProfilePageModule` (`{ path: 'achievements', component: AchievementsPage }`) — mesmo padrão já usado para `SessionDetailPage` dentro de `ProgressPageModule`.
- Header com botão voltar (`Location.back()`, padrão de `session-detail.page.ts`).
- Concentra toda a lógica que antes estava no Perfil: grid por categoria, cores de tier, estado bloqueado/dessaturado, dot de "novo", e o alert de detalhe ao tocar.
- Chama `ack()` no `ngOnInit()`, após carregar a lista — ou seja, o indicador de "novo" só some depois que o usuário efetivamente abre essa tela, e não só a tela de Perfil.

---

### Nota — bug pré-existente encontrado (não corrigido, a pedido do usuário)

`frontend/src/environments/environment.prod.ts` não tem o campo `apiUrl` desde o primeiro commit do repositório — `ng build --configuration production` quebra para **todos** os services, não só o de achievements. `ng build --configuration development` funciona normalmente. Deixado para uma correção futura.

---

## [2026-07-01] — Progresso do programa no program-card da homepage

### Bug fix — `programPercent` sempre retornava 0

O card do programa na homepage exibia `0% concluído` independentemente dos treinos feitos. A causa era dupla:

**1. Model frontend incompleto (`program.model.ts`)**

`ProgramDay` não declarava os campos `completed` e `lastSessionId` que o backend já enviava no `ProgramDayResponse`. O TypeScript os ignorava silenciosamente, fazendo `d.completed` ser sempre `undefined`.

Correção: adicionados `completed?: boolean` e `lastSessionId?: string` à interface `ProgramDay`.

**2. Sessões iniciadas sem vínculo ao dia do programa (`home.page.ts`)**

`startWorkout()` chamava `sessionService.start({ workoutId })` sem incluir `programDayId`. Sem esse vínculo, o `completedDaysMap` no backend nunca encontrava a sessão ao calcular `completed` para cada dia — todos ficavam `false`.

Correção: `startWorkout()` agora envia `{ workoutId: this.todayWorkout.workoutId, programDayId: this.todayWorkout.id }`.

**Cálculo do percentual reescrito (`home.page.ts`)**

```typescript
// antes
get programPercent(): number {
  if (!this.activeProgram) return 0;
  return 4; // hardcoded
}

// depois
get programPercent(): number {
  if (!this.activeProgram) return 0;
  const trainingDays = ([] as ProgramDay[])
    .concat(...this.activeProgram.weeks.map((w) => w.days))
    .filter((d) => !d.restDay);
  if (!trainingDays.length) return 0;
  const done = trainingDays.filter((d) => d.completed).length;
  return Math.round((done / trainingDays.length) * 100);
}
```

> **Nota:** sessões concluídas antes desta correção não têm `program_day_id` preenchido e não entram no cálculo. Backfill SQL foi avaliado e descartado — apenas sessões iniciadas a partir desta data incrementam o progresso.

---

## [2026-07-01] — Progresso: period selector em top exercícios, heatmap, recordes pessoais, volume semanal e bug fix de finalização

### Progresso — period selector no card "Exercícios frequentes"

O card `top-exercises-card` (aba Resumo) ganhou o mesmo seletor de período já presente no gráfico de músculo (Semana / Mês / Ano / Todos).

**Backend — `ProgressService.getTopExercises`:** assinatura atualizada para `getTopExercises(UUID userId, int limit, String period)`. Quando `period = ALL`, usa `findByUserIdAndStatusOrderByStartedAtDesc(Pageable.unpaged())`; caso contrário usa `findByUserIdAndStatusAndFinishedAtBetween` com a janela de tempo correspondente.

**Backend — `ProgressController`:** `GET /api/v1/progress/top-exercises?limit=3&period=ALL` — `@RequestParam(defaultValue = "ALL") String period`.

**Frontend:**
- `progress.service.ts`: `getTopExercises(limit = 3, period = 'ALL')` passa `period` via `HttpParams`
- `progress.page.ts`: estado `topExPeriod: MusclePeriod = 'ALL'`; `loadTopExercises()` isolado; `selectTopExPeriod(p)` com early-return
- `progress.page.html`: `.chart-header` (flex, space-between) no topo do card com título + `.period-selector` de 4 botões

---

### Progresso (Evolução) — Heatmap de frequência de treinos

Novo card `.heatmap-card` na aba Evolução mostrando um grid estilo GitHub com os dias treinados nos últimos meses, toggle 3M / 6M.

#### Backend

**Novo DTO — `HeatmapDayResponse.java`:**
```java
public record HeatmapDayResponse(String date, int count) {}
```

**`ProgressService.getHeatmap(UUID userId, int months)`:**
- Busca sessões COMPLETED via `findByUserIdAndStatusAndFinishedAtBetween` (janela `months × 30 dias`)
- Agrupa por `startedAt.toLocalDate().toString()` via `Collectors.groupingBy + counting()`
- Retorna lista `List<HeatmapDayResponse>` ordenada por data asc

**`ProgressController`:** `GET /api/v1/progress/heatmap?months=6` — `@RequestParam(defaultValue = "6")`.

#### Frontend

**`progress.model.ts`:** `interface HeatmapDay { date: string; count: number; }`

**`progress.service.ts`:** `getHeatmap(months = 6): Observable<HeatmapDay[]>`

**`progress.page.ts`:**

| Adição | Detalhe |
|---|---|
| `HeatmapCell` | Interface interna: `{ date, count, col, row, isToday }` |
| `HeatmapMonthLabel` | Interface interna: `{ label, col }` |
| `heatmapMonths` | Estado do toggle, inicia em `6` |
| `heatmapCells` | Array de células computado por `buildHeatmap()` |
| `heatmapMonthLabels` | Labels dos meses para o SVG |
| `heatmapSvgWidth` | `24 + numWeeks * 13` px |
| `heatmapTrainedDays` | Contagem de dias com ao menos 1 treino |
| `buildHeatmap()` | Alinha início para segunda-feira; itera cada dia até hoje; `col = Math.floor(offset/7)`, `row = offset%7`; adiciona label de mês quando `row===0` e mês muda |
| `heatmapCellOpacity(count)` | `0→1` (fundo), `1→0.35`, `2→0.65`, `≥3→1` (azul cheio) |
| `loadHeatmap()` / `selectHeatmapMonths(n)` | Carregam e recarregam ao trocar período |

**`progress.page.html`:** SVG scrollável (`overflow-x: auto`):
- Labels de dia (Seg, Qua, Sex) no eixo Y
- Labels de mês acima das colunas
- `<rect>` por célula: `fill: var(--blue)` quando `count > 0`, `var(--surface2)` quando 0; opacidade variável; borda de destaque para hoje
- Footer: contador "N dias treinados" + legenda de 4 quadrados (Menos → Mais)

**`progress.page.scss`:** `.heatmap-card` com `.heatmap-scroll` (`overflow-x: auto`, `-webkit-overflow-scrolling: touch`), classes `hm-day-lbl`, `hm-month-lbl`, `hm-footer`, `hm-legend`, `hm-legend-cell`.

---

### Progresso (Evolução) — Card de Recordes Pessoais

Novo card `.pr-card` após o heatmap na aba Evolução: lista os recordes pessoais atuais (melhor carga por exercício) com filtro por grupo muscular.

#### Backend

**Novo DTO — `PersonalRecordResponse.java`:**
```java
public record PersonalRecordResponse(
    String exerciseId, String exerciseName, String category,
    double weightKg, int reps, String achievedAt) {}
```

**`SessionSetRepository.findPersonalRecordsByUserId(@Param UUID userId)`** — nova query JPQL com `JOIN FETCH`:
```java
@Query("""
    SELECT ss FROM SessionSet ss
    JOIN FETCH ss.sessionExercise se
    JOIN FETCH se.exercise e
    JOIN se.session s
    WHERE s.user.id = :userId
      AND s.status = 'COMPLETED'
      AND ss.personalRecord = true
    ORDER BY ss.completedAt DESC
    """)
List<SessionSet> findPersonalRecordsByUserId(@Param("userId") UUID userId);
```

**`ProgressService.getPersonalRecords(UUID userId)`:**
- Carrega todos os sets com `personalRecord = true`
- Agrupa por `exercise.getId()` via `Collectors.toMap`, função de merge: mantém a maior carga (`a.getWeightKg().compareTo(b.getWeightKg()) >= 0 ? a : b`)
- Mapeia para `PersonalRecordResponse`, ordena por `achievedAt` desc

**`ProgressController`:** `GET /api/v1/progress/personal-records` (sem parâmetros).

#### Frontend

**`progress.model.ts`:** `interface PersonalRecord { exerciseId, exerciseName, category: string | null, weightKg, reps, achievedAt }`

**`progress.service.ts`:** `getPersonalRecords(): Observable<PersonalRecord[]>`

**`progress.page.ts`:**

| Adição | Detalhe |
|---|---|
| `prList` | `PersonalRecord[]` carregado por `loadPersonalRecords()` |
| `prCategory` | String do filtro ativo (vazio = todos) |
| `prAvailableCategories` | Getter: `Set` de categorias presentes em `prList` |
| `filteredPrList` | Getter: filtra `prList` por `prCategory` |
| `muscleLabel(cat)` | Expõe `MUSCLE_LABELS[cat]` para o template |
| `formatPrDate(dateStr)` | `"2026-06-15"` → `"15 Jun"` |

**`progress.page.html`:** card com:
- Header: título + badge de contagem em âmbar (pill)
- Filtros: scroll horizontal de botões `.period-btn` por músculo (todos + categorias disponíveis)
- Lista de `@for (pr of filteredPrList)`: nome do exercício, meta (`músculo · N reps · DD Mês`), peso em âmbar com ícone troféu
- Empty state quando `prList.length === 0`

**`progress.page.scss`:** `.pr-card` com `.pr-count-badge` (âmbar), `.pr-filter-scroll` (sem scrollbar visível, `flex-shrink: 0` nos botões), `.pr-item`, `.pr-info`, `.pr-name` (ellipsis), `.pr-meta`, `.pr-weight` (âmbar + ícone).

---

### Progresso (Evolução) — Gráfico de barras: volume por semana

Novo card `.weekly-vol-card` entre o heatmap e o card de recordes, exibindo o volume total por semana como gráfico de barras SVG, com toggle 3M (12 semanas) / 6M (24 semanas).

#### Backend

**Novo DTO — `WeeklyVolumeResponse.java`:**
```java
public record WeeklyVolumeResponse(String weekStart, double totalVolumeKg) {}
```

**`ProgressService.getWeeklyVolume(UUID userId, int weeks)`:**
- Determina `startWeek` = segunda-feira de `(todayWeekStart − (weeks−1) semanas)`
- Busca sessões via `findByUserIdAndStatusAndFinishedAtBetween`
- Agrupa `totalVolumeKg` por semana (segunda-feira) via `Collectors.groupingBy + summingDouble`
- Itera `startWeek → todayWeekStart`, preenchendo semanas sem treino com `0.0`
- Retorna lista com entrada para cada semana do intervalo (sem lacunas)

**`ProgressController`:** `GET /api/v1/progress/weekly-volume?weeks=12` — `@RequestParam(defaultValue = "12")`.

#### Frontend

**`progress.model.ts`:** `interface WeeklyVolume { weekStart: string; totalVolumeKg: number; }`

**`progress.service.ts`:** `getWeeklyVolume(weeks = 12): Observable<WeeklyVolume[]>`

**`progress.page.ts`:**

| Adição | Detalhe |
|---|---|
| `WeeklyVolumeBar` | Interface interna: `{ weekStart, totalVolumeKg, barX, barY, barW, barH, monthLabel, isCurrentWeek }` |
| `weeklyVolumeWeeks` | Toggle state: 12 (padrão) ou 24 |
| `weeklyVolumeBars` | Array computado por `buildWeeklyVolumeBars()` |
| `weeklyVolumeMaxKg` | Maior volume semanal do período |
| `weeklyVolumeAvgKg` | Média das semanas com pelo menos 1 treino |
| `buildWeeklyVolumeBars(data)` | `viewBox 0 0 300 128`; `LEFT=38, RIGHT=295, BOTTOM=105, CHART_H=95`; `step=chartW/n`, `barW=min(step×0.65, 16)`; barH proporcional ao max; semana atual `opacity=1`, demais `opacity=0.55`; label de mês quando o mês muda |
| `weeklyVolumeYLabels` | Getter: 2 labels (max e max/2) com `cy` para as linhas de grid |
| `loadWeeklyVolume()` / `selectWeeklyVolumeWeeks(n)` | Carregam e recarregam ao trocar período |

**`progress.page.html`:** SVG `viewBox="0 0 300 128"` (responsivo, `width: 100%`):
- Linha de base em `y=105`
- Linhas de grade horizontais tracejadas com labels de volume no Y (max e metade)
- Barras `<rect>` com `rx=2`; semana atual sem opacidade reduzida (destaque)
- Label de mês abaixo da primeira barra de cada mês
- Subtítulo: "X kg/semana em média" (calculado sobre semanas com treino)
- Empty state quando `weeklyVolumeMaxKg === 0`

**`progress.page.scss`:** `.weekly-vol-card` com `.chart-header` (flex, `align-items: flex-start`), `.wv-svg`, `.wv-lbl` (9px, `var(--text3)`), `.wv-month-lbl` (8px).

---

### Bug fix — Aviso falso "1 exercício não concluído" ao finalizar treino

**Arquivo:** `active-session.page.ts`

**Causa raiz:** `pendingExerciseCount` contava exercícios com `status !== 'SKIPPED' && status !== 'COMPLETED'`, o que incluía o último exercício em `IN_PROGRESS` mesmo após o usuário ter concluído todas as séries. O backend em `SessionService.finish()` já auto-completa qualquer exercício `IN_PROGRESS` com séries ao fechar a sessão, tornando o aviso um falso positivo.

**Fix aplicado:**
```typescript
// ANTES
return this.session.exercises.filter(
  (ex) => ex.status !== 'SKIPPED' && ex.status !== 'COMPLETED',
).length;

// DEPOIS
return this.session.exercises.filter(
  (ex) => ex.status !== 'SKIPPED' && ex.status !== 'COMPLETED' && ex.sets.length === 0,
).length;
```

**Raciocínio:** um exercício é "verdadeiramente pendente" apenas se nunca foi iniciado (`sets.length === 0`). Exercícios `IN_PROGRESS` com séries serão auto-completados pelo backend — mostrar aviso para eles é enganoso para o usuário. A condição `sets.length === 0` espelha exatamente a lógica do `SessionService.finish()`:
```java
.filter(se -> !se.getSets().isEmpty())
.forEach(se -> se.setStatus(COMPLETED));
```

**Cenários antes/depois:**

| Cenário | Antes | Depois |
|---|---|---|
| Fez todos os exercícios, finalizou sem clicar "Próximo" no último | ⚠️ "1 exercício pendente" (falso) | ✅ Sem aviso |
| Exercício pulado (SKIPPED) | ✅ Sem aviso | ✅ Sem aviso |
| Exercício não iniciado (PENDING, sets=[]) | ✅ Aviso correto | ✅ Aviso correto |

---

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
