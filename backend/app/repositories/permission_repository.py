from typing import Any, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.datetime_utils import get_vietnam_now


def get_all_permissions(db: Session) -> list[dict[str, Any]]:
    """Lấy danh sách tất cả các quyền chức năng trong hệ thống."""
    query = text("""
        SELECT ma_quyen, ten_quyen, nhom_quyen, mo_ta
        FROM quyen
        ORDER BY nhom_quyen ASC, ma_quyen ASC
    """)
    rows = db.execute(query).mappings().all()
    return [dict(r) for r in rows]


def get_all_roles_with_permissions(db: Session) -> list[dict[str, Any]]:
    """Lấy danh sách các vai trò kèm danh sách mã quyền mặc định của từng vai trò."""
    roles_query = text("""
        SELECT ma_vai_tro, ten_vai_tro, mo_ta, he_thong
        FROM vai_tro
        ORDER BY 
            CASE ma_vai_tro 
                WHEN 'ADMIN' THEN 1 
                WHEN 'QUAN_LY' THEN 2 
                WHEN 'TRUONG_NHOM' THEN 3 
                WHEN 'NHAN_VIEN' THEN 4 
                ELSE 5 
            END ASC
    """)
    roles = [dict(r) for r in db.execute(roles_query).mappings().all()]

    mapping_query = text("""
        SELECT ma_vai_tro, ma_quyen
        FROM vai_tro_quyen
    """)
    mappings = db.execute(mapping_query).mappings().all()

    role_perms_map: dict[str, list[str]] = {}
    for m in mappings:
        r_id = m["ma_vai_tro"]
        role_perms_map.setdefault(r_id, []).append(m["ma_quyen"])

    for role in roles:
        role["permissions"] = role_perms_map.get(role["ma_vai_tro"], [])
        role["he_thong"] = bool(role.get("he_thong"))

    return roles


def get_role_matrix(db: Session) -> dict[str, Any]:
    """
    Trả về ma trận phân quyền hệ thống và so sánh quyền hạn:
    Nhân viên (NHAN_VIEN) có quyền gì, và khi lên Trưởng nhóm (TRUONG_NHOM) quyền thay đổi ra sao.
    """
    permissions = get_all_permissions(db)
    roles = get_all_roles_with_permissions(db)

    matrix: dict[str, list[str]] = {r["ma_vai_tro"]: r["permissions"] for r in roles}

    staff_perms = set(matrix.get("NHAN_VIEN", []))
    leader_perms = set(matrix.get("TRUONG_NHOM", []))
    manager_perms = set(matrix.get("QUAN_LY", []))

    added_for_leader = list(leader_perms - staff_perms)
    added_for_manager = list(manager_perms - leader_perms)

    comparison = {
        "vai_tro_nhan_vien": {
            "ma_vai_tro": "NHAN_VIEN",
            "ten_vai_tro": "Nhân viên",
            "so_quyen": len(staff_perms),
            "quyen_co_ban": list(staff_perms),
            "mo_ta": "Chỉ có các quyền cá nhân: Xem đơn, Nộp đơn từ cá nhân, Xem phiếu lương cá nhân.",
        },
        "vai_tro_truong_nhom": {
            "ma_vai_tro": "TRUONG_NHOM",
            "ten_vai_tro": "Trưởng nhóm / Tổ trưởng",
            "so_quyen": len(leader_perms),
            "quyen_hien_tai": list(leader_perms),
            "quyen_duoc_bo_sung_khi_len_chuc": added_for_leader,
            "mo_ta": "Khi nhân viên lên Trưởng nhóm, được bổ sung thêm các quyền quản lý đội nhóm: Xem nhân sự (EMPLOYEE_VIEW), Duyệt đơn nghỉ nhóm (LEAVE_APPROVE), Quản lý chấm công nhóm (ATTENDANCE_MANAGE).",
        },
        "vai_tro_quan_ly": {
            "ma_vai_tro": "QUAN_LY",
            "ten_vai_tro": "Quản lý / Trưởng phòng",
            "so_quyen": len(manager_perms),
            "quyen_hien_tai": list(manager_perms),
            "quyen_duoc_bo_sung_khi_len_quan_ly": added_for_manager,
            "mo_ta": "Cấp quản trị phòng ban/chi nhánh: Thêm/sửa nhân sự, tính và duyệt lương, quản lý kho/nhà cung cấp.",
        },
    }

    return {
        "roles": roles,
        "permissions": permissions,
        "matrix": matrix,
        "comparison_staff_vs_leader": comparison,
    }


