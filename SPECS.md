# Treinus — Definições Iniciais do MVP

**Versão:** 0.1  
**Data:** 09/06/2026  
**Status:** Decisão inicial de arquitetura e stack

---

## 1. Decisão principal

O MVP será construído com **frontend separado do backend**, usando uma arquitetura simples, modular e preparada para evolução futura.

```txt
Mobile MVP
Angular + Ionic + Capacitor
        ↓
Spring Boot REST API
        ↓
PostgreSQL
```

A decisão inicial é começar com um **monólito modular no backend**, evitando microsserviços no MVP.

---

## 2. Stack definida para o MVP

### 2.1 Frontend mobile

```txt
Angular
Ionic
Capacitor
TypeScript
```

O aplicativo será desenvolvido como uma aplicação mobile híbrida, com foco em velocidade de desenvolvimento e reaproveitamento do conhecimento atual em Angular.

### 2.2 Backend

```txt
Spring Boot
Java
Spring Security
JWT
PostgreSQL
Flyway
OpenAPI/Swagger
```

O backend será uma API REST independente do frontend. Isso permitirá que, no futuro, o app em Angular/Ionic seja substituído por aplicativos nativos em Kotlin e Swift sem necessidade de reescrever o backend.

### 2.3 Banco de dados

```txt
PostgreSQL
```

O PostgreSQL será o banco principal do MVP, armazenando usuários, treinos, exercícios, programas, sessões, séries executadas e dados de progresso.

---

## 3. Arquitetura escolhida

### 3.1 Frontend separado do backend

O frontend mobile consumirá a API do backend por HTTP/REST.

```txt
Angular/Ionic
   ↓ REST/JSON
Spring Boot
   ↓
PostgreSQL
```

Essa separação permite:

- trocar o frontend no futuro sem alterar o backend;
- criar app nativo em Kotlin e Swift posteriormente;
- manter regras de negócio centralizadas no backend;
- evoluir o backend sem depender diretamente da tecnologia da interface.

---

## 4. Abordagem do backend

### 4.1 Monólito modular

O backend será um **monólito modular**, com separação por módulos de negócio.

Não serão usados microsserviços no MVP.

Motivos:

- menor complexidade operacional;
- deploy mais simples;
- debugging mais fácil;
- desenvolvimento mais rápido;
- melhor para validar o produto antes de escalar arquitetura.

### 4.2 Módulos iniciais do backend

```txt
auth
users
exercises
workouts
programs
sessions
progress
```

Descrição dos módulos:

| Módulo | Responsabilidade |
|---|---|
| `auth` | Cadastro, login, JWT e autenticação |
| `users` | Perfil, nível, objetivo e preferências |
| `exercises` | Catálogo de exercícios |
| `workouts` | Treinos avulsos e exercícios do treino |
| `programs` | Programas semanais e estrutura de semanas |
| `sessions` | Execução do treino, séries, cargas e reps |
| `progress` | Histórico, volume, PRs, evolução e estatísticas |

---

## 5. Responsabilidade das regras de negócio

As regras principais devem ficar no backend, não no Angular.

### 5.1 Regras que devem ficar no Spring Boot

```txt
cálculo de volume
cálculo de XP
streak
records pessoais / PRs
programa ativo
conflito ao iniciar novo programa
conclusão de treino
histórico
evolução de carga
resumo pós-treino
```

### 5.2 Responsabilidades do Angular/Ionic

```txt
interface do usuário
navegação
formulários
validações simples de tela
experiência mobile
execução visual do treino
armazenamento temporário/local do treino ativo
sincronização com a API
```

O app pode validar campos e melhorar a experiência do usuário, mas a regra final deve ser confirmada no backend.

---

## 6. Offline e sincronização

Um ponto importante do MVP é garantir que o usuário não perca o treino em andamento caso esteja sem internet na academia.

### Estratégia inicial

O app deve salvar localmente:

```txt
sessão de treino ativa
exercício atual
séries concluídas
carga
repetições
tempo de descanso
exercícios pulados
motivo do pulo
```

Depois, quando houver conexão, o app sincroniza com o backend.

Para o MVP, isso pode começar simples:

```txt
Angular/Ionic local storage ou SQLite
        ↓
sincronização com Spring Boot
        ↓
PostgreSQL
```

---

## 7. Entidades iniciais do banco

Primeira versão sugerida do modelo de dados:

```txt
users
user_profiles
exercises
workouts
workout_exercises
programs
program_weeks
program_days
training_sessions
session_exercises
session_sets
```

### Descrição resumida

| Entidade | Descrição |
|---|---|
| `users` | Dados principais da conta |
| `user_profiles` | Nível, objetivo, dias disponíveis e preferências |
| `exercises` | Catálogo de exercícios |
| `workouts` | Treinos criados pelo usuário ou do catálogo |
| `workout_exercises` | Exercícios dentro de um treino |
| `programs` | Programas de treino |
| `program_weeks` | Semanas do programa |
| `program_days` | Dias de treino/descanso dentro da semana |
| `training_sessions` | Sessão executada pelo usuário |
| `session_exercises` | Exercícios executados na sessão |
| `session_sets` | Séries registradas, com carga e repetições |

