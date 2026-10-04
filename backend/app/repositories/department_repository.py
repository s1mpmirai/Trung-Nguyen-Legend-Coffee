from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.datetime_utils import get_vietnam_now


# ===================== PHÒNG BAN =====================

def generate_department_code(db: Session) -> str:
    query = """
        SELECT ma_pb 
        FROM phong_ban 
        WHERE ma_pb REGEXP '^PB[0-9]+$'
        ORDER BY CAST(SUBSTRING(ma_pb, 3) AS UNSIGNED) DESC 
        LIMIT 1
    """
    latest = db.execute(text(query)).scalar()
    if latest:
        num = int(latest[2:]) + 1
        return f"PB{num:02d}"
    return "PB01"


def get_departments_list(
    db: Session,
    search: str | None = None,
    trang_thai: int | None = None,
) -> list[dict]:
    conditions = ["1=1"]
    params = {}

    if search:
        conditions.append("(pb.ma_pb LIKE :search OR pb.ten_pb LIKE :search OR nv.ho_ten LIKE :search)")
        params["search"] = f"%{search.strip()}%"

    if trang_thai is not None:
        conditions.append("pb.trang_thai = :trang_thai")
        params["trang_thai"] = trang_thai

    where_sql = " AND ".join(conditions)

    query = f"""
        SELECT 
            pb.ma_pb,
            pb.ten_pb,
            pb.ma_truong_pb,
            nv.ho_ten AS ten_truong_pb,
            pb.sdt,
            pb.mo_ta,
            pb.trang_thai,
            pb.ngay_tao,
            pb.ngay_cap_nhat,
            (SELECT COUNT(*) FROM nhan_vien e WHERE e.ma_pb = pb.ma_pb AND e.trang_thai = 'DANG_LAM') AS so_luong_nv
        FROM phong_ban pb
        LEFT JOIN nhan_vien nv ON pb.ma_truong_pb = nv.ma_nv
        WHERE {where_sql}
        ORDER BY pb.ma_pb ASC
    """
    rows = db.execute(text(query), params).mappings().all()
    return [dict(r) for r in rows]


def get_department_by_id(db: Session, ma_pb: str) -> dict | None:
    query = """
        SELECT 
            pb.ma_pb,
            pb.ten_pb,
            pb.ma_truong_pb,
            nv.ho_ten AS ten_truong_pb,
            pb.sdt,
            pb.mo_ta,
            pb.trang_thai,
            pb.ngay_tao,
            pb.ngay_cap_nhat,
            (SELECT COUNT(*) FROM nhan_vien e WHERE e.ma_pb = pb.ma_pb AND e.trang_thai = 'DANG_LAM') AS so_luong_nv
        FROM phong_ban pb
        LEFT JOIN nhan_vien nv ON pb.ma_truong_pb = nv.ma_nv
        WHERE pb.ma_pb = :ma_pb
        LIMIT 1
    """
    row = db.execute(text(query), {"ma_pb": ma_pb}).mappings().first()
    if not row:
        return None

    dept = dict(row)

    # Lấy danh sách nhân viên trực thuộc
    emp_query = """
        SELECT e.ma_nv, e.ho_ten, cv.ten_cv, e.sdt, e.email, e.trang_thai
        FROM nhan_vien e
        LEFT JOIN chuc_vu cv ON e.ma_cv = cv.ma_cv
        WHERE e.ma_pb = :ma_pb
        ORDER BY (e.ma_nv = :ma_truong_pb) DESC, e.ma_nv ASC
    """
    emp_rows = db.execute(text(emp_query), {"ma_pb": ma_pb, "ma_truong_pb": dept.get("ma_truong_pb") or ""}).mappings().all()
    dept["danh_sach_nhan_vien"] = [dict(er) for er in emp_rows]

    return dept


