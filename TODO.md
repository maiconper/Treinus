# TODO — Treinus

Pendências conhecidas que precisam de ação futura. Diferente do `CHANGELOG.md` (log histórico do que já foi feito), este arquivo é pra ser **editado**: quando um item é resolvido, remove daqui e (se relevante) registra no `CHANGELOG.md`.

## Feature: reps personalizadas por série ao adicionar exercício no treino

**Problema:** ao configurar um exercício no builder (`exercise-config.modal.ts`), só dá pra definir um número de séries (`sets`) e **um único valor de reps** (`reps`) aplicado igualmente a todas as séries — não existe forma de dizer, por exemplo, "série 1: 12 reps, série 2: 10 reps, série 3: 8 reps" (padrão comum em treino piramidal/drop-set). No backend, `WorkoutExercise` (`WorkoutExercise.java:34-40`) armazena `plannedSets` (contagem) + `plannedRepsMin`/`plannedRepsMax` (uma faixa única pro exercício inteiro) — não há campo pra reps por série individual, então isso exigiria mudança de schema (ex.: tabela `planned_sets` com uma linha por série, reps próprio cada uma) além da UI.

**Desejado:** opção de personalizar o número de reps de cada série individualmente, **mantendo o comportamento atual (mesma reps pra todas as séries) como padrão** — ou seja, não pode ser uma mudança obrigatória/quebrar o fluxo simples de hoje.

**A decidir:** modelagem no banco (linha por série vs. lista de reps serializada), como fica a UI do `exercise-config.modal` pra alternar entre "reps única" e "reps por série" sem complicar o fluxo padrão, e se isso também precisa refletir na tela de execução do treino (`SessionModule`) e no registro manual.

## Bug/melhoria: dias de descanso não contam pro streak ("dias seguidos")

**Problema:** o streak exibido na home (`ProgressSummary.streak`) é calculado em `SessionService.java` (~linha 373-381): só incrementa quando `lastWorkout.equals(today.minusDays(1))`, ou seja, exige uma sessão **concluída** no dia anterior. Um dia de descanso planejado (`ProgramDay.restDay = true`) não gera sessão, então quebra o streak mesmo quando o usuário está seguindo o programa corretamente.

**Desejado:** considerar dia de descanso programado como um dia "válido" pro streak — não deveria zerar a sequência.

**A decidir:** a lógica de streak fica só no backend (`SessionService`, provavelmente precisa consultar `ProgramDay`/`ProgramWeek` do programa ativo pra saber se o dia anterior era descanso) ou também precisa ajustar `UserProfile.streak`/`lastWorkoutDate` (`UserProfile.java`) pra guardar esse contexto; como tratar dias de descanso não-planejados (fora do programa) ou quando não há programa ativo.

## Bug: % concluído do programa ativo travado, não avança

**Sintoma relatado:** o "% concluído" do programa ativo (card na home, `programPercent`, `home.page.ts:290-298`) fica travado num valor baixo (ex.: 2%) por muito tempo, concluindo ou não os treinos.

**Causa raiz (já diagnosticada):** o getter `todayWorkout` (`home.page.ts:214-222`) percorre `activeProgram.weeks` **na ordem** e retorna o primeiro dia cujo `dayOfWeek` bate com hoje — ou seja, sempre resolve pra um `ProgramDay` da **Semana 1**, nunca da semana atual real (que já existe calculada corretamente em outro getter, `todayProgramWeek`, `home.page.ts:161-169`, via `activeProgram.startedAt`). Como `startWorkout()` (`home.page.ts:557`) usa `todayWorkout.id` como `programDayId` ao iniciar a sessão, toda sessão concluída — não importa a semana real — fica registrada contra um `ProgramDay` da Semana 1. No backend, `completedDaysMap()` (`ProgramService.java:297`) marca conclusão por `programDayId` específico, então o conjunto de dias concluídos trava no tamanho da Semana 1 (poucos dias) e nunca cresce, mesmo com treinos concluídos normalmente nas semanas seguintes.

**Fix (não aplicado ainda, a pedido do usuário — só registrado):** trocar o loop de `todayWorkout` pra usar `todayProgramWeek` (a semana calculada corretamente) em vez de iterar a partir da Semana 1. Provavelmente `todayProgramDay` (`home.page.ts:234-242`) tem o mesmo bug (mesmo padrão de loop) e usa o resultado errado em `assignWorkoutToRestDay`/`openWorkoutOptions` etc. — vale checar/corrigir junto.

## Feature: selo de destaque nas mini-stats do Resumo (percentil entre usuários)

