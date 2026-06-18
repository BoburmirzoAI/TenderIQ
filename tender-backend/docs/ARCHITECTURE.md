# Architecture

## Layers

- **API** (`app/api/`) — HTTP routing, input validation, response formatting
- **Service** (`app/services/`) — Business logic, coordination between repos and external APIs
- **Repository** (`app/repositories/`) — Database queries (SQLAlchemy ORM only)
- **Model** (`app/models/`) — Table definitions and relationships
- **Schema** (`app/schemas/`) — Pydantic request/response models

## Data Flow

```
HTTP Request → Middleware → API → Service → Repository → PostgreSQL
                                         → External APIs (Claude, Click, Payme, Telegram)

Celery Beat → Task → Scraper → Cleaner → Repository → DB
                                                    → Matching Service → Notification Service
```

## Key Principles

1. Each layer has one responsibility
2. API never contains business logic
3. Services never handle HTTP objects
4. Repositories never call external APIs
5. All database access is async