def get_employee_permissions(db: Session, ma_nv: str) -> Optional[dict[str, Any]]:
    """Lấy chi tiết quyền hạn thực tế của một nhân viên."""
    emp_query = text("""
        SELECT 
            nv.ma_nv, nv.ho_ten, nv.ma_pb, pb.ten_pb, nv.ma_cv, cv.ten_cv,
            tk.ma_tk, tk.ma_vai_tro, vt.ten_vai_tro
        FROM nhan_vien nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN tai_khoan tk ON nv.ma_nv = tk.ma_nv
        LEFT JOIN vai_tro vt ON tk.ma_vai_tro = vt.ma_vai_tro
        WHERE nv.ma_nv = :ma_nv
        LIMIT 1
    """)
    row = db.execute(emp_query, {"ma_nv": ma_nv}).mappings().first()
    if not row:
        return None

    emp_dict = dict(row)
    ma_vai_tro = emp_dict.get("ma_vai_tro") or "NHAN_VIEN"
    ten_vai_tro = emp_dict.get("ten_vai_tro") or "Nhân viên (Mặc định)"
    ma_tk = emp_dict.get("ma_tk")

    # 1. Quyền theo vai trò
    role_perms_query = text("""
        SELECT ma_quyen FROM vai_tro_quyen WHERE ma_vai_tro = :ma_vai_tro
    """)
    role_perms = [r[0] for r in db.execute(role_perms_query, {"ma_vai_tro": ma_vai_tro}).fetchall()]

    # 2. Quyền tùy chỉnh riêng cho tài khoản (nếu có tài khoản)
    custom_granted = []
    custom_revoked = []
    if ma_tk:
        custom_query = text("""
            SELECT ma_quyen, duoc_cap FROM tai_khoan_quyen WHERE ma_tk = :ma_tk
        """)
        for c in db.execute(custom_query, {"ma_tk": ma_tk}).mappings().all():
            if c["duoc_cap"] == 1:
                custom_granted.append(c["ma_quyen"])
            else:
                custom_revoked.append(c["ma_quyen"])

    # Quyền thực tế có hiệu lực = (Quyền vai trò + Quyền cấp riêng) - Quyền bị thu hồi
    effective_set = (set(role_perms) | set(custom_granted)) - set(custom_revoked)

    return {
        "ma_nv": emp_dict["ma_nv"],
        "ho_ten": emp_dict["ho_ten"],
        "ma_pb": emp_dict["ma_pb"],
        "ten_pb": emp_dict["ten_pb"],
        "ma_cv": emp_dict["ma_cv"],
        "ten_cv": emp_dict["ten_cv"],
        "has_account": bool(ma_tk),
        "ma_vai_tro": ma_vai_tro,
        "ten_vai_tro": ten_vai_tro,
        "vai_tro_quyen": sorted(role_perms),
        "custom_quyen_cap": sorted(custom_granted),
        "custom_quyen_thu_hoi": sorted(custom_revoked),
        "effective_permissions": sorted(list(effective_set)),
    }


def assign_role_to_employee(
    db: Session, ma_nv: str, ma_vai_tro: str, ghi_chu: Optional[str] = None
) -> dict[str, Any]:
    """Gán vai trò mới cho nhân sự (thăng chức / chuyển vai trò)."""
    now_vn = get_vietnam_now()

    # Kiểm tra vai trò hợp lệ
    role_check = db.execute(
        text("SELECT ma_vai_tro FROM vai_tro WHERE ma_vai_tro = :ma_vai_tro"),
        {"ma_vai_tro": ma_vai_tro},
    ).fetchone()
    if not role_check:
        raise ValueError(f"Mã vai trò '{ma_vai_tro}' không tồn tại trong hệ thống")

    # Kiểm tra xem nhân sự đã có tài khoản chưa
    tk_row = db.execute(
        text("SELECT ma_tk FROM tai_khoan WHERE ma_nv = :ma_nv"),
        {"ma_nv": ma_nv},
    ).mappings().first()

    if tk_row:
        db.execute(
            text("""
                UPDATE tai_khoan
                SET ma_vai_tro = :ma_vai_tro,
                    ngay_cap_nhat = :now
                WHERE ma_nv = :ma_nv
            """),
            {"ma_vai_tro": ma_vai_tro, "now": now_vn, "ma_nv": ma_nv},
        )
    else:
        # Nếu chưa có tài khoản, tự động tạo tài khoản với mật khẩu mặc định (123456)
        import hashlib
        default_pwd = hashlib.sha256("123456".encode("utf-8")).hexdigest()
        db.execute(
            text("""
                INSERT INTO tai_khoan (ma_nv, mat_khau, ma_vai_tro, trang_thai, ngay_tao)
                VALUES (:ma_nv, :mat_khau, :ma_vai_tro, 'HOAT_DONG', :now)
            """),
            {"ma_nv": ma_nv, "mat_khau": default_pwd, "ma_vai_tro": ma_vai_tro, "now": now_vn},
        )

    db.commit()
    return get_employee_permissions(db, ma_nv)


def update_employee_custom_permissions(
    db: Session, ma_nv: str, permissions: list[dict[str, Any]]
) -> dict[str, Any]:
    """Cấp hoặc thu hồi quyền riêng cho tài khoản nhân sự."""
    tk_row = db.execute(
        text("SELECT ma_tk FROM tai_khoan WHERE ma_nv = :ma_nv"),
        {"ma_nv": ma_nv},
    ).mappings().first()

    if not tk_row:
        # Nếu chưa có tài khoản, gán vai trò mặc định NHAN_VIEN rồi cấp quyền riêng
        assign_role_to_employee(db, ma_nv, "NHAN_VIEN")
        tk_row = db.execute(
            text("SELECT ma_tk FROM tai_khoan WHERE ma_nv = :ma_nv"),
            {"ma_nv": ma_nv},
        ).mappings().first()

    ma_tk = tk_row["ma_tk"]
    now_vn = get_vietnam_now()

    upsert_sql = text("""
        INSERT INTO tai_khoan_quyen (ma_tk, ma_quyen, duoc_cap, ngay_tao, ngay_cap_nhat)
        VALUES (:ma_tk, :ma_quyen, :duoc_cap, :now, :now)
        ON DUPLICATE KEY UPDATE
            duoc_cap = VALUES(duoc_cap),
            ngay_cap_nhat = :now
    """)

    for p in permissions:
        db.execute(
            upsert_sql,
            {
                "ma_tk": ma_tk,
                "ma_quyen": p["ma_quyen"],
                "duoc_cap": 1 if p["duoc_cap"] else 0,
                "now": now_vn,
            },
        )

    db.commit()
    return get_employee_permissions(db, ma_nv)
