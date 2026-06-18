.PHONY: run run-dev stop test test-unit test-integration lint format migrate makemigration worker beat flower bot seed train-model clean logs shell createsuperuser

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
	docker compose exec api python -m scripts.createsuperuser

seed:
	python scripts/seed_data.py

train-model:
	python scripts/train_models.py

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
	find . -type f -name "*.pyc" -delete 2>/dev/null; true
	rm -rf .pytest_cache .mypy_cache htmlcov .coverage

logs:
	docker compose logs -f

shell:
	docker compose exec api python -c "import asyncio; asyncio.run(__import__('app.database', fromlist=['async_session']).async_session().__aenter__())"
