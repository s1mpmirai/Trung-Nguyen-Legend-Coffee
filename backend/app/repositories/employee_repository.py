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
    if "hinh_thuc_lam_viec" not in employee or not employee["hinh_thuc_lam_viec"]:
        employee["hinh_thuc_lam_viec"] = "FULL_TIME"
    db.execute(
        text(
            """
            INSERT INTO nhan_vien (
                ma_nv, ho_ten, ngay_sinh, gioi_tinh, cccd, dia_chi, sdt, email,
                so_nguoi_pt, ma_pb, ma_cv, ma_cn, ngay_vao_lam, ngay_nghi_viec,
                trang_thai, hinh_thuc_lam_viec, so_tai_khoan, ngan_hang, ma_so_thue, so_bhxh
            ) VALUES (
                :ma_nv, :ho_ten, :ngay_sinh, :gioi_tinh, :cccd, :dia_chi, :sdt, :email,
                :so_nguoi_pt, :ma_pb, :ma_cv, :ma_cn, :ngay_vao_lam, :ngay_nghi_viec,
                :trang_thai, :hinh_thuc_lam_viec, :so_tai_khoan, :ngan_hang, :ma_so_thue, :so_bhxh
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
) -> dict:
    offset = (page - 1) * page_size

    total = db.execute(text("SELECT COUNT(*) FROM nhan_vien")).scalar() or 0

    query = """
        SELECT ma_nv, ho_ten, ngay_sinh, gioi_tinh, cccd, dia_chi, sdt, email,
               so_nguoi_pt, ma_pb, ma_cv, ma_cn, ngay_vao_lam, ngay_nghi_viec,
               trang_thai, hinh_thuc_lam_viec, so_tai_khoan, ngan_hang, ma_so_thue, so_bhxh
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

    return {
        "total": total,
        "items": [dict(row) for row in rows]
    }


def get_by_ma_nv(db: Session, ma_nv: str) -> dict | None:
    query = """
        SELECT 
            nv.ma_nv,
            nv.ho_ten,
            nv.ngay_sinh,
            nv.gioi_tinh,
            nv.cccd,
            nv.dia_chi,
            nv.sdt,
            nv.email,
            nv.so_nguoi_pt,
            nv.ma_pb,
            pb.ten_pb,
            nv.ma_cv,
            cv.ten_cv,
            nv.ngay_vao_lam,
            nv.ngay_nghi_viec,
            nv.trang_thai,
            nv.hinh_thuc_lam_viec,
            nv.so_tai_khoan,
            nv.ngan_hang,
            nv.ma_so_thue,
            nv.so_bhxh,
            hd.ma_hd,
            hd.loai_hd,
            hd.trang_thai AS trang_thai_hd,
            COALESCE(nv.hinh_thuc_lam_viec, 'FULL_TIME') AS hinh_thuc_lam_viec,
            tk.lan_dn_cuoi,
            tk.ngay_cap_nhat AS ngay_cap_nhat_tk
        FROM nhan_vien nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN (
            SELECT hd1.*
            FROM hop_dong_lao_dong hd1
            WHERE hd1.trang_thai = 'HIEU_LUC'
        ) hd ON hd.ma_nv = nv.ma_nv
        LEFT JOIN tai_khoan tk ON tk.ma_nv = nv.ma_nv
        WHERE nv.ma_nv = :ma_nv
        LIMIT 1
    """
    row = db.execute(text(query), {"ma_nv": ma_nv}).mappings().first()
    return dict(row) if row else None


def update_contact(db: Session, ma_nv: str, data: dict) -> dict | None:
    # Cho phép nhân viên cập nhật thông tin cá nhân & liên hệ
    allowed_fields = {"sdt", "email", "dia_chi", "so_tai_khoan", "ngan_hang", "ngay_sinh", "gioi_tinh", "hinh_thuc_lam_viec"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields and v is not None}
    
    # Chuẩn hóa giới tính theo enum ENUM('Nam', 'Nu', 'Khac')
    if "gioi_tinh" in update_data:
        gt_raw = str(update_data["gioi_tinh"]).strip()
        if gt_raw in ["Nữ", "Nu", "nu", "FEMALE", "Female"]:
            update_data["gioi_tinh"] = "Nu"
        elif gt_raw in ["Khác", "Khac", "khac", "OTHER", "Other"]:
            update_data["gioi_tinh"] = "Khac"
        else:
            update_data["gioi_tinh"] = "Nam"

    if not update_data:
        return get_by_ma_nv(db, ma_nv)

    set_clauses = [f"{k} = :{k}" for k in update_data.keys()]
    query = f"""
        UPDATE nhan_vien
        SET {', '.join(set_clauses)}
        WHERE ma_nv = :ma_nv
    """
    params = {**update_data, "ma_nv": ma_nv}
    db.execute(text(query), params)
    db.commit()
    return get_by_ma_nv(db, ma_nv)
