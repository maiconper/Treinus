# Treinus — Backend

API REST do aplicativo Treinus, construída com Spring Boot 3.4 e Java 21.

## Pré-requisitos

- Java 21+
- Maven 3.9+
- PostgreSQL 14+

## Configuração

### 1. Banco de dados

Crie o banco e o usuário no PostgreSQL:

```sql
CREATE DATABASE treinus;
CREATE USER treinus WITH PASSWORD 'treinus';
GRANT ALL PRIVILEGES ON DATABASE treinus TO treinus;
```

### 2. Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_NAME` | `treinus` | Nome do banco |
| `DB_USER` | `treinus` | Usuário do banco |
| `DB_PASSWORD` | `treinus` | Senha do banco |
| `JWT_SECRET` | *(valor padrão inseguro)* | Segredo de assinatura JWT — **trocar em produção** |
| `JWT_ACCESS_EXPIRATION` | `900` | Expiração do access token (segundos) |
| `JWT_REFRESH_EXPIRATION` | `604800` | Expiração do refresh token (segundos) |
| `SERVER_PORT` | `8080` | Porta do servidor |

> O `JWT_SECRET` deve ter pelo menos 32 caracteres. Em produção, use um valor gerado aleatoriamente.

### 3. Executar

```bash
cd backend
mvn spring-boot:run
```

O Flyway vai executar as migrations automaticamente na primeira inicialização.

Para compilar o JAR:

```bash
mvn package
java -jar target/treinus-backend-0.1.0-SNAPSHOT.jar
```

## Documentação da API

Com a aplicação rodando, acesse:

- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **OpenAPI JSON:** http://localhost:8080/api-docs

## Autenticação

A API usa JWT stateless:

1. **Cadastro/Login** → recebe `accessToken` (15 min) e `refreshToken` (7 dias)
2. **Requisições autenticadas** → header `Authorization: Bearer <accessToken>`
3. **Renovar token** → `POST /api/v1/auth/refresh` com o `refreshToken`

## Módulos e endpoints

### Auth — `/api/v1/auth`

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/register` | Cadastrar usuário |
| POST | `/login` | Login |
| POST | `/refresh` | Renovar access token |

### Users — `/api/v1/users`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/me` | Dados do usuário autenticado |
| PUT | `/me/profile` | Atualizar perfil |
| POST | `/me/onboarding` | Completar onboarding inicial |

### Exercises — `/api/v1/exercises`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Listar exercícios (catálogo + personalizados) |
| GET | `/{id}` | Obter exercício |
| POST | `/` | Criar exercício personalizado |
| POST | `/global` | Criar exercício no catálogo global (admin) |
| DELETE | `/{id}` | Deletar exercício |

Parâmetros de filtro: `?category=CHEST&equipment=BARBELL`

### Workouts — `/api/v1/workouts`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Listar treinos |
| GET | `/{id}` | Obter treino |
| POST | `/` | Criar treino |
| PUT | `/{id}` | Atualizar treino |
| DELETE | `/{id}` | Deletar treino |
| POST | `/{id}/exercises` | Adicionar exercício |
| PATCH | `/{id}/exercises/{weId}` | Atualizar exercício no treino |
| DELETE | `/{id}/exercises/{weId}` | Remover exercício |
| PUT | `/{id}/exercises/reorder` | Reordenar exercícios |

### Programs — `/api/v1/programs`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Listar programas |
| GET | `/active` | Programa ativo |
| GET | `/{id}` | Obter programa |
| POST | `/` | Criar programa (status: DRAFT) |
| POST | `/{id}/start` | Iniciar programa (cancela o ativo atual) |
| POST | `/{id}/finish` | Concluir programa |
| POST | `/{id}/weeks` | Adicionar semana |
| POST | `/{id}/weeks/{weekId}/days` | Adicionar dia de treino/descanso |

### Sessions — `/api/v1/sessions`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/current` | Sessão em andamento |
| GET | `/{id}` | Obter sessão |
| POST | `/start` | Iniciar treino |
| POST | `/{id}/exercises/{seId}/sets` | Registrar série |
| POST | `/{id}/exercises/{seId}/skip` | Pular exercício |
| POST | `/{id}/finish` | Finalizar treino (retorna resumo) |
| POST | `/{id}/abandon` | Abandonar sessão |

### Progress — `/api/v1/progress`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/summary` | Resumo geral (XP, streak, volume semanal) |
| GET | `/history` | Histórico de treinos concluídos (paginado) |
| GET | `/exercises/{exerciseId}` | Progresso por exercício (PRs, histórico de cargas) |

## Estrutura do projeto

```
src/main/java/com/treinus/
├── config/              # Security, JWT, OpenAPI
├── shared/
│   ├── exception/       # Exceções e handler global
│   └── security/        # Filtro JWT
├── auth/                # Autenticação e tokens
├── users/               # Perfil e onboarding
├── exercises/           # Catálogo de exercícios
├── workouts/            # Treinos e exercícios planejados
├── programs/            # Programas, semanas e dias
├── sessions/            # Execução de treino e séries
└── progress/            # Histórico e estatísticas
```

## Banco de dados

Migrations em `src/main/resources/db/migration/`:

| Migration | Conteúdo |
|---|---|
| V1 | `users`, `user_profiles` |
| V2 | `exercises` |
| V3 | `workouts`, `workout_exercises` |
| V4 | `programs`, `program_weeks`, `program_days` |
| V5 | `training_sessions`, `session_exercises`, `session_sets` |

## Regras de negócio

| Regra | Implementação |
|---|---|
| Iniciar novo programa | Cancela automaticamente o programa ativo anterior |
| Exercício personalizado | Visível apenas para o dono |
| Record pessoal (PR) | Detectado automaticamente ao registrar série |
| Streak | Atualizado ao finalizar sessão (dias consecutivos) |
| XP | Estrutura implementada — **fórmula a definir** (TODO) |

## Roles

| Role | Permissões extras |
|---|---|
| `USER` | Acesso padrão à própria conta |
| `ADMIN` | Criar/deletar exercícios globais |

## Checagem de saúde

```
GET /actuator/health
```
