from datetime import date
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import contract_repository
from app.schemas.contract_schemas import (
    ContractCreate,
    ContractListResponse,
    ContractResponse,
    ContractUpdate,
)

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=ContractListResponse, summary="Danh sách hợp đồng lao động")
def list_contracts_endpoint(
    db: DbSession,
    page: int = Query(1, ge=1, description="Trang hiện tại"),
    page_size: int = Query(10, ge=1, le=100, description="Số lượng mỗi trang"),
    search: Optional[str] = Query(None, description="Tìm theo mã HĐ, mã NV, họ tên hoặc CCCD"),
    loai_hd: Optional[str] = Query(None, description="THU_VIEC, XAC_DINH_1_NAM, XAC_DINH_3_NAM, KHONG_XAC_DINH, THOI_VU"),
    trang_thai: Optional[str] = Query(None, description="HIEU_LUC, HET_HAN, DA_THANH_LY, TAM_HOAN"),
    expiring_days: Optional[int] = Query(None, description="Lọc hợp đồng sắp hết hạn trong N ngày (vd: 30)"),
):
    """Lấy danh sách hợp đồng lao động của toàn bộ nhân sự (Admin & Quản lý)."""
    return contract_repository.get_contract_list(
        db,
        page=page,
        page_size=page_size,
        search=search,
        loai_hd=loai_hd,
        trang_thai=trang_thai,
        expiring_days=expiring_days,
    )


@router.get("/{ma_hd}", response_model=ContractResponse, summary="Chi tiết hợp đồng")
def get_contract_endpoint(ma_hd: str, db: DbSession):
    """Xem chi tiết một hợp đồng lao động."""
    contract = contract_repository.get_contract_by_id(db, ma_hd)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy hợp đồng {ma_hd}",
        )
    return contract


@router.get("/employee/{ma_nv}", response_model=list[ContractResponse], summary="Lịch sử hợp đồng của nhân viên")
def get_employee_contracts_endpoint(ma_nv: str, db: DbSession):
    """Lấy toàn bộ các hợp đồng lao động từ trước đến nay của một nhân viên."""
    return contract_repository.get_contracts_by_employee(db, ma_nv)


@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED, summary="Ký mới hợp đồng")
def create_contract_endpoint(data: ContractCreate, db: DbSession):
    """Tạo mới / ký hợp đồng lao động cho nhân sự."""
    try:
        return contract_repository.create_contract(db, data.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi tạo hợp đồng: {str(e)}",
        )


@router.put("/{ma_hd}", response_model=ContractResponse, summary="Cập nhật hợp đồng")
def update_contract_endpoint(ma_hd: str, data: ContractUpdate, db: DbSession):
    """Cập nhật thông tin hợp đồng (lương cơ bản, tỷ lệ hưởng, STK, ngân hàng, MST, số BHXH)."""
    try:
        contract = contract_repository.update_contract(db, ma_hd, data.model_dump(exclude_unset=True))
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy hợp đồng {ma_hd}",
            )
        return contract
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi cập nhật hợp đồng: {str(e)}",
        )


@router.put("/{ma_hd}/liquidate", response_model=ContractResponse, summary="Thanh lý hợp đồng")
def liquidate_contract_endpoint(
    ma_hd: str,
    ngay_ket_thuc: Optional[date] = Query(None, description="Ngày kết thúc thanh lý (mặc định hôm nay)"),
    db: DbSession = None,
):
    """Thanh lý / kết thúc hợp đồng lao động của nhân viên."""
    try:
        return contract_repository.liquidate_contract(db, ma_hd, ngay_ket_thuc=ngay_ket_thuc)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{ma_hd}", summary="Xóa hợp đồng")
def delete_contract_endpoint(ma_hd: str, db: DbSession):
    """Xóa hợp đồng khỏi hệ thống."""
    try:
        contract = contract_repository.get_contract_by_id(db, ma_hd)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy hợp đồng {ma_hd}",
            )
        contract_repository.delete_contract(db, ma_hd)
        return {"success": True, "message": f"Đã xóa thành công hợp đồng {ma_hd}"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
