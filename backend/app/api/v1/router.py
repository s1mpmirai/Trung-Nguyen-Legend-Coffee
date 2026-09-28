from fastapi import APIRouter

from app.api.v1.endpoints import (
    accounts,
    attendance,
    auth,
    employees,
    leaves,
    payroll,
    permissions,
    products,
    suppliers,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["permissions"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(leaves.router, prefix="/leaves", tags=["leaves"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(payroll.router, prefix="/payroll", tags=["payroll"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
