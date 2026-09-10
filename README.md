# Snipl — Full-Stack URL Shortener

A production-style URL shortener: React + TypeScript on the frontend, Node.js +
Express on the backend, SQLite for storage. Includes accounts, click tracking,
QR codes, and expiring links (by date or click count).

```
url-shortener/
├── backend/    Express API + SQLite (better-sqlite3)
└── frontend/   React + TypeScript + Vite + Tailwind CSS v4
```

## Features

- **Auth** — JWT-based accounts (register/login), passwords hashed with bcrypt
- **Shorten** — turn any long URL into a short code (random or custom, e.g. `/my-launch`)
- **Redirect** — `GET /:code` 302-redirects to the original URL
- **Click tracking** — every redirect increments a counter and logs timestamp,
  referrer, and user agent
- **Dashboard** — see all your links, total clicks, and per-link recent activity
- **QR codes** — generated on demand per link, downloadable as PNG
- **Expiring links** — set an expiry date, a max-click limit, or both; once
  spent, the link responds `410 Gone` instead of redirecting
- **Password-protected links** — require a password before the visitor is
  redirected; the destination URL is never exposed until the password is
  verified
- **Link preview page** — optionally show a "you're about to visit…"
  interstitial with a countdown before redirecting, for extra transparency
  and trust
- **Enable/disable** — pause a link without deleting it

## Quick start

You'll need **Node.js 22.5+** (the backend uses Node's built-in `node:sqlite`
module — no native/C++ compilation step, so there's nothing to build on
install, on any OS).

### 1. Backend

```bash
cd backend
cp .env.example .env      # defaults work fine for local dev
npm install
npm run dev                # starts on http://localhost:4000
```

The SQLite database file is created automatically at `backend/data/app.db` on
first run — no separate database server required.

### 2. Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env      # points VITE_API_URL at http://localhost:4000
npm install
npm run dev                # starts on http://localhost:5173
```

Open http://localhost:5173, create an account, and start shortening links.

## Configuration

### `backend/.env`

| Variable            | Description                                      | Default                 |
|---------------------|---------------------------------------------------|--------------------------|
| `PORT`              | API port                                          | `4000`                  |
| `JWT_SECRET`         | Secret used to sign auth tokens — **change in production** | —              |
| `JWT_EXPIRES_IN`     | Token lifetime                                    | `7d`                     |
| `BASE_URL`           | Public base URL used to build short links (e.g. `https://snip.li`) | `http://localhost:4000` |
| `FRONTEND_URL`       | Allowed CORS origin                               | `http://localhost:5173` |
| `DB_PATH`            | SQLite file location                              | `./data/app.db`         |
| `SHORT_CODE_LENGTH`  | Length of auto-generated short codes              | `7`                      |

### `frontend/.env`

| Variable        | Description                  | Default                  |
|-----------------|-------------------------------|---------------------------|
| `VITE_API_URL`  | Base URL of the backend API   | `http://localhost:4000`  |

## API reference

All `/api` routes except auth require `Authorization: Bearer <token>`.

| Method | Path                | Description                                  |
|--------|----------------------|-----------------------------------------------|
| POST   | `/api/auth/register` | Create an account, returns `{ token, user }`  |
| POST   | `/api/auth/login`    | Log in, returns `{ token, user }`             |
| GET    | `/api/auth/me`       | Current user                                  |
| GET    | `/api/links`         | List your links + summary stats               |
| POST   | `/api/links`         | Create a link (`originalUrl`, optional `customCode`, `title`, `expiresAt`, `maxClicks`, `password`, `requirePreview`) |
| GET    | `/api/links/:id`     | Link detail + recent click log                |
| GET    | `/api/links/:id/qr`  | QR code as a PNG data URL                      |
| PATCH  | `/api/links/:id`     | Update `isActive`, `requirePreview`, `password`, or `removePassword` |
| DELETE | `/api/links/:id`     | Delete a link                                  |
| GET    | `/:code`             | Public redirect. Plain links redirect straight away and count the click; links with a password or `requirePreview` instead redirect the visitor to `FRONTEND_URL/preview/:code` |
| GET    | `/api/public/links/:code` | Unauthenticated metadata for the preview/password page. `originalUrl` is withheld while `hasPassword` is true |
| POST   | `/api/public/links/:code/confirm` | Unauthenticated. Verifies the password (if any), then counts the click and returns `{ originalUrl }`. Rate-limited to slow down password guessing |

## Design notes

- **Manual, dependency-light backend.** No ORM — raw SQL via prepared
  statements, so the data layer is easy to read and reason about.
- **SQLite via Node's built-in driver.** `node:sqlite` (stable since Node
  22.5) is used instead of the `better-sqlite3` npm package. Same
  `db.prepare(sql).run/get/all()` API, but nothing to compile — installs
  instantly on Windows/Mac/Linux with no Visual Studio / Xcode / build-essential
  required. It's still marked experimental by Node and prints a one-line
  warning on startup; that's expected and harmless. Swap
  `backend/src/db/init.js` for a Postgres connection (e.g. via `pg`) if you
  need concurrent writers at scale — the rest of the app talks to `db` through
  prepared statements, so the blast radius of that change is contained to one
  file plus the query strings.
- **Link status is computed, not stored.** `active` / `expired` / `limit_reached`
  / `disabled` is derived from `is_active`, `expires_at`, and `max_clicks` at
  read time, so there's no background job required to expire links — a link
  simply stops redirecting the moment its condition is true.
- **Short codes** use an unambiguous alphabet (no `0/O/1/l/I`) so codes are easy
  to read aloud or copy from a printed QR code.
- **Click counting only happens on confirmed visits.** For a password or
  preview link, loading the interstitial page never increments the click
  count — only a correct password or an explicit "continue" does. This also
  means a wrong password attempt is never counted as a click, and refreshing
  the preview page doesn't inflate the numbers.
- **The destination URL is withheld for password-protected links** until the
  password is verified — the public metadata endpoint returns `originalUrl:
  null` in that case, so the destination never leaks to the browser before
  the visitor authenticates.

## Production checklist

- Set a long, random `JWT_SECRET`
- Set `BASE_URL` to your real domain so generated short links and QR codes are correct
- Put the backend behind HTTPS (e.g. a reverse proxy like Caddy or Nginx)
- Back up `backend/data/app.db` regularly, or migrate to Postgres for multi-instance deployments
- `npm run build` the frontend and serve `frontend/dist` as static files (e.g. via Nginx, Vercel, or the backend itself)
