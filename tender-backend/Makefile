.PHONY: run run-dev stop test test-unit test-integration lint format migrate makemigration worker beat flower bot seed train-model clean logs logs-api logs-bot logs-worker logs-beat logs-postgres logs-redis logs-flower logs-pgadmin shell createsuperuser superadmin

run:
	docker compose up -d

run-dev:
	docker compose up

stop:
	docker compose down

test:
	pytest tests/ -v --tb=short --cov=app --cov-report=term-missing

test-unit:
	pytest tests/unit/ -v --tb=short

test-integration:
	pytest tests/integration/ -v --tb=short

lint:
	flake8 app/ bot/ tests/
	mypy app/ bot/
	isort --check-only app/ bot/ tests/
	black --check app/ bot/ tests/

format:
	isort app/ bot/ tests/
	black app/ bot/ tests/

migrate:
	alembic upgrade head

makemigration:
	alembic revision --autogenerate -m "$(msg)"

worker:
	celery -A app.tasks.celery_app worker --loglevel=info

beat:
	celery -A app.tasks.celery_app beat --loglevel=info

flower:
	celery -A app.tasks.celery_app flower --port=5555

bot:
	python -m bot.main

createsuperuser:
	docker compose exec -it api python -m scripts.createsuperuser

# Non-interactive: make superadmin email=admin@example.com password=secret123 name="Admin"
superadmin:
	docker compose exec api python -m scripts.createsuperuser \
		--email "$(email)" \
		--password "$(password)" \
		--name "$(or $(name),Admin)"

seed:
	python scripts/seed_data.py

seed-rbac:
	docker compose exec api python -m scripts.seed_rbac

train-model:
	python scripts/train_models.py

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
	find . -type f -name "*.pyc" -delete 2>/dev/null; true
	rm -rf .pytest_cache .mypy_cache htmlcov .coverage

logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

logs-bot:
	docker compose logs -f bot

logs-worker:
	docker compose logs -f celery_worker

logs-beat:
	docker compose logs -f celery_beat

logs-postgres:
	docker compose logs -f postgres

logs-redis:
	docker compose logs -f redis

logs-flower:
	docker compose logs -f flower

logs-pgadmin:
	docker compose logs -f pgadmin

shell:
	docker compose exec api python -c "import asyncio; asyncio.run(__import__('app.database', fromlist=['async_session']).async_session().__aenter__())"
