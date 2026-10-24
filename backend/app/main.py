import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import db_manager
from app.errors import register_error_handlers
from app.routes.documents import router as documents_router
from app.routes.health import router as health_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("documind")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager to handle startup and shutdown events."""
    logger.info("Starting up DocuMind AI Backend...")
    # Attempt MongoDB connection (non-blocking for startup if offline)
    db_manager.connect()
    yield
    logger.info("Shutting down DocuMind AI Backend...")
    db_manager.close()


def create_app() -> FastAPI:
    """FastAPI application factory."""
    app = FastAPI(
        title=f"{settings.PROJECT_NAME} Backend",
        version=settings.VERSION,
        description="Backend API for DocuMind AI — AI-Powered Document Intelligence Platform",
        lifespan=lifespan,
    )

    # Centralized Error Handlers
    register_error_handlers(app)

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include Routers
    app.include_router(health_router)
    app.include_router(documents_router)

    @app.get("/", tags=["Root"])
    def root():
        return {
            "name": f"{settings.PROJECT_NAME} API",
            "version": settings.VERSION,
            "status": "online",
            "docs_url": "/docs",
            "health_check": "/api/health",
        }

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )

