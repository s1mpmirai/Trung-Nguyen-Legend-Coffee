import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.core.errors import db_error_message
from app.repositories.contract_repository import expire_overdue_contracts
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
        so_hop_dong = expire_overdue_contracts(db)
        if so_hop_dong:
            logger.info("Đã chuyển %s hợp đồng quá hạn sang Hết hạn", so_hop_dong)
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


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(_: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Lỗi CSDL chưa được endpoint xử lý: trả câu báo tiếng Việt, chi tiết kỹ thuật chỉ ghi log."""
    return JSONResponse(
        status_code=409 if isinstance(exc, IntegrityError) else 500,
        content={"detail": db_error_message(exc, "lưu dữ liệu")},
    )

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
