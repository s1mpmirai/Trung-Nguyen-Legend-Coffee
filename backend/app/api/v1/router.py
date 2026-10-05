from fastapi import APIRouter

from app.api.v1.endpoints import (
    accounts,
    admin_dashboard,
    attendance,
    auth,
    contracts,
    departments,
    employees,
    leaves,
    payroll,
    permissions,
    positions,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["permissions"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(leaves.router, prefix="/leaves", tags=["leaves"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(payroll.router, prefix="/payroll", tags=["payroll"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(positions.router, prefix="/positions", tags=["positions"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(admin_dashboard.router, prefix="/admin/dashboard", tags=["admin-dashboard"])
