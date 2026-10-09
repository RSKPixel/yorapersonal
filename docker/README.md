# Docker deployment

Application source stays in `backend/` and `frontend/`. This directory holds Compose, the production Nginx site config, and deployment environment placeholders.

Docker runs **backend** and **frontend** only. MySQL runs separately on the homeserver. Do not add a MySQL service to this Compose file.

Run every command below from the repository root.

```bash
docker compose -f docker/docker-compose.yml <command>
```

## What gets deployed

- `backend` runs Uvicorn on container port `8006` as a non-root user.
- `frontend` builds the React app and serves it with unprivileged Nginx on container port `8080`. Nginx also proxies `/api`, `/health`, and `/ready` to `backend`, so Nginx Proxy Manager only needs one upstream.
- Host ports default to `127.0.0.1:8006` and `127.0.0.1:8088`. Change `BACKEND_BIND`, `BACKEND_PORT`, `FRONTEND_BIND`, and `FRONTEND_PORT` in `docker/.env` if those clash with the homeserver. Do not bind them on all interfaces unless you intend the host itself to publish them.
- Set `DATABASE_URL` to the homeserver MySQL host (for example `homeserver`). Inside Compose that hostname must resolve from the container, not `127.0.0.1`.

`VITE_API_BASE_URL` is empty in the production image so the browser calls `/api` on the same host as the frontend. Set `CORS_ORIGINS` to the public HTTPS origin and `COOKIE_SECURE=true`.

Secrets stay in `docker/.env`, which is not committed and is not copied into the images.

## Configure

```bash
cp docker/.env.example docker/.env
```

Replace the placeholder database URL, JWT secret, administrator password, and public origin. URL-encode reserved characters in the database password (`@` becomes `%40`).

## Production commands

Build and start:

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

Status:

```bash
docker compose -f docker/docker-compose.yml ps
```

Logs:

```bash
docker compose -f docker/docker-compose.yml logs -f backend frontend
```

Restart:

```bash
docker compose -f docker/docker-compose.yml restart backend frontend
```

Stop:

```bash
docker compose -f docker/docker-compose.yml stop
```

Rebuild after a code change:

```bash
docker compose -f docker/docker-compose.yml up -d --build backend frontend
```

The backend entrypoint runs `alembic upgrade head` and then `python -m app.scripts.create_admin`. Administrator creation is skipped when any user already exists. Do not put a public registration route in front of that command.

## Nginx Proxy Manager

Use `docker/docker-compose.proxy.yml` only when Proxy Manager should reach the containers on its own Docker network.

```bash
docker network ls
PROXY_NETWORK=npm_default docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.proxy.yml \
  up -d --build
```

Replace `npm_default` with the network shown by `docker network ls`. In Proxy Manager, forward the public host to `frontend` on port `8080`. Leave Websockets off unless you add them later. Enable SSL at Proxy Manager. One proxy host is enough because this Nginx already forwards `/api` to the backend.

Do not add a second public reverse proxy in this project.

## Checks

- `http://127.0.0.1:8006/health` returns `{"status":"ok"}` when the backend port is published.
- `http://127.0.0.1:8006/ready` returns ready only when MySQL accepts a connection.
- `GET /api/auth/me` without a session returns 401.
- The frontend at the published frontend port redirects anonymous visitors to `/login`.