---

## 8. Endpoints iniciais da API

Sugestão inicial de organização da API:

```txt
/api/v1/auth
/api/v1/users
/api/v1/exercises
/api/v1/workouts
/api/v1/programs
/api/v1/sessions
/api/v1/progress
```

### Exemplos de endpoints importantes

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh

GET  /api/v1/users/me
PUT  /api/v1/users/me/profile

GET  /api/v1/exercises
POST /api/v1/workouts
GET  /api/v1/workouts/{id}

POST /api/v1/programs
GET  /api/v1/programs/active
POST /api/v1/programs/{id}/start

POST /api/v1/sessions/start
POST /api/v1/sessions/{id}/sets
POST /api/v1/sessions/{id}/skip-exercise
POST /api/v1/sessions/{id}/finish

GET  /api/v1/progress/summary
GET  /api/v1/progress/exercises/{exerciseId}
GET  /api/v1/progress/history
```

---

## 9. O que entra no MVP

### Funcionalidades principais

```txt
cadastro e login
onboarding
perfil do usuário
catálogo inicial de exercícios
criação de treino avulso
criação de programa de treino
programa ativo
execução de treino
registro de séries, carga e repetições
timer de descanso
pular exercício com motivo opcional
resumo pós-treino
histórico de treinos
progresso por exercício
volume semanal
XP e streak básico
```

---

## 10. O que fica fora do MVP

Para evitar complexidade inicial, ficam fora da primeira versão:

```txt
Kong/API Gateway
mensageria
microsserviços
Redis
TimescaleDB
Kafka
RabbitMQ
painel de personal trainer
chat
leaderboard
feed social
integração Apple Health
integração Google Fit
múltiplos programas ativos simultâneos
```

Esses itens podem ser avaliados após validação do produto com usuários reais.

---

## 11. Quando considerar mensageria

Mensageria não será usada no início.

Ela pode entrar no futuro quando houver necessidade de processamentos assíncronos, como:

```txt
envio de notificações push
processamento de resumo pós-treino
recalcular XP, streak e PRs em background
processar uploads
enviar emails
gerar relatórios
sincronização offline mais robusta
```

Possíveis opções futuras:

```txt
RabbitMQ
AWS SQS
Google Pub/Sub
```

Kafka não é necessário para o MVP.

---

## 12. Quando considerar Kong/API Gateway

Kong não será usado no MVP.

Ele pode fazer sentido no futuro se o sistema passar a ter:

```txt
vários serviços
APIs públicas para terceiros
rate limit centralizado
autenticação centralizada em gateway
métricas por consumidor
múltiplos times
versionamento complexo de APIs
```

Enquanto existir apenas um backend Spring Boot atendendo o app, Spring Security, JWT, CORS e logs são suficientes.

---

## 13. Migração futura para app nativo

A estratégia escolhida permite começar com Angular/Ionic e depois migrar para:

```txt
Kotlin — Android
Swift — iOS
```

sem reescrever o backend.

### Condição para isso funcionar bem

O backend precisa ser o dono das regras de negócio e expor uma API bem definida.

```txt
Angular/Ionic hoje
Kotlin e Swift amanhã
        ↓
mesma API Spring Boot
        ↓
mesmo PostgreSQL
```

No futuro, talvez sejam adicionados endpoints mais otimizados para os apps nativos, mas a base do backend continua válida.

---

## 14. Ordem sugerida de implementação

### Etapa 1 — Base do backend

```txt
criar projeto Spring Boot
configurar PostgreSQL
configurar Flyway
configurar OpenAPI/Swagger
criar estrutura modular
```

### Etapa 2 — Autenticação e usuário

```txt
cadastro
login
JWT
perfil do usuário
onboarding
```

### Etapa 3 — Exercícios e treinos

```txt
catálogo inicial de exercícios
criação de treino
edição de exercícios do treino
ordenação dos exercícios
séries e repetições planejadas
```

### Etapa 4 — Programas

```txt
criação de programa
semanas
dias de treino
programa ativo
conflito ao iniciar novo programa
```

### Etapa 5 — Execução de treino

```txt
iniciar sessão
registrar série
alterar carga e reps
timer de descanso
pular exercício
finalizar treino
```

### Etapa 6 — Pós-treino e progresso

```txt
resumo pós-treino
volume total
XP
streak
PRs
histórico
evolução por exercício
```

### Etapa 7 — App mobile

```txt
criar projeto Angular/Ionic
implementar login
implementar onboarding
implementar home
implementar treinos
implementar execução
implementar progresso
implementar perfil
```

---

## 15. Decisão registrada

A decisão inicial do projeto é:

> Construir o MVP com **Angular + Ionic + Capacitor** no frontend mobile, **Spring Boot** no backend, **PostgreSQL** como banco de dados e uma arquitetura de **monólito modular separado do frontend**, mantendo a API preparada para futura migração para Kotlin e Swift.

