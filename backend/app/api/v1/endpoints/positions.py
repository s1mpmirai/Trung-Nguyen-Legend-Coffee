from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import department_repository
from app.schemas.department_schemas import (
    PositionCreate,
    PositionResponse,
    PositionUpdate,
    SalaryScaleItem,
)

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[PositionResponse], summary="Danh sách chức vụ")
def list_positions_endpoint(
    db: DbSession,
    search: Optional[str] = Query(None, description="Tìm theo mã hoặc tên chức vụ"),
    sort_by: Optional[str] = Query(None, description="Trường sắp xếp: ma_cv, ten_cv, cap_bac, phu_cap_chuc_vu, so_luong_nv"),
    sort_order: Optional[str] = Query("asc", description="Thứ tự sắp xếp: asc hoặc desc"),
    trang_thai: Optional[int] = Query(None, description="1: Đang sử dụng, 0: Ngừng sử dụng"),
):
    """Lấy danh sách tất cả các chức vụ trong hệ thống kèm thang bảng lương."""
    return department_repository.get_positions_list(
        db, search=search, sort_by=sort_by, sort_order=sort_order, trang_thai=trang_thai
    )


@router.get("/{ma_cv}", response_model=PositionResponse, summary="Chi tiết chức vụ")
def get_position_endpoint(ma_cv: str, db: DbSession):
    """Xem chi tiết chức vụ và các bậc lương tương ứng."""
    pos = department_repository.get_position_by_id(db, ma_cv)
    if not pos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy chức vụ {ma_cv}",
        )
    return pos


@router.post("", response_model=PositionResponse, status_code=status.HTTP_201_CREATED, summary="Thêm chức vụ mới")
def create_position_endpoint(data: PositionCreate, db: DbSession):
    """Tạo chức vụ mới (Admin)."""
    try:
        return department_repository.create_position(db, data.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi thêm chức vụ: {str(e)}",
        )


@router.put("/{ma_cv}", response_model=PositionResponse, summary="Cập nhật chức vụ")
def update_position_endpoint(ma_cv: str, data: PositionUpdate, db: DbSession):
    """Cập nhật thông tin chức vụ, phụ cấp chức vụ."""
    try:
        pos = department_repository.update_position(db, ma_cv, data.model_dump(exclude_unset=True))
        if not pos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy chức vụ {ma_cv}",
            )
        return pos
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi cập nhật chức vụ: {str(e)}",
        )


@router.delete("/{ma_cv}", summary="Xóa chức vụ (xóa mềm: chuyển sang Ngừng sử dụng)")
def delete_position_endpoint(ma_cv: str, db: DbSession):
    """Xóa mềm chức vụ khi không còn nhân sự đang giữ chức vụ. Khôi phục bằng PUT trang_thai = 1."""
    try:
        pos = department_repository.get_position_by_id(db, ma_cv)
        if not pos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy chức vụ {ma_cv}",
            )
        department_repository.delete_position(db, ma_cv)
        return {"success": True, "message": f"Đã xóa chức vụ {ma_cv} (chuyển sang Ngừng sử dụng, có thể khôi phục)"}
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{ma_cv}/salary-scales", response_model=list[SalaryScaleItem], summary="Thang bậc lương chức vụ")
def get_salary_scales_endpoint(ma_cv: str, db: DbSession):
    """Xem danh sách các bậc lương theo chức vụ."""
    return department_repository.get_salary_scales(db, ma_cv)


@router.post("/{ma_cv}/salary-scales", response_model=SalaryScaleItem, status_code=status.HTTP_201_CREATED, summary="Thêm bậc lương")
def create_salary_scale_endpoint(ma_cv: str, data: SalaryScaleItem, db: DbSession):
    """Thêm một bậc lương mới cho chức vụ."""
    try:
        data_dict = data.model_dump()
        data_dict["ma_cv"] = ma_cv
        return department_repository.create_salary_scale(db, data_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi thêm bậc lương: {str(e)}",
        )
