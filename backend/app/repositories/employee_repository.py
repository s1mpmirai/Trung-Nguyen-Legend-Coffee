import json
from datetime import date, datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.datetime_utils import get_vietnam_now



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
    # Cho phép nhân viên cập nhật thông tin cá nhân & liên hệ, thuế, bảo hiểm
    allowed_fields = {
        "sdt", "email", "dia_chi", "so_tai_khoan", "ngan_hang",
        "ngay_sinh", "gioi_tinh", "hinh_thuc_lam_viec", "ma_so_thue", "so_bhxh"
    }
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


def _parse_json(val):
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return val


def get_profile_request_by_id(db: Session, ma_yc: int) -> dict | None:
    query = """
        SELECT 
            yc.ma_yc,
            yc.ma_nv,
            nv.ho_ten,
            pb.ten_pb,
            cv.ten_cv,
            yc.thong_tin_cu,
            yc.thong_tin_moi,
            yc.ly_do,
            yc.trang_thai,
            yc.nguoi_duyet,
            nd.ho_ten AS ten_nguoi_duyet,
            yc.ngay_duyet,
            yc.y_kien_duyet,
            yc.ngay_tao,
            yc.ngay_cap_nhat
        FROM yeu_cau_cap_nhat_ho_so yc
        JOIN nhan_vien nv ON yc.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN nhan_vien nd ON yc.nguoi_duyet = nd.ma_nv
        WHERE yc.ma_yc = :ma_yc
        LIMIT 1
    """
    row = db.execute(text(query), {"ma_yc": ma_yc}).mappings().first()
    if not row:
        return None
    res = dict(row)
    res["thong_tin_cu"] = _parse_json(res["thong_tin_cu"])
    res["thong_tin_moi"] = _parse_json(res["thong_tin_moi"])
    return res


def create_profile_update_request(
    db: Session,
    ma_nv: str,
    thong_tin_moi: dict,
    ly_do: str | None = None,
) -> dict:
    current_profile = get_by_ma_nv(db, ma_nv)
    if not current_profile:
        raise ValueError(f"Không tìm thấy nhân viên {ma_nv}")

    allowed_fields = [
        "ngay_sinh", "gioi_tinh", "sdt", "email", "dia_chi",
        "so_tai_khoan", "ngan_hang", "hinh_thuc_lam_viec", "ma_so_thue", "so_bhxh"
    ]
    
    clean_thong_tin_moi = {}
    for k in allowed_fields:
        if k in thong_tin_moi and thong_tin_moi[k] is not None:
            clean_thong_tin_moi[k] = thong_tin_moi[k]

    # Chuẩn hóa giới tính nếu có
    if "gioi_tinh" in clean_thong_tin_moi:
        gt_raw = str(clean_thong_tin_moi["gioi_tinh"]).strip()
        if gt_raw in ["Nữ", "Nu", "nu", "FEMALE", "Female"]:
            clean_thong_tin_moi["gioi_tinh"] = "Nu"
        elif gt_raw in ["Khác", "Khac", "khac", "OTHER", "Other"]:
            clean_thong_tin_moi["gioi_tinh"] = "Khac"
        else:
            clean_thong_tin_moi["gioi_tinh"] = "Nam"
    
    if not clean_thong_tin_moi:
        raise ValueError("Không có thông tin thay đổi hợp lệ để gửi yêu cầu")

    # Snapshot thông tin cũ từ database hiện tại
    thong_tin_cu = {}
    for k in clean_thong_tin_moi.keys():
        val = current_profile.get(k)
        if isinstance(val, (date, datetime)):
            val = val.isoformat()
        thong_tin_cu[k] = val

    existing = db.execute(
        text("SELECT ma_yc FROM yeu_cau_cap_nhat_ho_so WHERE ma_nv = :ma_nv AND trang_thai = 'CHO_DUYET' ORDER BY ma_yc DESC LIMIT 1"),
        {"ma_nv": ma_nv},
    ).mappings().first()

    now_vn = get_vietnam_now()

    if existing:
        ma_yc = existing["ma_yc"]
        db.execute(
            text("""
                UPDATE yeu_cau_cap_nhat_ho_so
                SET thong_tin_cu = :thong_tin_cu,
                    thong_tin_moi = :thong_tin_moi,
                    ly_do = :ly_do,
                    ngay_cap_nhat = :ngay_cap_nhat
                WHERE ma_yc = :ma_yc
            """),
            {
                "ma_yc": ma_yc,
                "thong_tin_cu": json.dumps(thong_tin_cu, ensure_ascii=False, default=str),
                "thong_tin_moi": json.dumps(clean_thong_tin_moi, ensure_ascii=False, default=str),
                "ly_do": ly_do,
                "ngay_cap_nhat": now_vn,
            },
        )
    else:
        result = db.execute(
            text("""
                INSERT INTO yeu_cau_cap_nhat_ho_so (
                    ma_nv, thong_tin_cu, thong_tin_moi, ly_do, trang_thai, ngay_tao, ngay_cap_nhat
                ) VALUES (
                    :ma_nv, :thong_tin_cu, :thong_tin_moi, :ly_do, 'CHO_DUYET', :ngay_tao, :ngay_cap_nhat
                )
            """),
            {
                "ma_nv": ma_nv,
                "thong_tin_cu": json.dumps(thong_tin_cu, ensure_ascii=False, default=str),
                "thong_tin_moi": json.dumps(clean_thong_tin_moi, ensure_ascii=False, default=str),
                "ly_do": ly_do,
                "ngay_tao": now_vn,
                "ngay_cap_nhat": now_vn,
            },
        )
        ma_yc = result.lastrowid

    db.commit()
    return get_profile_request_by_id(db, ma_yc)


