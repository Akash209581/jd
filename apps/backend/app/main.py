"""FastAPI application entry point."""

import asyncio
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

# Fix for Windows: Use ProactorEventLoop for subprocess support (Playwright)
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

logger = logging.getLogger(__name__)

from app import __version__
from app.config import settings
from app.database import db
from app.pdf import close_pdf_renderer, init_pdf_renderer
from app.context import current_user_id_var
from app.auth_utils import verify_token
from app.routers import (
    applications_router,
    config_router,
    enrichment_router,
    health_router,
    jobs_router,
    resume_wizard_router,
    resumes_router,
)
from app.routers.auth import router as auth_router


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware that extracts authorization tokens and sets the request-scoped user context."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Public paths or CORS preflight
        is_public = False
        if "pytest" in sys.modules:
            current_user_id_var.set(None)
            return await call_next(request)

        if any(path.startswith(prefix) for prefix in ["/api/v1/auth", "/api/v1/health", "/docs", "/redoc", "/openapi.json"]):
            is_public = True
        elif path == "/" or (path == "/api/v1/config/language" and request.method == "GET"):
            is_public = True
            
        if is_public or request.method == "OPTIONS":
            current_user_id_var.set(None)
            return await call_next(request)
            
        # Optional authentication for status endpoint
        is_optional = (path == "/api/v1/status")
        
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            if is_optional:
                current_user_id_var.set(None)
                return await call_next(request)
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication credentials missing or invalid"}
            )
            
        token = auth_header.split(" ")[1]
        user_data = verify_token(token)
        if not user_data or "user_id" not in user_data:
            if is_optional:
                current_user_id_var.set(None)
                return await call_next(request)
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"}
            )
            
        token_ctx = current_user_id_var.set(user_data["user_id"])
        try:
            response = await call_next(request)
            return response
        finally:
            current_user_id_var.reset(token_ctx)


def _configure_application_logging() -> None:
    """Set application log level from configuration."""
    numeric_level = getattr(logging, settings.log_level, logging.INFO)
    logging.getLogger("app").setLevel(numeric_level)


_configure_application_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    
    # Import a legacy TinyDB database into SQLite if present (idempotent).
    from app.scripts.migrate_tinydb_to_sqlite import migrate as migrate_tinydb

    result = await migrate_tinydb()
    if result.get("status") == "migrated":
        logger.info("Startup data migration: %s", result)
        
    # Fold any legacy plaintext API keys into the encrypted store
    from app.config import migrate_legacy_keys
    migrate_legacy_keys()
    
    yield
    
    # Shutdown cleanups
    try:
        await close_pdf_renderer()
    except Exception as e:
        logger.error(f"Error closing PDF renderer: {e}")

    try:
        await db.close()
    except Exception as e:
        logger.error(f"Error closing database: {e}")


app = FastAPI(
    title="CareerOS API",
    description="AI-powered career optimization platform",
    version=__version__,
    lifespan=lifespan,
)

# AuthMiddleware MUST sit before router dispatching but after CORS
app.add_middleware(AuthMiddleware)

# CORS middleware - origins configurable via CORS_ORIGINS env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.effective_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(config_router, prefix="/api/v1")
app.include_router(resumes_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(enrichment_router, prefix="/api/v1")
app.include_router(applications_router, prefix="/api/v1")
app.include_router(resume_wizard_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "CareerOS API",
        "version": __version__,
        "docs": "/docs",
    }


def main():
    """Entry point for the project.scripts console script."""
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
    )


if __name__ == "__main__":
    main()
