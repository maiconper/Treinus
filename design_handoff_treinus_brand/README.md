# Handoff: Identidade visual Treinus (app de treino)

## Overview
Sistema de identidade visual do **Treinus**, um app de musculação. Direção "Performance atlética": base preto/branco com um único acento **Volt** (verde-limão elétrico), tipografia de display condensada e itálica (Oswald), interface em Manrope, e um set de ícones em traço. Este pacote reúne os tokens, specs de componentes e as telas de referência para aplicar a identidade no app real.

## About the Design Files
Os arquivos deste bundle são **referências de design criadas em HTML** — protótipos que mostram a aparência e o comportamento pretendidos, **não** código de produção para copiar diretamente. A tarefa é **recriar estes designs no ambiente do seu app** (React Native, Flutter, SwiftUI, Kotlin/Compose, React web, etc.), usando os padrões e bibliotecas já estabelecidos nele. Se ainda não houver um ambiente definido, escolha o framework mais adequado ao projeto e implemente a identidade lá.

O arquivo `Identidade Treinus.dc.html` é um documento de exploração com várias rodadas (turns 1–5) empilhadas verticalmente. **A identidade final é o turn 5 (badge `5a`, "Treinus — guia de marca completo")**. Os turns anteriores são o histórico de exploração e servem só como contexto; não os implemente.

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos e estados são finais e devem ser reproduzidos fielmente com as bibliotecas/padrões do seu codebase. As telas de celular no guia estão em escala reduzida (mockups ~236px de largura) para caber no board — trate as proporções e a hierarquia como corretas, mas use os tokens absolutos desta README (não meça pixels do mockup reduzido).

---

## Design Tokens

### Cores
| Token | Hex | Papel |
|---|---|---|
| `volt` | `#F2FF49` | Acento único: ação primária, dado ativo, marca, conquista. **Máx. 1 elemento Volt por tela.** |
| `track` | `#0A0A0A` | Fundo principal do app |
| `surface` | `#1A1A1A` | Cards, linhas inativas, superfícies elevadas |
| `surface-2` | `#141414` | Painéis/cards secundários (levemente mais escuro que surface em alguns contextos) |
| `gray` | `#5B5B5B` | Texto terciário / ícones em repouso mais apagados |
| `gray-text` | `#888888` | Texto secundário, labels |
| `white` | `#FFFFFF` | Texto principal |
| `on-volt` | `#0A0A0A` | Texto/ícone sobre superfícies Volt (sempre o preto Track) |

Notas de contraste: sobre Volt, sempre use `#0A0A0A`. Texto branco nunca sobre Volt.

### Tipografia
- **Display — Oswald**, weight 700, `font-style: italic`, `text-transform: uppercase`. Usado em: saudações, nomes de exercício, números grandes (peso/tempo/streak), títulos de card. `line-height` apertado (~0.85–0.9). `letter-spacing` ~0.01em.
- **Interface — Manrope**, weights 400/500/600/700/800. Usado em: labels, botões, corpo, listas, valores de série.
- Regras de escala (px, tela de celular):
  - Nome de exercício (título ativo): Oswald 700 italic, ~29px, uppercase, lh .85
  - Saudação "Olá, X": Oswald 700 italic, ~22px, uppercase
  - Números destaque (peso "50", streak "12"): Oswald 700 italic, 26–34px
  - Cronômetro: Oswald 700 italic, ~15px dentro de pílula
  - Label de seção ("TREINO DE HOJE · A"): Manrope 700, 9px, `letter-spacing: .2em`, uppercase
  - Botão: Manrope 800, ~12.5–13px, `letter-spacing: .03em`
  - Valor de série ("8 × 50kg"): Manrope 700/800, 12px
  - Corpo/descrição: Manrope 400, 11.5–13px, lh 1.5–1.6
- Fontes via Google Fonts: `Oswald:wght@500;600;700` e `Manrope:wght@400;500;600;700;800`. (Anton/Archivo/Cinzel/etc. que aparecem no arquivo pertencem a turns antigos — ignore.)

