from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import department_repository
from app.schemas.department_schemas import (
    DepartmentCreate,
    DepartmentDetailResponse,
    DepartmentResponse,
    DepartmentUpdate,
)

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[DepartmentResponse], summary="Danh sách phòng ban")
def list_departments_endpoint(
    db: DbSession,
    search: Optional[str] = Query(None, description="Tìm theo mã PB, tên PB hoặc tên trưởng phòng"),
    trang_thai: Optional[int] = Query(None, description="1: Hoạt động, 0: Ngừng"),
):
    """Lấy danh sách tất cả các phòng ban trong tập đoàn Trung Nguyên kèm số lượng nhân sự."""
    return department_repository.get_departments_list(db, search=search, trang_thai=trang_thai)


@router.get("/{ma_pb}", response_model=DepartmentDetailResponse, summary="Chi tiết phòng ban")
def get_department_endpoint(ma_pb: str, db: DbSession):
    """Xem chi tiết thông tin phòng ban kèm danh sách nhân sự trực thuộc."""
    dept = department_repository.get_department_by_id(db, ma_pb)
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy phòng ban {ma_pb}",
        )
    return dept


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED, summary="Thêm phòng ban mới")
def create_department_endpoint(data: DepartmentCreate, db: DbSession):
    """Tạo mới phòng ban (Admin)."""
    try:
        return department_repository.create_department(db, data.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi thêm phòng ban: {str(e)}",
        )


@router.put("/{ma_pb}", response_model=DepartmentResponse, summary="Cập nhật phòng ban")
def update_department_endpoint(ma_pb: str, data: DepartmentUpdate, db: DbSession):
    """Cập nhật thông tin phòng ban, bổ nhiệm trưởng phòng mới."""
    try:
        dept = department_repository.update_department(db, ma_pb, data.model_dump(exclude_unset=True))
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy phòng ban {ma_pb}",
            )
        return dept
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi cập nhật phòng ban: {str(e)}",
        )


@router.delete("/{ma_pb}", summary="Xóa phòng ban")
def delete_department_endpoint(ma_pb: str, db: DbSession):
    """Xóa phòng ban (chỉ được xóa khi không còn nhân sự thuộc phòng ban này)."""
    try:
        dept = department_repository.get_department_by_id(db, ma_pb)
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy phòng ban {ma_pb}",
            )
        department_repository.delete_department(db, ma_pb)
        return {"success": True, "message": f"Đã xóa thành công phòng ban {ma_pb}"}
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
