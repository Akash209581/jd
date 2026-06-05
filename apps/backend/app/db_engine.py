"""SQLite and PostgreSQL engine/session plumbing for the SQLAlchemy data layer."""

from pathlib import Path
from typing import Any, Union

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.models import Base

__all__ = ["Base", "make_async_engine", "make_sync_engine", "init_models_sync"]


def _apply_sqlite_pragmas(dbapi_connection: Any, _connection_record: Any) -> None:
    """Set per-connection SQLite PRAGMAs."""
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=5000")
    finally:
        cursor.close()


def _resolve_url(target: Union[Path, str], *, driver: str) -> str:
    """Resolve the connection URL string.

    If target is a Path, returns sqlite connection string.
    If target is a connection string, resolves driver name.
    """
    if isinstance(target, Path):
        return f"sqlite+{driver}:///{target}" if driver else f"sqlite:///{target}"
    
    url = str(target)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
        
    if driver == "asyncpg":
        if "postgresql://" in url and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            
    return url


def make_async_engine(target: Union[Path, str]) -> AsyncEngine:
    """Create the async engine for the document tables."""
    is_sqlite = isinstance(target, Path) or "sqlite" in str(target)
    driver = "aiosqlite" if is_sqlite else "asyncpg"
    url = _resolve_url(target, driver=driver)
    
    connect_args = {}
    if not is_sqlite:
        if "?" in url:
            url = url.split("?")[0]
        connect_args = {"ssl": True}
        
    engine = create_async_engine(url, connect_args=connect_args, future=True)
    if is_sqlite:
        event.listen(engine.sync_engine, "connect", _apply_sqlite_pragmas)
    return engine


def make_sync_engine(target: Union[Path, str]) -> Engine:
    """Create the sync engine used for key management and schema creation."""
    is_sqlite = isinstance(target, Path) or "sqlite" in str(target)
    url = _resolve_url(target, driver="")

    connect_args: dict = {}
    if not is_sqlite:
        # psycopg2 does not accept channel_binding or sslmode in the URL string
        # when using SQLAlchemy — strip all query params and pass ssl via connect_args.
        if "?" in url:
            url = url.split("?")[0]
        connect_args = {"sslmode": "require"}

    engine = create_engine(url, connect_args=connect_args, future=True)
    if is_sqlite:
        event.listen(engine, "connect", _apply_sqlite_pragmas)
    return engine


def init_models_sync(engine: Engine) -> None:
    """Create all tables (idempotent) using a sync engine connection."""
    Base.metadata.create_all(engine)
