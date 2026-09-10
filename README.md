# Snipl — URL Shortener

Snipl is a full-stack URL shortener built with React + TypeScript on the frontend and Express + PostgreSQL on the backend. It supports user accounts, short links, click tracking, password protection, preview pages, QR codes, and expiry or max-click limits.

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL via `pg`
- Auth: JWT + bcrypt
- Database: PostgreSQL (works with Supabase, Neon, local Postgres, etc.)

## Project structure

```bash
url-shortener/
├── backend/
│   ├── src/
│   ├── .env
│   ├── .env.example
│   ├── package.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── README.md
└── package-lock.json
```

## Features

- JWT-based user registration and login
- Custom or auto-generated short codes
- Public redirect endpoint for shortened links
- Click counting and analytics per link
- Click-limit and date-based expiry controls
- Password-protected links
- Optional preview/interstitial page before redirect
- Link enable/disable state
- QR code generation
- Recent click history and dashboard summary

## Requirements

- Node.js 22.5+
- PostgreSQL database
- A browser for the frontend UI

## Quick start

### 1) Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend listens on `http://localhost:4000` by default.

Set your real PostgreSQL connection string in `backend/.env`:

```env
PORT=4000
JWT_SECRET=change-this-to-a-long-random-secret-in-production
JWT_EXPIRES_IN=7d
BASE_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@host:5432/dbname
SHORT_CODE_LENGTH=7
```

The app initializes the required tables automatically on startup.

### 2) Frontend setup

In a second terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` if you need a non-default API URL:

```env
VITE_API_URL=http://localhost:4000
```

Then run:

```bash
npm run dev
```

The frontend will be served at `http://localhost:5173`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port; defaults to `4000` |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | No | JWT lifetime, for example `7d` |
| `BASE_URL` | Yes for production | Public base URL used to generate short links |
| `FRONTEND_URL` | Yes for local dev | Allowed CORS origin for the frontend |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SHORT_CODE_LENGTH` | No | Length for generated short codes |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | No | Backend API URL, defaults to `http://localhost:4000` |

## API overview

The main API is mounted under `/api`.

- `POST /api/auth/register` — create a new user
- `POST /api/auth/login` — log in and receive a JWT
- `GET /api/auth/me` — get current authenticated user
- `GET /api/links` — list links and summary stats
- `POST /api/links` — create a new shortened link
- `GET /api/links/:id` — fetch link details and recent clicks
- `GET /api/links/:id/qr` — generate QR code data
- `PATCH /api/links/:id` — update link settings
- `DELETE /api/links/:id` — delete a link

Public redirect routes:

- `GET /:code` — redirect to original URL
- `GET /api/public/links/:code` — metadata for preview/password flows
- `POST /api/public/links/:code/confirm` — verify access and count the click

## Notes on behavior

- Protected links do not reveal the destination URL until the password is verified.
- Preview-gated links redirect through the frontend confirmation page before counting a visit.
- The click count only increments when the user actually confirms the visit or reaches the direct redirect path.
- Link status is derived from `is_active`, expiry, and click limits at read time.

## Production checklist

- Use a strong `JWT_SECRET`
- Set `BASE_URL` to your real public domain
- Serve the frontend from a built static bundle or a CDN
- Run PostgreSQL in a managed service or a dedicated server
- Keep `DATABASE_URL` out of source control and store it in your deployment environment
- Configure HTTPS behind a reverse proxy or hosting platform

## Useful commands

```bash
# backend
cd backend
npm install
npm run dev

# frontend
cd frontend
npm install
npm run dev
npm run build
```
