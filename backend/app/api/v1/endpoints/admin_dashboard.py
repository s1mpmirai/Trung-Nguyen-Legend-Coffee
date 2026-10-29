from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.permissions import require_permission
from app.db.session import get_db
from app.repositories import admin_dashboard_repository
from app.schemas.admin_schemas import AdminDashboardStatsResponse

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("/stats", response_model=AdminDashboardStatsResponse, summary="Thống kê tổng quan hệ thống Admin")
def get_admin_dashboard_stats_endpoint(
    db: DbSession,
    account: Annotated[dict, Depends(require_permission("ACCOUNT_MANAGE", "PERMISSION_ASSIGN", "ORG_MANAGE", "CONTRACT_MANAGE"))],
):
    """Lấy dữ liệu thống kê tổng thể toàn hệ thống (Nhân sự, Phòng ban, Tài khoản, Kho hàng, Hợp đồng) phục vụ Dashboard Admin."""
    return admin_dashboard_repository.get_admin_dashboard_stats(db)