def create_department(db: Session, data: dict) -> dict:
    if not data.get("ma_pb"):
        data["ma_pb"] = generate_department_code(db)

    now_vn = get_vietnam_now()
    data["ngay_tao"] = now_vn
    data["ngay_cap_nhat"] = now_vn

    query = """
        INSERT INTO phong_ban (ma_pb, ten_pb, ma_truong_pb, sdt, mo_ta, trang_thai, ngay_tao, ngay_cap_nhat)
        VALUES (:ma_pb, :ten_pb, :ma_truong_pb, :sdt, :mo_ta, :trang_thai, :ngay_tao, :ngay_cap_nhat)
    """
    db.execute(text(query), data)
    db.commit()
    return get_department_by_id(db, data["ma_pb"])


def update_department(db: Session, ma_pb: str, data: dict) -> dict | None:
    dept = get_department_by_id(db, ma_pb)
    if not dept:
        return None

    clean_data = {k: v for k, v in data.items() if v is not None}
    if not clean_data:
        return dept

    clean_data["ngay_cap_nhat"] = get_vietnam_now()
    set_clauses = [f"{k} = :{k}" for k in clean_data.keys()]

    query = f"""
        UPDATE phong_ban
        SET {', '.join(set_clauses)}
        WHERE ma_pb = :ma_pb
    """
    db.execute(text(query), {**clean_data, "ma_pb": ma_pb})
    db.commit()
    return get_department_by_id(db, ma_pb)


def delete_department(db: Session, ma_pb: str) -> bool:
    count_nv = db.execute(
        text("SELECT COUNT(*) FROM nhan_vien WHERE ma_pb = :ma_pb AND trang_thai = 'DANG_LAM'"),
        {"ma_pb": ma_pb}
    ).scalar() or 0
    if count_nv > 0:
        raise ValueError(f"Không thể xóa phòng ban vì đang có {count_nv} nhân viên đang làm việc. Vui lòng chuyển nhân sự sang phòng ban khác trước!")

    db.execute(text("DELETE FROM phong_ban WHERE ma_pb = :ma_pb"), {"ma_pb": ma_pb})
    db.commit()
    return True


# ===================== CHỨC VỤ & BẬC LƯƠNG =====================

def generate_position_code(db: Session) -> str:
    query = """
        SELECT ma_cv 
        FROM chuc_vu 
        WHERE ma_cv REGEXP '^CV[0-9]+$'
        ORDER BY CAST(SUBSTRING(ma_cv, 3) AS UNSIGNED) DESC 
        LIMIT 1
    """
    latest = db.execute(text(query)).scalar()
    if latest:
        num = int(latest[2:]) + 1
        return f"CV{num:02d}"
    return "CV01"


def get_positions_list(db: Session, search: str | None = None) -> list[dict]:
    conditions = ["1=1"]
    params = {}
    if search:
        conditions.append("(cv.ma_cv LIKE :search OR cv.ten_cv LIKE :search)")
        params["search"] = f"%{search.strip()}%"

    where_sql = " AND ".join(conditions)

    query = f"""
        SELECT 
            cv.ma_cv,
            cv.ten_cv,
            cv.cap_bac,
            cv.phu_cap_chuc_vu,
            cv.mo_ta,
            cv.ngay_tao,
            cv.ngay_cap_nhat,
            (SELECT COUNT(*) FROM nhan_vien e WHERE e.ma_cv = cv.ma_cv AND e.trang_thai = 'DANG_LAM') AS so_luong_nv
        FROM chuc_vu cv
        WHERE {where_sql}
        ORDER BY cv.cap_bac DESC, cv.ma_cv ASC
    """
    rows = db.execute(text(query), params).mappings().all()
    results = []
    for r in rows:
        item = dict(r)
        scales = db.execute(
            text("SELECT ma_bac, ma_cv, bac, he_so, muc_luong, mo_ta FROM bac_luong WHERE ma_cv = :ma_cv ORDER BY bac ASC"),
            {"ma_cv": item["ma_cv"]}
        ).mappings().all()
        item["thang_bac_luong"] = [dict(s) for s in scales]
        results.append(item)
    return results


