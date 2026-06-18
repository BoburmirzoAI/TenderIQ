# API Reference

Base URL: `/api/v1`

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/change-password` | Change password (auth required) |
| POST | `/auth/api-key` | Generate API key (auth required) |

## Tenders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenders/` | List with filters and pagination |
| GET | `/tenders/{id}` | Tender detail |
| GET | `/tenders/matched/` | Matched tenders for user's company |
| POST | `/tenders/save/{match_id}` | Toggle save/unsave |
| GET | `/tenders/search/?q=` | Text search |

## Companies

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/companies/` | Create company profile |
| GET | `/companies/me` | Get own company |
| PATCH | `/companies/me` | Update own company |
| GET | `/companies/stats` | Company matching stats |

## Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/competitors` | Competitor analysis |
| GET | `/analytics/price-history` | Historical prices |
| GET | `/analytics/market` | Market overview |
| GET | `/analytics/anomalies` | Anomaly detection |

## ML (Pro+ only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ml/predict-price` | Price prediction |
| GET | `/ml/model-info` | Model metadata |

## Documents (Pro+ only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/analyze` | Upload and analyze PDF |

## Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscriptions/current` | Current subscription |
| GET | `/subscriptions/plans` | Available plans |
| GET | `/subscriptions/usage` | Usage statistics |

## Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create` | Initiate payment |
| POST | `/payments/click/webhook` | Click callback |
| POST | `/payments/payme/webhook` | Payme callback |
| GET | `/payments/history` | Payment history |

## Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Platform statistics |
| GET | `/admin/users` | List all users |
| PATCH | `/admin/users/{id}` | Update user (audit logged) |
