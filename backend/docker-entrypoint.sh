#!/bin/sh
set -eu

alembic upgrade head
python -m app.scripts.create_admin
exec uvicorn app.main:app --host 0.0.0.0 --port 8006
