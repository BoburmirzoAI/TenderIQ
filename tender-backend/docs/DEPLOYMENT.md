# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Domain with SSL certificate
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

## Production Deployment

1. Clone repository and configure environment:
```bash
git clone <repo-url>
cd tender-backend
cp .env.example .env
# Edit .env with production values
```

2. Build and start services:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

3. Run database migrations:
```bash
docker compose -f docker-compose.prod.yml exec api alembic upgrade head
```

4. Seed initial data (optional):
```bash
docker compose -f docker-compose.prod.yml exec api python scripts/seed_data.py
```

5. Train ML models:
```bash
docker compose -f docker-compose.prod.yml exec api python scripts/train_models.py
```

## Environment Variables

All required variables are documented in `.env.example`. Critical ones:
- `SECRET_KEY` — application secret (generate with `openssl rand -hex 32`)
- `JWT_SECRET_KEY` — JWT signing key
- `DATABASE_URL` — PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN` — Telegram bot token from @BotFather
- `ANTHROPIC_API_KEY` — Claude AI API key
- `CLICK_SECRET_KEY` / `PAYME_SECRET_KEY` — Payment provider keys

## Health Check

```bash
curl http://your-domain.com/health
```
