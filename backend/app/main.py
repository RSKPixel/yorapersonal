import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.router import api_router, health_router
from app.core.config import get_settings
from app.core.redaction import redact
from app.db.session import engine

logger = logging.getLogger(__name__)


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Cache-Control"] = "no-store"
        return response


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    configure_logging()
    logger.info("Starting %s (%s)", settings.app_name, settings.app_env)
    if settings.app_env == "production" and not settings.cookie_secure:
        logger.warning("COOKIE_SECURE is disabled while APP_ENV is production")
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Database connection succeeded")
    except Exception as exc:
        logger.error("Database connection failed: %s", redact(str(exc)))
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    docs_enabled = settings.app_env != "production"
    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        # Chrome / Cursor send Access-Control-Request-Private-Network for 127.0.0.1.
        allow_private_network=True,
    )

    @app.exception_handler(Exception)
    async def unhandled_exception(_request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled error: %s", redact(str(exc)))
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    app.include_router(health_router)
    app.include_router(api_router)
    return app


app = create_app()
