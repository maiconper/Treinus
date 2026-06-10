# Treinus

Aplicativo fitness para registro e acompanhamento de treinos.

## Visão geral

```
Mobile (Angular + Ionic + Capacitor)
             ↓ REST/JSON
    Spring Boot REST API
             ↓
         PostgreSQL
```

O projeto segue uma arquitetura de **frontend separado do backend**. O backend expõe uma API REST independente, permitindo que o app mobile seja migrado para Kotlin/Swift no futuro sem reescrever o backend.

## Repositório

```
Treinus/
├── backend/     ← API Spring Boot (este MVP)
└── frontend/    ← App Angular + Ionic (a implementar)
```

## Stack

| Camada | Tecnologia |
|---|---|
| Mobile | Angular, Ionic, Capacitor |
| Backend | Spring Boot 3.4, Java 21, Maven |
| Autenticação | Spring Security + JWT (stateless) |
| Banco de dados | PostgreSQL |
| Migrations | Flyway |
| Documentação API | OpenAPI / Swagger UI |

## Status do MVP

- [x] Backend — módulos auth, users, exercises, workouts, programs, sessions, progress
- [ ] Frontend mobile

## Links úteis

- [Documentação do Backend](backend/README.md)
- [Especificações do MVP](SPECS.md)
