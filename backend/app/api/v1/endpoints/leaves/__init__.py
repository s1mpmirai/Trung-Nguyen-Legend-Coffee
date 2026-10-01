from fastapi import APIRouter

from app.api.v1.endpoints.leaves.employee_leaves import router as employee_router
from app.api.v1.endpoints.leaves.manager_leaves import router as manager_router

router = APIRouter()

# Gom router của cả Nhân viên và Quản lý vào router chung của module leaves
router.include_router(employee_router)
router.include_router(manager_router)
