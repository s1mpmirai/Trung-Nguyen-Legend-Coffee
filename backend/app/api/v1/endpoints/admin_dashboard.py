from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import admin_dashboard_repository
from app.schemas.admin_schemas import AdminDashboardStatsResponse

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("/stats", response_model=AdminDashboardStatsResponse, summary="Thống kê tổng quan hệ thống Admin")
def get_admin_dashboard_stats_endpoint(db: DbSession):
    """Lấy dữ liệu thống kê tổng thể toàn hệ thống (Nhân sự, Phòng ban, Tài khoản, Kho hàng, Hợp đồng) phục vụ Dashboard Admin."""
    return admin_dashboard_repository.get_admin_dashboard_stats(db)
