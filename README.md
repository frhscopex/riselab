# RiseLab (Frontend + Backend)

RiseLab is a static web frontend plus an Express/Prisma backend for auth, API keys, knowledge feed/search, memory, billing, and integration diagnostics.

## Project structure

- `index.html`, `dashboard.html`, `script.js`, `dashboard.js`: frontend UI and API integration
- `backend/`: API server (Express + Prisma + Postgres)
- `backend/prisma/schema.prisma`: DB models

## Local setup

### 1) Prerequisites

- Node.js 18+
- npm
- PostgreSQL

### 2) Backend setup

```bash
cd backend
cp .env.example .env
# edit .env values
npm install
```

### 3) Database migration + client

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 4) Optional seed data

```bash
cd backend
npm run seed
```

### 5) Run backend

```bash
cd backend
npm start
```

Backend default URL: `http://localhost:4000`

### 6) Run frontend

From repo root, start any static server:

```bash
python3 -m http.server 3000
```

Frontend URL: `http://localhost:3000`

## Required environment variables

See `backend/.env.example` for the full list. Minimum required for core local auth + API flows:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- Firebase vars (`FIREBASE_*`) for social auth
- Stripe vars (`STRIPE_*`) only if testing billing checkout

## API overview

Base URL: `http://localhost:4000/api`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/social`
- `GET /auth/me`

Auth responses are JSON-only with explicit status codes and actionable errors.

### Core API

- `GET /feed`
- `GET /memory?limit=5`
- `POST /memory`
- `GET /search?q=...&limit=...` (JWT/API key required)
- `GET /sync`

### User/API key/billing

- `POST /keys/generate` (JWT required)
- `GET /billing/status` (JWT required)
- `POST /billing/subscribe` (JWT required)
- `POST /stripe/create-checkout-session` (JWT required)

## Auth usage

Send JWT as:

```http
Authorization: Bearer <token>
```

Or API key where supported:

```http
x-api-key: rl_xxx
```

## URL behavior (local vs hosted)

- Hosted (Vercel, `cleanUrls: true`): clean paths like `/pricing` work.
- Local static servers may not rewrite clean URLs, so frontend scripts now use `.html` links during localhost development to avoid broken navigation.

## Health checks

- `GET /health`
- `GET /api/awareness/supabase` (optional Supabase connectivity check)

## Notes

- `npm test` currently reports: `No tests configured`.
- If you change Prisma schema, regenerate client (`npm run prisma:generate`) before running the server.