**Pedido:** na aba Resumo de Progresso (`progress.page.html:408-434`, seção `.mini-stats` — hoje 6 cards: Sequência, Treinos, Séries, Tempo médio, Tempo total, PRs), cada mini-stat deve ganhar um selo de destaque quando o usuário estiver **entre os 20% melhores do app** naquela métrica, com texto tipo "Entre os 3% que mais treinaram" (percentil exato, não só o corte de 20%).

**Gap atual:** isso não existe em nenhuma forma hoje — `ProgressSummaryResponse`/`ProgressService` calculam tudo **por usuário**, sem nenhuma consulta cross-user. Não há infraestrutura de ranking/percentil no backend (busquei por `leaderboard`/`ranking`/`percentile` no código, zero resultados). Precisa de query agregada nova comparando o valor do usuário contra a distribuição de todos os usuários, por métrica.

**Regras a definir (o usuário pediu explicitamente pra pensar nisso):**
- Corte de exibição: só mostra selo se ≤ 20% melhores — mas o texto exibe o percentil real ("3%", "17%", etc.) ou sempre arredonda pra faixas fixas (top 1/5/10/20%)?
- Cada mini-stat compara em cima de qual janela de tempo — o período selecionado na UI (`statsPeriod`/`periods`, já existe seletor Semana/Mês/Ano/Tudo) ou sempre "tudo"? Comparar por período levanta a questão de "top 3% da semana" ser instável/sem sentido pra usuários novos.
- Critério de elegibilidade: usuário com poucos dados (ex.: cadastrado ontem, 1 treino) pode aparecer "top 3%" de forma enganosa — precisa de um mínimo de amostra (ex.: só entra no ranking com N treinos completados)?
- Performance: computar percentil em tempo real pra cada request de summary, pra todo usuário, contra toda a base, não escala — provavelmente precisa de um job/cache (ex.: recalcular percentis periodicamente, tipo uma materialized view ou tabela de snapshot) em vez de calcular on-demand.
- Se cada uma das 6 métricas tem seu próprio percentil independente (usuário pode ser "top 3%" em Séries mas "top 40%" em Tempo médio) — parece ser a intenção, já que o pedido é "cada mini-stat".

## Feature: gráfico radar de valências físicas no perfil do usuário

**Pedido:** gráfico tipo radar/aranha (referência: imagem anexada pelo usuário, estilo hexágono com eixos 0-100) na aba Perfil (`profile.page.html`), com um eixo por valência física, evoluindo conforme a pessoa treina. Valências sugeridas pelo usuário (a validar): força, velocidade, potência, resistência, alongamento.

**Gap atual:** não existe nenhuma classificação de exercício por valência física hoje. `Exercise.java` só tem `category` (grupo muscular — `ExerciseCategory`: CHEST/BACK/LEGS/SHOULDERS/ARMS/CORE/CARDIO/FULL_BODY/GLUTES/CALVES/FOREARMS/NECK) e `equipment`. Pra esse radar existir é preciso: (1) taxonomia nova de valência física, (2) marcar cada exercício do catálogo (`V8__seed_exercises.sql` e os que vêm do ExerciseDB via `ExerciseSyncService`) com qual(is) valência(s) ele trabalha, e (3) uma fórmula pra transformar histórico de séries/sessões numa pontuação 0-100 por valência.

**A decidir:**
- Lista final de valências (força/velocidade/potência/resistência/alongamento é o ponto de partida do usuário — ex.: exercício de cardio longo é "resistência", exercício explosivo/pliométrico é "potência", exercício de carga alta e poucas reps é "força"; velocidade e alongamento são mais difíceis de inferir só de peso×reps, podem precisar de dado que hoje não é capturado, tipo tempo de execução ou amplitude).
- Um exercício pode contribuir pra mais de uma valência ao mesmo tempo, com pesos diferentes (ex.: agachamento = força + um pouco de potência)?
- Fórmula de pontuação: volume/frequência acumulada por valência, normalizada de alguma forma pra caber em 0-100 (percentil entre os próprios treinos do usuário? escala fixa por total de séries?).
- Exercícios já cadastrados nunca terão a valência marcada retroativamente sem uma migration de dados/curadoria manual — catálogo é grande (ver `V8__seed_exercises.sql`, `V14__exercise_descriptions_and_images.sql`).
- Biblioteca de gráfico radar no frontend (Ionic/Angular) — hoje o app usa SVG desenhado à mão pros outros gráficos (heatmap, volume semanal, evolução de carga em `progress.page.ts`), então provavelmente seguiria o mesmo padrão em vez de trazer uma lib nova.

