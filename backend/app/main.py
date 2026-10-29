import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.repositories.employee_repository import apply_due_terminations

logger = logging.getLogger("uvicorn.error")
TERMINATION_SWEEP_SECONDS = 60 * 60


def _run_termination_sweep() -> None:
    """Chuyển trạng thái nghỉ việc + khóa tài khoản cho các quyết định thôi việc đã đến ngày hiệu lực."""
    db = SessionLocal()
    try:
        so_nhan_su = apply_due_terminations(db)
        if so_nhan_su:
            logger.info("Đã áp dụng thôi việc đến hạn cho %s nhân sự", so_nhan_su)
    except Exception:
        logger.exception("Lỗi khi áp dụng thôi việc đến hạn")
        db.rollback()
    finally:
        db.close()


async def _termination_sweeper() -> None:
    while True:
        await asyncio.to_thread(_run_termination_sweep)
        await asyncio.sleep(TERMINATION_SWEEP_SECONDS)


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(_termination_sweeper())
    yield
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task


app = FastAPI(title="Trung Nguyen Legend HRM API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
