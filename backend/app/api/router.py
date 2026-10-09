from fastapi import APIRouter, Depends

from app.api.routes import auth, health, users
from app.dependencies.auth import require_csrf

api_router = APIRouter(prefix="/api", dependencies=[Depends(require_csrf)])
api_router.include_router(auth.router)
api_router.include_router(users.router)

health_router = health.router