### Espaçamento & raio
- Gap padrão entre cards empilhados: 9–13px
- Padding de card: 15–18px
- Border radius: botões 10–11px · cards 12–16px · chips/pílulas 18–20px (ou `999px`) · símbolo do logo 8–12px · avatares/FABs 50%
- Tela (device screen) radius interno: 26px
- Hit target mínimo: 44px (FAB e botões +/- de peso usam 34–44px)

### Sombras
- Card de tela com destaque Volt: `0 30px 60px -24px rgba(242,255,73,.22)`
- Card de tela neutro: `0 30px 60px -24px rgba(0,0,0,.6)`
- Cards internos: sem sombra; separação por cor de superfície.

---

## Logo
Quatro variações (ver seção 01 do guia):
1. **Lockup principal** — símbolo (quadrado Volt, raio 8px, com "T" em Oswald 700 italic `#0A0A0A`) + wordmark "TREINUS" em Oswald 700 italic uppercase branco, gap ~10px.
2. **Símbolo isolado** — quadrado Volt com "T", raio 12px. Serve de ícone do app.
3. **Monocromático** — símbolo com contorno branco 2px (fundo transparente) + wordmark branco. Para fundos onde Volt não funciona.
4. **Sobre acento** — fundo Volt, símbolo preto e wordmark preto. Para splash/telas de marca.

Tagline: **"SUPERE O CRONÔMETRO"** — Manrope 700, `letter-spacing: .3em`, uppercase, cor Volt.

---

## Ícones
Set em **traço 2px, cantos vivos (stroke-linecap/linejoin round), viewBox 24×24**. Branco (`#FFFFFF`) em repouso; **Volt** no estado ativo, selecionado ou de conquista (ex.: sequência/streak, checks concluídos, aba ativa).

Ícones definidos no guia (use os paths do arquivo HTML como referência exata): Início (casa), Treinos (halter), Progresso (barras), Timer (cronômetro), Perfil (pessoa), Sequência (chama), Iniciar (play), Adicionar (+), Concluído (check), Agenda (calendário), Cardio (batimento), Ajustes (engrenagem).

Recomendação de implementação: extrair como componentes de ícone (SVG) no seu sistema, com prop de cor. Não use bibliotecas de ícone com estilo diferente (ex.: preenchidos/arredondados) — quebraria a consistência.

---

## Componentes (seção 05 do guia)
- **Botão primário** — fundo Volt, texto `#0A0A0A` Manrope 800, raio 11px, padding ~14px/26px. Quando tem ícone (play/check), ícone à esquerda, gap ~7–8px.
- **Botão secundário** — transparente, borda `rgba(255,255,255,.3)` 1.5px, texto branco.
- **Botão escuro** — fundo `#1A1A1A`, texto Volt.
- **Chips de grupo muscular** — selecionado: fundo Volt, texto preto; não-selecionado: fundo `#1A1A1A`, texto `#999`. Raio 20px, padding 9px/16px, Manrope 700 11px.
- **FAB** — círculo 44px Volt, ícone "+" preto stroke 2.6.
- **Stat card** — fundo `#141414`/`#1A1A1A`, número em Oswald italic (Volt para streak, branco para volume), label Manrope 600 ~11px `#888`. Pode ter ícone à esquerda.
- **Linha de série** — inativa: fundo `#1A1A1A`, texto `#666/#888`; ativa: fundo Volt, texto `#0A0A0A` Manrope 800. Séries concluídas mostram check Volt à esquerda do rótulo. Raio 8–9px.
- **Cronômetro (pílula)** — fundo Volt, texto preto Oswald italic, com ícone de timer à esquerda; raio 6px.
- **Stepper de peso** — linha com botão "–" (círculo escuro, símbolo Volt), valor central grande (Oswald italic) + unidade "KG", botão "+" (círculo Volt, símbolo preto).
- **Tab bar** — fundo `#141414`, raio 16px. Aba ativa = **pílula Volt** com ícone preto + label preto Manrope 700; abas inativas = ícones em traço `#666`. (Alternativas exploradas: traço superior + FAB central; e versão com rótulos sob cada ícone — ver turn 4b. A escolhida é a pílula.)

