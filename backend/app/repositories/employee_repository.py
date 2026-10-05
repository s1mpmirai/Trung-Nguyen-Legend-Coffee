import json
from datetime import date, datetime
from typing import Any, Optional

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
    
    nv_data = {
        "ma_nv": employee["ma_nv"],
        "ho_ten": employee["ho_ten"],
        "ngay_sinh": employee["ngay_sinh"],
        "gioi_tinh": employee["gioi_tinh"],
        "cccd": employee.get("cccd"),
        "dia_chi": employee.get("dia_chi"),
        "sdt": employee.get("sdt"),
        "email": employee.get("email"),
        "so_nguoi_pt": employee.get("so_nguoi_pt", 0),
        "ma_pb": employee["ma_pb"],
        "ma_cv": employee["ma_cv"],
        "ngay_nghi_viec": employee.get("ngay_nghi_viec"),
        "trang_thai": employee.get("trang_thai", "DANG_LAM"),
        "hinh_thuc_lam_viec": employee.get("hinh_thuc_lam_viec", "FULL_TIME"),
    }
    db.execute(
        text(
            """
            INSERT INTO nhan_vien (
                ma_nv, ho_ten, ngay_sinh, gioi_tinh, cccd, dia_chi, sdt, email,
                so_nguoi_pt, ma_pb, ma_cv, ngay_nghi_viec,
                trang_thai, hinh_thuc_lam_viec
            ) VALUES (
                :ma_nv, :ho_ten, :ngay_sinh, :gioi_tinh, :cccd, :dia_chi, :sdt, :email,
                :so_nguoi_pt, :ma_pb, :ma_cv, :ngay_nghi_viec,
                :trang_thai, :hinh_thuc_lam_viec
            )
            """
        ),
        nv_data,
    )

    ngay_vao_lam = employee.get("ngay_vao_lam") or date.today()
    ma_hd = f"HD-{employee['ma_nv']}"
    hd_data = {
        "ma_hd": ma_hd,
        "ma_nv": employee["ma_nv"],
        "loai_hd": "THU_VIEC",
        "ngay_ky": ngay_vao_lam,
        "ngay_bat_dau": ngay_vao_lam,
        "ngay_ket_thuc": None,
        "luong_co_ban": 8000000,
        "ty_le_huong": 100.0,
        "so_tai_khoan": employee.get("so_tai_khoan"),
        "ngan_hang": employee.get("ngan_hang"),
        "ma_so_thue": employee.get("ma_so_thue"),
        "so_bhxh": employee.get("so_bhxh"),
        "trang_thai": "HIEU_LUC",
    }
    db.execute(
        text(
            """
            INSERT INTO hop_dong_lao_dong (
                ma_hd, ma_nv, loai_hd, ngay_ky, ngay_bat_dau, ngay_ket_thuc,
                luong_co_ban, ty_le_huong, so_tai_khoan, ngan_hang, ma_so_thue, so_bhxh, trang_thai
            ) VALUES (
                :ma_hd, :ma_nv, :loai_hd, :ngay_ky, :ngay_bat_dau, :ngay_ket_thuc,
                :luong_co_ban, :ty_le_huong, :so_tai_khoan, :ngan_hang, :ma_so_thue, :so_bhxh, :trang_thai
            )
            """
        ),
        hd_data,
    )
    return employee

