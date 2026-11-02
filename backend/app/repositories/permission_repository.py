from typing import Any, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.datetime_utils import get_vietnam_now
from app.core.roles import ADMIN_ROLE, ADMIN_SYSTEM_PERMISSIONS, ROLE_DISPLAY_ORDER, STAFF_ROLE


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
    """)
    rank = {code: idx for idx, code in enumerate(ROLE_DISPLAY_ORDER)}
    roles = sorted(
        (dict(r) for r in db.execute(roles_query).mappings().all()),
        key=lambda r: (rank.get(r["ma_vai_tro"], len(rank)), r["ma_vai_tro"]),
    )

    mapping_query = text("""
        SELECT ma_vai_tro, ma_quyen
        FROM vai_tro_quyen
    """)
    mappings = db.execute(mapping_query).mappings().all()

    role_perms_map: dict[str, list[str]] = {}
    for m in mappings:
        r_id = m["ma_vai_tro"]
        role_perms_map.setdefault(r_id, []).append(m["ma_quyen"])

    # Vai trò ADMIN cố định bộ quyền hệ thống (không phụ thuộc dữ liệu vai_tro_quyen)
    role_perms_map[ADMIN_ROLE] = sorted(ADMIN_SYSTEM_PERMISSIONS)

    for role in roles:
        role["permissions"] = role_perms_map.get(role["ma_vai_tro"], [])
        role["he_thong"] = bool(role.get("he_thong"))

    return roles


def get_role_matrix(db: Session) -> dict[str, Any]:
    """
    Trả về ma trận phân quyền hệ thống và so sánh quyền hạn:
    Nhân viên (NHAN_VIEN) có quyền gì, và mỗi vai trò phòng ban được bổ sung thêm quyền nào.
    """
    permissions = get_all_permissions(db)
    roles = get_all_roles_with_permissions(db)

    matrix: dict[str, list[str]] = {r["ma_vai_tro"]: r["permissions"] for r in roles}
    staff_perms = set(matrix.get(STAFF_ROLE, []))

    comparison: dict[str, Any] = {
        "vai_tro_nhan_vien": {
            "ma_vai_tro": STAFF_ROLE,
            "ten_vai_tro": "Nhân viên",
            "so_quyen": len(staff_perms),
            "quyen_co_ban": sorted(staff_perms),
            "mo_ta": "Chỉ có các quyền cá nhân: Xem đơn, Nộp đơn từ cá nhân, Xem phiếu lương cá nhân.",
        },
    }
    for role in roles:
        code = role["ma_vai_tro"]
        if code == STAFF_ROLE:
            continue
        role_perms = set(matrix.get(code, []))
        comparison[f"vai_tro_{code.lower()}"] = {
            "ma_vai_tro": code,
            "ten_vai_tro": role.get("ten_vai_tro"),
            "so_quyen": len(role_perms),
            "quyen_hien_tai": sorted(role_perms),
            "quyen_bo_sung_so_voi_nhan_vien": sorted(role_perms - staff_perms),
            "mo_ta": role.get("mo_ta"),
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
    # Quản trị hệ thống luôn đúng bộ quyền hệ thống cố định, không mang quyền nghiệp vụ
    if ma_vai_tro == ADMIN_ROLE:
        role_perms = sorted(ADMIN_SYSTEM_PERMISSIONS)
        effective_set = set(ADMIN_SYSTEM_PERMISSIONS)

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

    if not tk_row:
        raise ValueError("Nhân sự chưa có tài khoản đăng nhập. Vui lòng đề nghị Admin cấp tài khoản trước khi phân quyền.")

    db.execute(
        text("""
            UPDATE tai_khoan
            SET ma_vai_tro = :ma_vai_tro,
                ngay_cap_nhat = :now
            WHERE ma_nv = :ma_nv
        """),
        {"ma_vai_tro": ma_vai_tro, "now": now_vn, "ma_nv": ma_nv},
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
        raise ValueError("Nhân sự chưa có tài khoản đăng nhập. Vui lòng đề nghị Admin cấp tài khoản trước khi phân quyền.")

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


def set_role_permissions(db: Session, ma_vai_tro: str, ma_quyen_list: list[str]) -> None:
    """Thay toàn bộ quyền mặc định của một vai trò (ma trận vai trò x quyền). Người gọi commit."""
    db.execute(text("DELETE FROM vai_tro_quyen WHERE ma_vai_tro = :ma_vai_tro"), {"ma_vai_tro": ma_vai_tro})
    now_vn = get_vietnam_now()
    for ma_quyen in ma_quyen_list:
        db.execute(
            text("""
                INSERT INTO vai_tro_quyen (ma_vai_tro, ma_quyen, ngay_tao, ngay_cap_nhat)
                VALUES (:ma_vai_tro, :ma_quyen, :now, :now)
            """),
            {"ma_vai_tro": ma_vai_tro, "ma_quyen": ma_quyen, "now": now_vn},
        )
