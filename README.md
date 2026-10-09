# Yora Personal

Personal workspace with a FastAPI API and a React dashboard. Sign-in is required before the dashboard can load.

## Ports

| Service | URL |
| --- | --- |
| Frontend | http://127.0.0.1:5177 |
| API | http://127.0.0.1:8006 |
| Swagger | http://127.0.0.1:8006/docs |
| ReDoc | http://127.0.0.1:8006/redoc |

These development ports are fixed. If a port is already in use, stop the process that holds it instead of switching ports.

## Stack

- Backend: Python 3.12, FastAPI, SQLAlchemy, Pydantic, Alembic, PyMySQL
- Database: MySQL 8
- Frontend: React, Vite, React Router, Tailwind CSS v4
- Session: short-lived JWT in an HttpOnly cookie, plus a CSRF cookie

Use `127.0.0.1` in the browser. `localhost` is a different cookie host.

## Local setup

Python 3.12 is required. The system `python3` on this machine may be older.

```bash
cd backend
/opt/homebrew/bin/python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and set `DATABASE_URL` or `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. If the password contains reserved characters, URL-encode them inside `DATABASE_URL`. Also set `JWT_SECRET_KEY` to at least 32 random characters, plus `INITIAL_ADMIN_USERNAME` and `INITIAL_ADMIN_PASSWORD` (8 characters or more).

Create the schema and the first administrator. The admin command does nothing once any user exists. It is not a public registration endpoint.

```bash
alembic upgrade head
python -m app.scripts.create_admin
uvicorn app.main:app --host 127.0.0.1 --port 8006
```

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Leave `VITE_API_BASE_URL` empty for local development. Vite proxies `/api`, `/health`, and `/ready` to `http://127.0.0.1:8006`, so the browser stays same-origin and avoids CORS issues.

Open http://127.0.0.1:5177 and sign in. `/` sends an anonymous visitor to `/login` and a signed-in visitor to `/dashboard`.

Local development uses the MySQL instance on the homeserver. Point `DATABASE_URL` at host `homeserver` (or another reachable hostname). Docker Compose is for production `backend` and `frontend` only — it does not start MySQL.

## Authentication

- `POST /api/auth/login` sets an HttpOnly `access_token` cookie and a readable `csrf_token` cookie.
- `GET /api/auth/me` restores the session. A missing or expired token returns 401.
- `POST /api/auth/logout` requires header `X-CSRF-Token` to match `csrf_token`.
- Passwords are hashed with Argon2id.
- The API client lives in `frontend/src/api/` and always sends cookies.

## Tests

```bash
cd backend
source .venv/bin/activate
pytest
```

Tests use a temporary SQLite file so they do not touch MySQL.

## Troubleshooting

- **Port 8006 or 5177 is in use.** Find the listener with `lsof -nP -iTCP:8006 -sTCP:LISTEN` or the same command for `5177`, then stop that process. Do not change the application ports.
- **Database connection failed.** Check that MySQL is running on the homeserver and that `DATABASE_URL` uses host `homeserver`. URL-encode `@` in passwords as `%40`. If MySQL returns `Access denied for user 'sysadmin'@'…'`, grant that user for the client host MySQL sees (often a Docker bridge address such as `172.%` when MySQL runs in a container). Logs redact passwords embedded in connection URLs.
- **Login succeeds in Swagger but the browser stays signed out.** Open the app at `http://127.0.0.1:5177`, not `http://localhost:5177`.
- **Logout returns 403.** The frontend must send `X-CSRF-Token`. Refresh the page so `/api/auth/me` can issue a CSRF cookie, then try again.
- **`COOKIE_SECURE=true` on plain HTTP.** The browser will drop the session cookie. Keep `COOKIE_SECURE=false` for local HTTP, and set it true only behind HTTPS.

Production deployment is documented in [docker/README.md](docker/README.md).