def get_pending_profile_request_by_employee(db: Session, ma_nv: str) -> dict | None:
    row = db.execute(
        text("SELECT ma_yc FROM yeu_cau_cap_nhat_ho_so WHERE ma_nv = :ma_nv AND trang_thai = 'CHO_DUYET' ORDER BY ma_yc DESC LIMIT 1"),
        {"ma_nv": ma_nv},
    ).mappings().first()
    if not row:
        return None
    return get_profile_request_by_id(db, row["ma_yc"])


def cancel_profile_update_request(db: Session, ma_yc: int, ma_nv: str | None = None) -> dict:
    req = get_profile_request_by_id(db, ma_yc)
    if not req:
        raise ValueError(f"Không tìm thấy yêu cầu #{ma_yc}")
    if req["trang_thai"] != "CHO_DUYET":
        raise ValueError("Chỉ có thể hủy yêu cầu đang ở trạng thái Chờ duyệt")
    if ma_nv and req["ma_nv"] != ma_nv:
        raise ValueError("Bạn không có quyền hủy yêu cầu của nhân viên khác")

    now_vn = get_vietnam_now()
    db.execute(
        text("UPDATE yeu_cau_cap_nhat_ho_so SET trang_thai = 'DA_HUY', ngay_cap_nhat = :now WHERE ma_yc = :ma_yc"),
        {"ma_yc": ma_yc, "now": now_vn},
    )
    db.commit()
    return get_profile_request_by_id(db, ma_yc)


def get_profile_requests_for_manager(db: Session, trang_thai: str | None = None) -> list[dict]:
    where_clause = ""
    params = {}
    if trang_thai:
        where_clause = "WHERE yc.trang_thai = :trang_thai"
        params["trang_thai"] = trang_thai

    query = f"""
        SELECT 
            yc.ma_yc,
            yc.ma_nv,
            nv.ho_ten,
            pb.ten_pb,
            cv.ten_cv,
            yc.thong_tin_cu,
            yc.thong_tin_moi,
            yc.ly_do,
            yc.trang_thai,
            yc.nguoi_duyet,
            nd.ho_ten AS ten_nguoi_duyet,
            yc.ngay_duyet,
            yc.y_kien_duyet,
            yc.ngay_tao,
            yc.ngay_cap_nhat
        FROM yeu_cau_cap_nhat_ho_so yc
        JOIN nhan_vien nv ON yc.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN nhan_vien nd ON yc.nguoi_duyet = nd.ma_nv
        {where_clause}
        ORDER BY yc.ngay_tao DESC
    """
    rows = db.execute(text(query), params).mappings().all()
    results = []
    for r in rows:
        item = dict(r)
        item["thong_tin_cu"] = _parse_json(item["thong_tin_cu"])
        item["thong_tin_moi"] = _parse_json(item["thong_tin_moi"])
        results.append(item)
    return results


def review_profile_update_request(
    db: Session,
    ma_yc: int,
    trang_thai: str,
    nguoi_duyet: str | None = None,
    y_kien_duyet: str | None = None,
) -> dict:
    if trang_thai not in ["DA_DUYET", "TU_CHOI"]:
        raise ValueError("Trạng thái phê duyệt không hợp lệ (chỉ chấp nhận DA_DUYET hoặc TU_CHOI)")

    req = get_profile_request_by_id(db, ma_yc)
    if not req:
        raise ValueError(f"Không tìm thấy yêu cầu #{ma_yc}")
    if req["trang_thai"] != "CHO_DUYET":
        raise ValueError(f"Yêu cầu #{ma_yc} đã được xử lý (trạng thái: {req['trang_thai']})")

    now_vn = get_vietnam_now()

    if trang_thai == "DA_DUYET":
        thong_tin_moi = req["thong_tin_moi"] or {}
        # Áp dụng thông tin mới vào bảng nhan_vien
        update_contact(db, req["ma_nv"], thong_tin_moi)

    db.execute(
        text("""
            UPDATE yeu_cau_cap_nhat_ho_so
            SET trang_thai = :trang_thai,
                nguoi_duyet = :nguoi_duyet,
                ngay_duyet = :ngay_duyet,
                y_kien_duyet = :y_kien_duyet,
                ngay_cap_nhat = :ngay_cap_nhat
            WHERE ma_yc = :ma_yc
        """),
        {
            "ma_yc": ma_yc,
            "trang_thai": trang_thai,
            "nguoi_duyet": nguoi_duyet,
            "ngay_duyet": now_vn,
            "y_kien_duyet": y_kien_duyet,
            "ngay_cap_nhat": now_vn,
        },
    )
    db.commit()
    return get_profile_request_by_id(db, ma_yc)