def get_employee_list(
    db: Session,
    page: int = 1,
    page_size: int = 50,
    q: str | None = None,
    ma_pb: str | None = None,
    ma_cv: str | None = None,
    trang_thai: str | None = None,
    hinh_thuc_lam_viec: str | None = None,
    gioi_tinh: str | None = None,
    loai_hd: str | None = None,
    luong_tu: float | None = None,
    luong_den: float | None = None,
    ngay_vao_tu: str | None = None,
    ngay_vao_den: str | None = None,
    sort_by: str = "ma_nv",
    sort_order: str = "asc",
) -> dict:
    page = max(1, page or 1)
    page_size = max(1, min(200, page_size or 50))
    offset = (page - 1) * page_size

    conditions = []
    params: dict = {}

    if q and q.strip():
        search_term = f"%{q.strip()}%"
        conditions.append(
            "(nv.ma_nv LIKE :q OR nv.ho_ten LIKE :q OR nv.email LIKE :q OR nv.sdt LIKE :q OR nv.cccd LIKE :q)"
        )
        params["q"] = search_term

    if ma_pb and ma_pb.strip():
        conditions.append("nv.ma_pb = :ma_pb")
        params["ma_pb"] = ma_pb.strip()

    if ma_cv and ma_cv.strip():
        conditions.append("nv.ma_cv = :ma_cv")
        params["ma_cv"] = ma_cv.strip()

    if trang_thai and trang_thai.strip():
        conditions.append("nv.trang_thai = :trang_thai")
        params["trang_thai"] = trang_thai.strip()

    if hinh_thuc_lam_viec and hinh_thuc_lam_viec.strip():
        conditions.append("nv.hinh_thuc_lam_viec = :hinh_thuc_lam_viec")
        params["hinh_thuc_lam_viec"] = hinh_thuc_lam_viec.strip()

    if gioi_tinh and gioi_tinh.strip():
        gt = gioi_tinh.strip()
        if gt in ["Nữ", "Nu", "nu", "FEMALE", "Female"]:
            gt = "Nu"
        elif gt in ["Nam", "nam", "MALE", "Male"]:
            gt = "Nam"
        conditions.append("nv.gioi_tinh = :gioi_tinh")
        params["gioi_tinh"] = gt

    if loai_hd and loai_hd.strip():
        conditions.append("hd.loai_hd = :loai_hd")
        params["loai_hd"] = loai_hd.strip()

    if luong_tu is not None:
        conditions.append("hd.luong_co_ban >= :luong_tu")
        params["luong_tu"] = luong_tu

    if luong_den is not None:
        conditions.append("hd.luong_co_ban <= :luong_den")
        params["luong_den"] = luong_den

    if ngay_vao_tu and ngay_vao_tu.strip():
        conditions.append("hd.ngay_bat_dau >= :ngay_vao_tu")
        params["ngay_vao_tu"] = ngay_vao_tu.strip()

    if ngay_vao_den and ngay_vao_den.strip():
        conditions.append("hd.ngay_bat_dau <= :ngay_vao_den")
        params["ngay_vao_den"] = ngay_vao_den.strip()

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    from_joins = """
        FROM nhan_vien nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN (
            SELECT hd1.*
            FROM hop_dong_lao_dong hd1
            INNER JOIN (
                SELECT ma_nv, MAX(ngay_bat_dau) AS max_ngay
                FROM hop_dong_lao_dong
                GROUP BY ma_nv
            ) latest ON hd1.ma_nv = latest.ma_nv AND hd1.ngay_bat_dau = latest.max_ngay
        ) hd ON hd.ma_nv = nv.ma_nv
        LEFT JOIN (
            SELECT bc1.ma_nv, bc1.trinh_do, bc1.chuyen_nganh, bc1.noi_dao_tao, bc1.nam_tot_nghiep
            FROM bang_cap bc1
            INNER JOIN (
                SELECT ma_nv, MAX(ma_bc) AS max_bc
                FROM bang_cap
                GROUP BY ma_nv
            ) latest_bc ON bc1.ma_bc = latest_bc.max_bc
        ) bc ON bc.ma_nv = nv.ma_nv
    """

    count_query = f"SELECT COUNT(*) {from_joins} {where_clause}"
    total = db.execute(text(count_query), params).scalar() or 0

    sort_column_map = {
        "ma_nv": "nv.ma_nv",
        "ho_ten": "nv.ho_ten",
        "ngay_sinh": "nv.ngay_sinh",
        "ngay_vao_lam": "hd.ngay_bat_dau",
        "luong_co_ban": "hd.luong_co_ban",
        "muc_luong": "hd.luong_co_ban",
        "ten_pb": "pb.ten_pb",
        "ten_cv": "cv.ten_cv",
        "trang_thai": "nv.trang_thai",
    }
    col = sort_column_map.get(sort_by.lower() if sort_by else "ma_nv", "nv.ma_nv")
    order = "DESC" if str(sort_order).lower() == "desc" else "ASC"
    order_clause = f"ORDER BY {col} {order}, nv.ma_nv ASC"

    data_params = dict(params)
    data_params["limit"] = page_size
    data_params["offset"] = offset

    data_query = f"""
        SELECT 
            nv.ma_nv, nv.ho_ten, nv.ngay_sinh, nv.gioi_tinh, nv.cccd, nv.dia_chi, nv.sdt, nv.email,
            nv.so_nguoi_pt, nv.ma_pb, pb.ten_pb, nv.ma_cv, cv.ten_cv, nv.ma_bac, nv.ma_nql,
            nv.ngay_nghi_viec, nv.trang_thai, COALESCE(nv.hinh_thuc_lam_viec, 'FULL_TIME') AS hinh_thuc_lam_viec,
            nv.ngay_tao, nv.ngay_cap_nhat,
            hd.ma_hd, hd.loai_hd,
            hd.ngay_bat_dau AS ngay_vao_lam,
            hd.ngay_ket_thuc,
            hd.luong_co_ban AS muc_luong,
            hd.so_tai_khoan, hd.ngan_hang, hd.ma_so_thue, hd.so_bhxh,
            bc.trinh_do, bc.chuyen_nganh, bc.noi_dao_tao, bc.nam_tot_nghiep
        {from_joins}
        {where_clause}
        {order_clause}
        LIMIT :limit OFFSET :offset
    """

    rows = db.execute(text(data_query), data_params).mappings().all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": [dict(row) for row in rows],
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
            hd.ngay_bat_dau AS ngay_vao_lam,
            nv.ngay_nghi_viec,
            nv.trang_thai,
            COALESCE(nv.hinh_thuc_lam_viec, 'FULL_TIME') AS hinh_thuc_lam_viec,
            hd.so_tai_khoan,
            hd.ngan_hang,
            hd.ma_so_thue,
            hd.so_bhxh,
            hd.ma_hd,
            hd.loai_hd,
            hd.trang_thai AS trang_thai_hd,
            tk.lan_dn_cuoi,
            tk.ngay_cap_nhat AS ngay_cap_nhat_tk
        FROM nhan_vien nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN (
            SELECT hd1.*
            FROM hop_dong_lao_dong hd1
            INNER JOIN (
                SELECT ma_nv, MAX(ngay_bat_dau) AS max_ngay
                FROM hop_dong_lao_dong
                GROUP BY ma_nv
            ) latest ON hd1.ma_nv = latest.ma_nv AND hd1.ngay_bat_dau = latest.max_ngay
        ) hd ON hd.ma_nv = nv.ma_nv
        LEFT JOIN tai_khoan tk ON tk.ma_nv = nv.ma_nv
        WHERE nv.ma_nv = :ma_nv
        LIMIT 1
    """
    row = db.execute(text(query), {"ma_nv": ma_nv}).mappings().first()
    return dict(row) if row else None


def update_contact(db: Session, ma_nv: str, data: dict) -> dict | None:
    nv_fields = {"sdt", "email", "dia_chi", "ngay_sinh", "gioi_tinh", "hinh_thuc_lam_viec"}
    hd_fields = {"so_tai_khoan", "ngan_hang", "ma_so_thue", "so_bhxh"}
    
    nv_data = {k: v for k, v in data.items() if k in nv_fields and v is not None}
    hd_data = {k: v for k, v in data.items() if k in hd_fields and v is not None}
    
    # Chuẩn hóa giới tính theo enum ENUM('Nam', 'Nu', 'Khac')
    if "gioi_tinh" in nv_data:
        gt_raw = str(nv_data["gioi_tinh"]).strip()
        if gt_raw in ["Nữ", "Nu", "nu", "FEMALE", "Female"]:
            nv_data["gioi_tinh"] = "Nu"
        elif gt_raw in ["Khác", "Khac", "khac", "OTHER", "Other"]:
            nv_data["gioi_tinh"] = "Khac"
        else:
            nv_data["gioi_tinh"] = "Nam"

    if nv_data:
        set_clauses = [f"{k} = :{k}" for k in nv_data.keys()]
        query_nv = f"""
            UPDATE nhan_vien
            SET {', '.join(set_clauses)}
            WHERE ma_nv = :ma_nv
        """
        db.execute(text(query_nv), {**nv_data, "ma_nv": ma_nv})

    if hd_data:
        set_clauses_hd = [f"{k} = :{k}" for k in hd_data.keys()]
        query_hd = f"""
            UPDATE hop_dong_lao_dong
            SET {', '.join(set_clauses_hd)}
            WHERE ma_nv = :ma_nv
            ORDER BY (trang_thai = 'HIEU_LUC') DESC, ngay_bat_dau DESC
            LIMIT 1
        """
        db.execute(text(query_hd), {**hd_data, "ma_nv": ma_nv})

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


def update_employee_status(
    db: Session,
    ma_nv: str,
    trang_thai: str,
    ngay_nghi_viec: date | None = None,
    khoa_tai_khoan: bool = True,
    ly_do: str | None = None,
) -> dict | None:
    """Cập nhật trạng thái nhân viên (khóa / thôi việc / tạm hoãn / đi làm lại)."""
    now_vn = get_vietnam_now()
    today_vn = now_vn.date()

    if trang_thai == "DA_NGHI_VIEC" and not ngay_nghi_viec:
        ngay_nghi_viec = today_vn
    elif trang_thai == "DANG_LAM":
        ngay_nghi_viec = None

    db.execute(
        text("""
            UPDATE nhan_vien
            SET trang_thai = :trang_thai,
                ngay_nghi_viec = :ngay_nghi_viec,
                ngay_cap_nhat = :ngay_cap_nhat
            WHERE ma_nv = :ma_nv
        """),
        {
            "ma_nv": ma_nv,
            "trang_thai": trang_thai,
            "ngay_nghi_viec": ngay_nghi_viec,
            "ngay_cap_nhat": now_vn,
        },
    )

    # Nếu chọn khóa/mở khóa tài khoản kèm theo
    if khoa_tai_khoan:
        if trang_thai in ["DA_NGHI_VIEC", "TAM_HOAN_HD"]:
            db.execute(
                text("""
                    UPDATE tai_khoan
                    SET trang_thai = 'KHOA',
                        ngay_cap_nhat = :now
                    WHERE ma_nv = :ma_nv
                """),
                {"ma_nv": ma_nv, "now": now_vn},
            )
        elif trang_thai == "DANG_LAM":
            db.execute(
                text("""
                    UPDATE tai_khoan
                    SET trang_thai = 'HOAT_DONG',
                        ngay_cap_nhat = :now
                    WHERE ma_nv = :ma_nv AND trang_thai = 'KHOA'
                """),
                {"ma_nv": ma_nv, "now": now_vn},
            )

    db.commit()
    return get_by_ma_nv(db, ma_nv)


def get_monthly_personnel_report(
    db: Session,
    thang: int,
    nam: int,
    ma_pb: Optional[str] = None,
) -> dict:
    """Báo cáo biến động và tình hình nhân sự theo tháng (đang làm, nghỉ phép, nghỉ việc)."""
    where_pb = "AND nv.ma_pb = :ma_pb" if ma_pb else ""
    params = {"thang": thang, "nam": nam}
    if ma_pb:
        params["ma_pb"] = ma_pb

    # Lấy tên phòng ban nếu có lọc
    ten_pb = None
    if ma_pb:
        pb_row = db.execute(text("SELECT ten_pb FROM phong_ban WHERE ma_pb = :ma_pb"), {"ma_pb": ma_pb}).fetchone()
        ten_pb = pb_row[0] if pb_row else ma_pb

    # 1. Toàn bộ danh sách nhân viên thuộc phạm vi
    query = text(f"""
        SELECT 
            nv.ma_nv, nv.ho_ten, nv.ma_pb, pb.ten_pb, nv.ma_cv, cv.ten_cv,
            nv.trang_thai, hd.ngay_bat_dau AS ngay_vao_lam, nv.ngay_nghi_viec
        FROM nhan_vien nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN (
            SELECT hd1.*
            FROM hop_dong_lao_dong hd1
            INNER JOIN (
                SELECT ma_nv, MAX(ngay_bat_dau) AS max_ngay
                FROM hop_dong_lao_dong
                GROUP BY ma_nv
            ) latest ON hd1.ma_nv = latest.ma_nv AND hd1.ngay_bat_dau = latest.max_ngay
        ) hd ON hd.ma_nv = nv.ma_nv
        WHERE 1=1 {where_pb}
        ORDER BY nv.ma_nv ASC
    """)
    rows = db.execute(query, params).mappings().all()

    # 2. Lấy thông tin số ngày nghỉ phép trong tháng từ đơn từ đã duyệt
    leave_query = text(f"""
        SELECT 
            dt.ma_nv,
            COALESCE(SUM(dt.so_ngay), 0) as tong_nghi
        FROM don_tu dt
        JOIN nhan_vien nv ON dt.ma_nv = nv.ma_nv
        WHERE dt.trang_thai = 'DA_DUYET'
          AND (
                (MONTH(dt.ngay_bat_dau) = :thang AND YEAR(dt.ngay_bat_dau) = :nam)
             OR (MONTH(dt.ngay_ket_thuc) = :thang AND YEAR(dt.ngay_ket_thuc) = :nam)
          )
          {where_pb}
        GROUP BY dt.ma_nv
    """)
    leave_rows = db.execute(leave_query, params).mappings().all()
    leave_map = {r["ma_nv"]: float(r["tong_nghi"]) for r in leave_rows}

    danh_sach_dang_lam = []
    danh_sach_nghi_phep = []
    danh_sach_da_nghi_viec = []
    danh_sach_moi_vao = []

    for r in rows:
        m = dict(r)
        emp_id = m["ma_nv"]
        m["so_ngay_nghi_thang"] = leave_map.get(emp_id, 0.0)

        # Mới vào làm trong tháng
        if m.get("ngay_vao_lam") and m["ngay_vao_lam"].month == thang and m["ngay_vao_lam"].year == nam:
            danh_sach_moi_vao.append(m)

        # Đã nghỉ việc trong tháng hoặc hiện đang có trạng thái DA_NGHI_VIEC
        if m.get("trang_thai") == "DA_NGHI_VIEC" or (
            m.get("ngay_nghi_viec") and m["ngay_nghi_viec"].month == thang and m["ngay_nghi_viec"].year == nam
        ):
            danh_sach_da_nghi_viec.append(m)
        elif m.get("trang_thai") in ["NGHI_PHEP", "NGHI_THAI_SAN"] or m["so_ngay_nghi_thang"] > 0:
            danh_sach_nghi_phep.append(m)
        else:
            danh_sach_dang_lam.append(m)

    tong_nhan_su = len(rows)
    so_dang_lam = len(danh_sach_dang_lam)
    so_nghi_phep = len(danh_sach_nghi_phep)
    so_da_nghi_viec = len(danh_sach_da_nghi_viec)
    so_moi_vao_lam = len(danh_sach_moi_vao)

    ty_le_bien_dong = round((so_da_nghi_viec / max(tong_nhan_su, 1)) * 100, 1)

    return {
        "thang": thang,
        "nam": nam,
        "ma_pb": ma_pb,
        "ten_pb": ten_pb,
        "tong_nhan_su": tong_nhan_su,
        "so_dang_lam": so_dang_lam,
        "so_nghi_phep": so_nghi_phep,
        "so_da_nghi_viec": so_da_nghi_viec,
        "so_moi_vao_lam": so_moi_vao_lam,
        "ty_le_bien_dong": ty_le_bien_dong,
        "danh_sach_dang_lam": danh_sach_dang_lam,
        "danh_sach_nghi_phep": danh_sach_nghi_phep,
        "danh_sach_da_nghi_viec": danh_sach_da_nghi_viec,
        "danh_sach_moi_vao_lam": danh_sach_moi_vao,
    }