---

## Screens / Views (seção 06 do guia — telas finais)

### 1. Início (Home)
- **Purpose**: ponto de partida diário; mostra o treino do dia e o resumo de progresso.
- **Layout**: coluna. Status bar → header (saudação + avatar) → card de treino do dia (destaque Volt) → linha com 2 stat cards → tab bar fixa embaixo.
- **Componentes/conteúdo**:
  - Header: label "TER · 1 JUL" (`#888`) + "Olá, Léo" (Oswald italic 22px). Avatar circular 38px `#1C1C1C` com ícone de perfil `#888`.
  - Card do dia: fundo Volt, texto `#0A0A0A`. Marca d'água "A" gigante (Oswald italic, `rgba(10,10,10,.08)`) no canto inferior direito. Label "TREINO DE HOJE · A", título "Peito & Tríceps" (Oswald italic uppercase ~23px), meta "8 exercícios · 52 min". Botão interno preto "Iniciar treino" com ícone play Volt.
  - Stats: "12 dias seguidos" (número Volt + ícone chama Volt) e "18t volume/semana" (número branco + ícone barras branco).
  - Tab bar: Início ativo (pílula Volt), Treinos/Progresso/Perfil inativos.

### 2. Treino ativo (Active)
- **Purpose**: executar o exercício atual, registrar séries e navegar.
- **Layout**: coluna. Status bar → linha de contexto (progresso do treino + cronômetro) → título do exercício → lista de séries → stepper de peso → botão "Concluir série" fixo embaixo.
- **Componentes/conteúdo**:
  - Contexto: "TREINO A · 3/8" (`#888`) + cronômetro pílula Volt "24:18" com ícone timer.
  - Título: "Supino reto" (Oswald italic uppercase ~29px).
  - Séries: Série 1 e 2 concluídas (fundo `#1A1A1A`, check Volt, "12 × 40kg" / "10 × 45kg"); Série 3 ativa (fundo Volt, preto, "8 × 50kg").
  - Stepper: "–" / "50 KG" / "+".
  - Botão "Concluir série" (primário Volt com ícone check).

> Telas adicionais sugeridas mas ainda não desenhadas: Progresso, Perfil, Onboarding. Peça se quiser que sejam incluídas.

---

## Interactions & Behavior
- **Iniciar treino** (Home) → navega para Treino ativo na primeira série do exercício 1.
- **Stepper +/-**: ajusta o peso da série ativa em incrementos (definir passo, ex.: 2.5kg) com hit target ≥34px.
- **Concluir série**: marca a série ativa como concluída (aplica check Volt, muda para fundo `#1A1A1A`), avança destaque para a próxima série; ao terminar todas, avança para o próximo exercício e incrementa "3/8".
- **Cronômetro**: conta o tempo total do treino; opção de timer de descanso entre séries.
- **Estado ativo Volt**: exatamente um elemento Volt por tela em foco (card do dia na Home; série ativa OU cronômetro no ativo — evite dois Volt fortes competindo).
- Transições: manter curtas (~150–250ms, ease-out). Sem regras finas definidas — siga o padrão do seu app.

## State Management
- `workoutOfDay` (nome, letra, exercícios, duração estimada)
- `activeWorkout`: exercício atual, índice `x/total`, lista de séries `{reps, peso, concluída}`, série ativa
- `restTimer` / `sessionTimer`
- `stats`: streak (dias seguidos), volume semanal
- `user`: nome, avatar

## Assets
- **Ícones**: SVGs em traço definidos inline no HTML (12 ícones) — recrie como componentes no seu sistema. Sem dependência externa de biblioteca de ícones.
- **Fontes**: Google Fonts (Oswald, Manrope).
- **Avatar/fotos**: nenhum asset real incluído; usar placeholders/foto do usuário.
- **Ícone do app**: derivar do "símbolo isolado" (quadrado Volt + T). Posso gerar em alta resolução se quiser.

## Files
- `Identidade Treinus.dc.html` — documento de design completo. **Implementar o turn 5 / badge `5a`.** Turns 1–4 são histórico de exploração (contexto apenas).
