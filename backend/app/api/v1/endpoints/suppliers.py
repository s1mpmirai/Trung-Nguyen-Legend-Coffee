from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import supplier_repository
from app.schemas.supplier_schemas import (
    SupplierCreate,
    SupplierListResponse,
    SupplierResponse,
    SupplierUpdate,
)

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=SupplierListResponse, summary="Danh sách nhà cung cấp")
def list_suppliers_endpoint(
    db: DbSession,
    page: int = Query(1, ge=1, description="Trang hiện tại"),
    page_size: int = Query(10, ge=1, le=100, description="Số lượng mỗi trang"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo mã, tên NCC, SĐT hoặc người liên hệ"),
    loai_hang: Optional[str] = Query(None, description="Lọc theo loại hàng cung cấp"),
    trang_thai: Optional[int] = Query(None, description="Lọc theo trạng thái (1: Hợp tác, 0: Ngừng)"),
):
    """Lấy danh sách nhà cung cấp phục vụ màn hình Quản lý Nhà cung cấp Admin."""
    return supplier_repository.get_supplier_list(
        db,
        page=page,
        page_size=page_size,
        search=search,
        loai_hang=loai_hang,
        trang_thai=trang_thai,
    )


@router.get("/{ma_ncc}", response_model=SupplierResponse, summary="Chi tiết nhà cung cấp")
def get_supplier_endpoint(ma_ncc: str, db: DbSession):
    """Xem chi tiết 1 nhà cung cấp."""
    supplier = supplier_repository.get_supplier_by_id(db, ma_ncc)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy nhà cung cấp {ma_ncc}",
        )
    return supplier


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED, summary="Thêm nhà cung cấp mới")
def create_supplier_endpoint(data: SupplierCreate, db: DbSession):
    """Tạo nhà cung cấp mới."""
    try:
        return supplier_repository.create_supplier(db, data.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi thêm nhà cung cấp: {str(e)}",
        )


@router.put("/{ma_ncc}", response_model=SupplierResponse, summary="Cập nhật nhà cung cấp")
def update_supplier_endpoint(ma_ncc: str, data: SupplierUpdate, db: DbSession):
    """Cập nhật thông tin nhà cung cấp."""
    try:
        supplier = supplier_repository.update_supplier(db, ma_ncc, data.model_dump(exclude_unset=True))
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy nhà cung cấp {ma_ncc}",
            )
        return supplier
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi cập nhật nhà cung cấp: {str(e)}",
        )


@router.put("/{ma_ncc}/status", response_model=SupplierResponse, summary="Đổi trạng thái hợp tác")
def toggle_status_endpoint(
    ma_ncc: str,
    trang_thai: int = Query(..., description="1: Hoạt động, 0: Ngừng hợp tác"),
    db: DbSession = None,
):
    """Bật / tắt trạng thái hợp tác với nhà cung cấp."""
    supplier = supplier_repository.update_supplier(db, ma_ncc, {"trang_thai": trang_thai})
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy nhà cung cấp {ma_ncc}",
        )
    return supplier


@router.delete("/{ma_ncc}", summary="Xóa nhà cung cấp")
def delete_supplier_endpoint(ma_ncc: str, db: DbSession):
    """Xóa vĩnh viễn nhà cung cấp (khi chưa có sản phẩm liên kết)."""
    try:
        supplier = supplier_repository.get_supplier_by_id(db, ma_ncc)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy nhà cung cấp {ma_ncc}",
            )
        supplier_repository.delete_supplier(db, ma_ncc)
        return {"success": True, "message": f"Đã xóa thành công nhà cung cấp {ma_ncc}"}
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
