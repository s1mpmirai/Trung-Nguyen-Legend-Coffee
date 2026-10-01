from fastapi import APIRouter

from app.api.v1.endpoints.attendance.employee_attendance import router as employee_router
from app.api.v1.endpoints.attendance.manager_attendance import router as manager_router

router = APIRouter()

# Tích hợp cả router Nhân viên và Quản lý vào router chung của module attendance
router.include_router(employee_router)
router.include_router(manager_router)