## Feature: molduras de foto de perfil desbloqueadas por XP

**Pedido:** molduras decorativas ao redor da foto de perfil (exibida na home e na página do usuário), que mudam conforme o usuário acumula XP.

**Gap atual — pré-requisito que não existe:** hoje **não há foto de perfil real em lugar nenhum do app**. Na home (`home.page.html:11-18`) o avatar é um ícone genérico fixo (`<app-icon name="person">`); no Perfil (`profile.page.html:12`, `.avatar-lg`) é só as iniciais do nome (`userInitials`). Não há campo de foto no `User`/`UserProfile` no backend, nem upload, nem storage de imagem. Essa feature de molduras depende de foto de perfil existir antes — ou a moldura teria que envolver as iniciais/ícone mesmo, sem foto real por trás (a decidir).

**Desejado:** conjunto de molduras com desbloqueio progressivo por faixa de XP/nível (já existe `XpCalculator.levelFromXp`/nível no `UserProfile`), aplicada automaticamente conforme o nível atual do usuário, visível na home e no Perfil.

**A decidir:**
- Se depende de foto de perfil (upload de imagem — feature própria, com storage/CDN a definir) ou funciona só ao redor do avatar de iniciais/ícone atual.
- Quantas molduras e em quais faixas de XP/nível — reaproveitar o conceito de tiers já usado em Conquistas (bronze/prata/ouro/platina, `achievements.page.scss`) ou criar uma escala própria por nível.
- Assets: SVG/ilustração pra cada moldura (mesma linha visual do app, traço 2px + Volt/Gelo) — precisa de design, não só código.
- Onde fica guardado "qual moldura está ativa" — é sempre a mais alta desbloqueada (automático pelo nível) ou o usuário pode escolher entre as já desbloqueadas (aí precisa de campo novo tipo `selectedFrameId` no perfil)?

## Feature: opção "deixar pra depois" no diálogo de pular exercício

**Problema:** hoje `skipExercise()` (`active-session.page.ts:156-181`) abre um `AlertController` só com campo de motivo (texto livre opcional) e um botão "Pular", que chama `SessionService.skipExercise()` (`SessionService.java:274-290`) — isso marca o `SessionExercise` como `SKIPPED` **permanentemente** (`SessionExerciseStatus`: `PENDING/IN_PROGRESS/COMPLETED/SKIPPED`) e segue pro próximo. Não existe conceito de "adiar" — só pular de vez.

**Desejado:** no mesmo diálogo, além de "Pular" (definitivo, com motivo), adicionar opção "Deixar pra depois" (ex.: aparelho ocupado) — o exercício sai da posição atual mas volta a aparecer mais adiante na mesma sessão, em vez de ficar marcado como pulado.

**A decidir:**
- Implementação: reordenar (mover o `orderIndex` desse `SessionExercise` pro fim da lista, mantendo status `PENDING`) vs. criar um novo status (`POSTPONED`) tratado como "pular por ora, mas reaparece depois" — reordenar parece mais simples já que `orderIndex` já existe e já controla a sequência (`TrainingSession.exercises`, `@OrderBy("orderIndex ASC")`).
- O que acontece se o exercício adiado for adiado de novo e virar o último da lista — evitar loop (adiar pro fim indefinidamente sem nunca fazer) ou deixar explícito que na última vez não tem mais "depois" pra empurrar.
- Se adiar reseta o descanso/timer atual (`startRest`) do próximo exercício ou segue normalmente.
- Precisa de endpoint novo no backend (`POST /sessions/{id}/exercises/{exerciseId}/postpone`?) ou dá pra reaproveitar `skipExercise` com um flag (`postpone: boolean`) na mesma request.

## Melhoria: mostrar quais recordes pessoais foram batidos ao concluir treino

**Problema:** a tela pós-treino (`post-workout.page.html:32-33`) só mostra a contagem — "🎉 N novo(s) recorde(s) pessoal(is)!" — sem dizer quais exercícios/cargas foram recordes.

**Bom saber:** o dado já existe no objeto recebido, não precisa de nada novo no backend. `SessionSummary.exercises` (`session.model.ts:85`) já traz `SessionExercise[]`, cada um com `exerciseName` (`session.model.ts:16`) e `sets: SessionSet[]`, e cada `SessionSet` já tem a flag `personalRecord?: boolean` (`session.model.ts:10`) + `weightKg`/`reps`. É só filtrar `summary.exercises` pelos sets com `personalRecord === true` e listar exercício + carga na tela — puramente frontend.

