from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import product_repository
from app.schemas.product_schemas import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductStockUpdate,
    ProductUpdate,
)

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=ProductListResponse, summary="Danh sách sản phẩm")
def list_products_endpoint(
    db: DbSession,
    page: int = Query(1, ge=1, description="Trang hiện tại"),
    page_size: int = Query(10, ge=1, le=100, description="Số lượng mỗi trang"),
    search: Optional[str] = Query(None, description="Tìm kiếm mã, tên sản phẩm hoặc mô tả"),
    loai_sp: Optional[str] = Query(None, description="Lọc theo loại sản phẩm"),
    ma_ncc: Optional[str] = Query(None, description="Lọc theo nhà cung cấp"),
    min_price: Optional[float] = Query(None, ge=0, description="Giá bán từ"),
    max_price: Optional[float] = Query(None, ge=0, description="Giá bán đến"),
    low_stock: Optional[int] = Query(None, ge=0, description="Lọc sản phẩm có tồn kho nhỏ hơn hoặc bằng mức này (Cảnh báo hết hàng)"),
    trang_thai: Optional[int] = Query(None, description="1: Đang bán, 0: Tạm ngưng"),
):
    """Lấy danh sách sản phẩm cà phê, phin pha, bao bì phục vụ màn hình Quản lý Sản phẩm Admin."""
    return product_repository.get_product_list(
        db,
        page=page,
        page_size=page_size,
        search=search,
        loai_sp=loai_sp,
        ma_ncc=ma_ncc,
        min_price=min_price,
        max_price=max_price,
        low_stock=low_stock,
        trang_thai=trang_thai,
    )


@router.get("/categories/list", response_model=list[str], summary="Danh mục loại sản phẩm")
def get_categories_endpoint(db: DbSession):
    """Lấy danh sách các nhóm loại sản phẩm hiện có để hiển thị bộ lọc dropdown."""
    return product_repository.get_distinct_categories(db)


@router.get("/{ma_sp}", response_model=ProductResponse, summary="Chi tiết sản phẩm")
def get_product_endpoint(ma_sp: str, db: DbSession):
    """Xem thông tin chi tiết một sản phẩm."""
    product = product_repository.get_product_by_id(db, ma_sp)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm {ma_sp}",
        )
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, summary="Thêm sản phẩm mới")
def create_product_endpoint(data: ProductCreate, db: DbSession):
    """Tạo sản phẩm cà phê mới vào kho."""
    try:
        return product_repository.create_product(db, data.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi thêm sản phẩm: {str(e)}",
        )


@router.put("/{ma_sp}", response_model=ProductResponse, summary="Cập nhật sản phẩm")
def update_product_endpoint(ma_sp: str, data: ProductUpdate, db: DbSession):
    """Cập nhật giá, quy cách, thông tin sản phẩm."""
    try:
        product = product_repository.update_product(db, ma_sp, data.model_dump(exclude_unset=True))
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy sản phẩm {ma_sp}",
            )
        return product
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi cập nhật sản phẩm: {str(e)}",
        )


@router.put("/{ma_sp}/stock", response_model=ProductResponse, summary="Điều chỉnh tồn kho")
def adjust_stock_endpoint(ma_sp: str, data: ProductStockUpdate, db: DbSession):
    """Nhập kho thêm, xuất kho, hoặc điều chỉnh kiểm kê tồn kho sản phẩm."""
    try:
        return product_repository.adjust_stock(
            db,
            ma_sp=ma_sp,
            loai_thay_doi=data.loai_thay_doi,
            so_luong=data.so_luong,
            ghi_chu=data.ghi_chu,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{ma_sp}/status", response_model=ProductResponse, summary="Đổi trạng thái kinh doanh")
def toggle_status_endpoint(
    ma_sp: str,
    trang_thai: int = Query(..., description="1: Đang bán, 0: Tạm ngưng"),
    db: DbSession = None,
):
    """Bật / tắt trạng thái kinh doanh của sản phẩm."""
    product = product_repository.update_product(db, ma_sp, {"trang_thai": trang_thai})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm {ma_sp}",
        )
    return product


@router.delete("/{ma_sp}", summary="Xóa sản phẩm")
def delete_product_endpoint(ma_sp: str, db: DbSession):
    """Xóa vĩnh viễn sản phẩm khỏi kho."""
    try:
        product = product_repository.get_product_by_id(db, ma_sp)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy sản phẩm {ma_sp}",
            )
        product_repository.delete_product(db, ma_sp)
        return {"success": True, "message": f"Đã xóa thành công sản phẩm {ma_sp}"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
