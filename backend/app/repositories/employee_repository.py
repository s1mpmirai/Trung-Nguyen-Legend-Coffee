from sqlalchemy import text
from sqlalchemy.orm import Session

def get_by_cccd(db: Session, cccd: str) -> dict | None:
    row = db.execute(
        text("SELECT ma_nv, cccd FROM nhan_vien WHERE cccd = :cccd LIMIT 1"),
        {"cccd": cccd},
    ).mappings().first()
    return dict(row) if row else None


def get_latest_employee_code(db: Session) -> str | None:
    return db.execute(
        text(
            """
            SELECT ma_nv
            FROM nhan_vien
            WHERE ma_nv REGEXP '^NV[0-9]+$'
            ORDER BY CAST(SUBSTRING(ma_nv, 3) AS UNSIGNED) DESC
            LIMIT 1
            """
        )
    ).scalar_one_or_none()


def create(db: Session, employee: dict) -> dict:
    db.execute(
        text(
            """
            INSERT INTO nhan_vien (
                ma_nv, ho_ten, ngay_sinh, gioi_tinh, cccd, dia_chi, sdt, email,
                so_nguoi_pt, ma_pb, ma_cv, ma_cn, ngay_vao_lam, ngay_nghi_viec,
                trang_thai, so_tai_khoan, ngan_hang, ma_so_thue, so_bhxh
            ) VALUES (
                :ma_nv, :ho_ten, :ngay_sinh, :gioi_tinh, :cccd, :dia_chi, :sdt, :email,
                :so_nguoi_pt, :ma_pb, :ma_cv, :ma_cn, :ngay_vao_lam, :ngay_nghi_viec,
                :trang_thai, :so_tai_khoan, :ngan_hang, :ma_so_thue, :so_bhxh
            )
            """
        ),
        employee,
    )
    return employee

def get_employee_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
) -> list[dict]:
    offset = (page - 1) * page_size
    query = """
        SELECT ma_nv, ho_ten, ngay_sinh, gioi_tinh, cccd, dia_chi, sdt, email,
               so_nguoi_pt, ma_pb, ma_cv, ma_cn, ngay_vao_lam, ngay_nghi_viec,
               trang_thai, so_tai_khoan, ngan_hang, ma_so_thue, so_bhxh
        FROM nhan_vien
        ORDER BY ma_nv ASC
        LIMIT :limit OFFSET :offset
    """
    rows = db.execute(
        text(query),
        {
            "limit": page_size,
            "offset": offset,
        },
    ).mappings().all()

    return [dict(row) for row in rows]