**Desejado:** na tela pós-treino, ao lado/abaixo da contagem de PRs, listar cada recorde batido (nome do exercício + peso/reps), não só o número.

## Melhoria: catálogo de exercícios e treinos precisa estar mais completo

**Pedido (amplo, a refinar):** trabalhar melhor o catálogo de exercícios e os treinos prontos (presets) — está incompleto.

**Estado atual do catálogo** (levantado via banco local, pode já ter mudado): 91 exercícios no total, distribuídos assim:

| Categoria | Qtd |
|---|---|
| LEGS | 14 |
| CHEST | 14 |
| BACK | 12 |
| ARMS | 12 |
| CORE | 10 |
| SHOULDERS | 8 |
| FULL_BODY | 6 |
| GLUTES | 6 |
| CARDIO | 5 |
| CALVES | 4 |
| FOREARMS | 0 |
| NECK | 0 |

- `FOREARMS` e `NECK` existem no enum `ExerciseCategory` mas **nenhum exercício cadastrado** nessas categorias.
- **68 dos 91 exercícios (75%) sem `gif_url`** — sem demonstração visual no app. Já existe um mecanismo pra isso: `ExerciseSyncService` (`ExerciseSyncService.java`) mapeia nome em português → termo de busca em inglês e busca no ExerciseDB (API externa, `exercisedb.api-key` em `application.yml`) pra preencher `gifUrl`/dados. Vale conferir se o mapa `PT_TO_EN` cobre todos os 91 exercícios e se o sync já rodou/falhou silenciosamente pra algum.
- Nenhum exercício sem `description` ou `equipment` (esses dois já estão 100% preenchidos).
- 9 treinos preset hoje (`Push`, `Pull`, `Legs`, `Full Body — Força`, `Core`, `Upper A/B`, `Lower A/B`), cada um com 5-9 exercícios — cobrem os splits mais comuns (push/pull/legs, upper/lower, full body).

**A decidir/perguntar ao usuário:** o que "mais completo" significa concretamente — mais exercícios por categoria (quantos/quais), preencher os GIFs faltantes via `ExerciseSyncService`, cobrir `FOREARMS`/`NECK`, mais variedade de treinos preset (outros splits, outros níveis de experiência), ou algo específico que o usuário tinha em mente e não detalhou ainda.

## Feature: mapa muscular (figura do corpo humano) com estado de recuperação por região

**Pedido:** ilustração do corpo humano onde cada região muda de cor conforme o estado de recuperação — treinada recentemente = vermelho, descansada = verde (e provavelmente uma faixa intermediária, tipo amarelo/laranja).

**Gap atual:** não existe nenhum asset de corpo humano no projeto (busquei em `design_handoff_treinus_brand/`, nada). Também não existe a métrica que essa feature precisa: "há quantos dias essa região foi treinada pela última vez". Hoje só existe `getSetsByMuscle` (`ProgressService.java:179-210`), que soma **volume total de séries por categoria num período** — é cumulativo, não diz "última vez que treinou X". Precisaria de uma query nova tipo `MAX(session.finishedAt)` agrupado por `Exercise.category` das sessões completadas do usuário.

**A decidir:**
- Granularidade: mapear direto em cima do `ExerciseCategory` atual (CHEST/BACK/LEGS/SHOULDERS/ARMS/CORE/GLUTES/CALVES/FULL_BODY/CARDIO/FOREARMS/NECK — já existe, mas é grosseiro: "ARMS" mistura bíceps+tríceps, "LEGS" mistura quadríceps+posterior) ou criar uma taxonomia anatômica mais fina — trade-off parecido com o item de "valências físicas" acima (reaproveitar dado existente vs. taxonomia nova + recategorização do catálogo).
- Regra de recuperação: quantos dias pra virar "descansado" (verde)? Provavelmente varia por grupo muscular (perna recupera diferente de bíceps) — definir por categoria ou um valor único simples pra começar.
- Escala de cor: binário (vermelho/verde) ou gradiente com estágio intermediário, no estilo do gradiente Gelo já usado no heatmap de frequência (`heatmapCellColor`, `progress.page.ts`)?
- Visão frontal cobre a maioria das regiões, mas costas/posterior de coxa/glúteos não aparecem de frente — precisa de duas ilustrações (frente/costas) ou só a frontal já é aceitável pro escopo inicial?
- Asset: precisa de ilustração SVG do corpo (design novo, não existe nada reaproveitável hoje) com regiões demarcadas/clicáveis, na mesma linha visual do app (traço 2px, paleta Volt/Gelo).
- Onde entra na navegação — aba própria, dentro de Progresso, ou no Perfil (perto do gráfico de valências físicas, já registrado acima)?

