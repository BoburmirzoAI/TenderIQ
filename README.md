# TenderIQ

AI-powered government tender intelligence platform for Uzbekistan.

## Quick Start

```bash
cp .env.example .env
docker compose up -d
make migrate
make seed
make test-unit
```

## Structure

- `app/api/` — FastAPI route handlers (no business logic)
- `app/services/` — Business logic layer
- `app/repositories/` — Database query layer (SQLAlchemy ORM)
- `app/models/` — Database table definitions
- `app/schemas/` — Pydantic request/response models
- `app/scraper/` — Government tender site scrapers
- `app/ml/` — Machine learning models (price prediction, matching)
- `app/tasks/` — Celery background tasks
- `bot/` — Telegram bot (Aiogram 3.x)
- `tests/` — Unit, integration, and e2e tests

## API Docs

Run the server and visit `/docs` for Swagger UI or `/redoc` for ReDoc.
