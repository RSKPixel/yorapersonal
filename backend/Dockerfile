FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN useradd --create-home --uid 10001 appuser \
    && pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8006

ENTRYPOINT ["/docker-entrypoint.sh"]