## Feature: gerador automático de treinos (por tempo disponível + grupo muscular)

**Pedido:** gerar um treino automaticamente a partir de dois parâmetros — tempo disponível e grupo(s) muscular(es) selecionado(s) — em vez do usuário montar exercício por exercício no builder.

**O que já existe e dá pra reaproveitar:**
- Filtro de exercícios por `ExerciseCategory` já funciona (`GET /exercises?category=`, `ExerciseController.java:46`) — é a dimensão de "grupo muscular selecionado".
- Já existe fórmula de duração estimada: `estimatedMinutes()` (`home.page.ts:274-281`) calcula `plannedSets × (45s + restSeconds)` por exercício. O gerador provavelmente usa essa mesma fórmula **de trás pra frente**: dado um tempo-alvo, decidir quantos exercícios/séries cabem.
- Criação de treino hoje é manual, exercício por exercício, via `workout-builder.page.ts` + `WorkoutService.addExercise()` — o gerador precisaria montar essa mesma estrutura (`Workout` + `WorkoutExercise[]`) programaticamente, só que de uma vez, provavelmente reaproveitando o mesmo endpoint de criação em lote (se existir) ou chamando `addExercise` repetidamente.

**A decidir:**
- Onde roda o algoritmo de seleção — backend (novo endpoint `POST /workouts/generate`?) ou frontend (busca exercícios da(s) categoria(s) via API existente e monta a lista localmente)? Backend parece mais correto pra poder evoluir a lógica sem depender de release do app.
- Critério de seleção dos exercícios dentro da categoria: aleatório, balanceado por sub-grupo (evitar gerar só "supino" três vezes pra CHEST), priorizar exercícios que o usuário não fez há mais tempo, considerar equipamento disponível (`Equipment` já existe no `Exercise`)?
- Distribuição de séries/reps padrão por exercício gerado (segue os planned padrão dos presets, tipo 3×8-12?) ou varia com o tempo total (mais tempo = mais séries por exercício vs. mais exercícios)?
- Múltiplos grupos musculares numa geração só (ex.: "Peito + Tríceps, 45 min") — como dividir o tempo entre eles?
- O treino gerado vira um `Workout` salvo normal (editável depois, reaproveitável) ou é descartável/único pra aquela sessão?

## Feature: feedback de percepção de esforço ao concluir série/exercício (leve/pesado)

**Pedido:** ao concluir uma série ou um exercício, perguntar pro usuário como foi a percepção de esforço (leve, pesado, etc. — estilo RPE).

**Gap atual:** nenhum dos dois pontos de conclusão captura isso hoje:
- Série: `logSet()` (`active-session.page.ts:136-154`) manda só `reps`/`weightKg` pro endpoint `POST /sessions/{id}/exercises/{sessionExerciseId}/sets` (`SessionController.java:58-65`), corpo `RecordSetRequest` (`reps`, `weightKg` — só isso, `RecordSetRequest.java`). `SessionSet` (`SessionSet.java`) não tem coluna pra isso.
- Exercício: `completeExercise()` (`SessionController.java:68-74`) não recebe corpo nenhum.

**Desejado:** capturar uma avaliação subjetiva de esforço (ex.: escala simples "leve / bom / pesado", ou RPE numérico 1-10) ao concluir série e/ou exercício.

**A decidir:**
- Granularidade: por série (mais preciso, mas pode cansar o usuário de responder toda hora — o pedido menciona "série, ou exercício", sugerindo talvez só uma das duas) ou só por exercício (um resumo geral ao terminar todas as séries daquele exercício).
- Escala: RPE numérico (1-10, padrão de treino de força) vs. escala simples de 3 pontos (leve/ideal/pesado) — a segunda é mais rápida de responder em pé no meio do treino.
- UI: modal/alert a cada série (pode ser intrusivo, considerando que já existe o fluxo de descanso `startRest` logo depois de cada série) vs. seletor inline sem bloquear o fluxo.
- Schema novo: coluna em `SessionSet` (ex.: `perceived_effort`) e/ou em `SessionExercise` — precisa migration.
- Uso futuro do dado (vale já pensar no design pra não desperdiçar): poderia alimentar sugestão de carga pra próxima vez ("da última vez você achou pesado, bora manter o peso"), e cruzar com as features já registradas de valências físicas e mapa muscular (esforço percebido como sinal extra além de volume/frequência).
