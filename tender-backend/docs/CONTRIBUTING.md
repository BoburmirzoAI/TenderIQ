# Contributing

## Branch Strategy

- `main` — production (deploy on merge)
- `dev` — staging (deploy on push)
- `feature/*` — feature branches (PR to dev)
- `fix/*` — bug fixes (PR to dev or main for hotfixes)

## PR Rules

1. All PRs require at least one review
2. All tests must pass (unit + integration)
3. Code must pass lint checks (`make lint`)
4. Update API docs if endpoints change

## Commit Format

```
type(scope): short description

body (optional)
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## Development Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
make run-dev
make test
```