def get_position_by_id(db: Session, ma_cv: str) -> dict | None:
    query = """
        SELECT 
            cv.ma_cv,
            cv.ten_cv,
            cv.cap_bac,
            cv.phu_cap_chuc_vu,
            cv.mo_ta,
            cv.ngay_tao,
            cv.ngay_cap_nhat,
            (SELECT COUNT(*) FROM nhan_vien e WHERE e.ma_cv = cv.ma_cv AND e.trang_thai = 'DANG_LAM') AS so_luong_nv
        FROM chuc_vu cv
        WHERE cv.ma_cv = :ma_cv
        LIMIT 1
    """
    row = db.execute(text(query), {"ma_cv": ma_cv}).mappings().first()
    if not row:
        return None
    item = dict(row)
    scales = db.execute(
        text("SELECT ma_bac, ma_cv, bac, he_so, muc_luong, mo_ta FROM bac_luong WHERE ma_cv = :ma_cv ORDER BY bac ASC"),
        {"ma_cv": ma_cv}
    ).mappings().all()
    item["thang_bac_luong"] = [dict(s) for s in scales]
    return item


def create_position(db: Session, data: dict) -> dict:
    if not data.get("ma_cv"):
        data["ma_cv"] = generate_position_code(db)

    now_vn = get_vietnam_now()
    data["ngay_tao"] = now_vn
    data["ngay_cap_nhat"] = now_vn

    query = """
        INSERT INTO chuc_vu (ma_cv, ten_cv, cap_bac, phu_cap_chuc_vu, mo_ta, ngay_tao, ngay_cap_nhat)
        VALUES (:ma_cv, :ten_cv, :cap_bac, :phu_cap_chuc_vu, :mo_ta, :ngay_tao, :ngay_cap_nhat)
    """
    db.execute(text(query), data)
    db.commit()
    return get_position_by_id(db, data["ma_cv"])


def update_position(db: Session, ma_cv: str, data: dict) -> dict | None:
    pos = get_position_by_id(db, ma_cv)
    if not pos:
        return None

    clean_data = {k: v for k, v in data.items() if v is not None}
    if not clean_data:
        return pos

    clean_data["ngay_cap_nhat"] = get_vietnam_now()
    set_clauses = [f"{k} = :{k}" for k in clean_data.keys()]

    query = f"""
        UPDATE chuc_vu
        SET {', '.join(set_clauses)}
        WHERE ma_cv = :ma_cv
    """
    db.execute(text(query), {**clean_data, "ma_cv": ma_cv})
    db.commit()
    return get_position_by_id(db, ma_cv)


def delete_position(db: Session, ma_cv: str) -> bool:
    count_nv = db.execute(
        text("SELECT COUNT(*) FROM nhan_vien WHERE ma_cv = :ma_cv AND trang_thai = 'DANG_LAM'"),
        {"ma_cv": ma_cv}
    ).scalar() or 0
    if count_nv > 0:
        raise ValueError(f"Không thể xóa chức vụ vì đang có {count_nv} nhân sự đảm nhiệm chức vụ này!")

    db.execute(text("DELETE FROM chuc_vu WHERE ma_cv = :ma_cv"), {"ma_cv": ma_cv})
    db.commit()
    return True


def get_salary_scales(db: Session, ma_cv: str) -> list[dict]:
    query = """
        SELECT ma_bac, ma_cv, bac, he_so, muc_luong, mo_ta, ngay_tao, ngay_cap_nhat
        FROM bac_luong
        WHERE ma_cv = :ma_cv
        ORDER BY bac ASC
    """
    rows = db.execute(text(query), {"ma_cv": ma_cv}).mappings().all()
    return [dict(r) for r in rows]


def create_salary_scale(db: Session, data: dict) -> dict:
    now_vn = get_vietnam_now()
    data["ngay_tao"] = now_vn
    data["ngay_cap_nhat"] = now_vn
    query = """
        INSERT INTO bac_luong (ma_cv, bac, he_so, muc_luong, mo_ta, ngay_tao, ngay_cap_nhat)
        VALUES (:ma_cv, :bac, :he_so, :muc_luong, :mo_ta, :ngay_tao, :ngay_cap_nhat)
    """
    db.execute(text(query), data)
    db.commit()
    row = db.execute(
        text("SELECT * FROM bac_luong WHERE ma_cv = :ma_cv AND bac = :bac"),
        {"ma_cv": data["ma_cv"], "bac": data["bac"]}
    ).mappings().first()
    return dict(row)
