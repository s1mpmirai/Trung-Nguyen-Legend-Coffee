"""
Kiểm thử phạm vi phân quyền (không cần CSDL): ai được xem/xử lý nhân sự nào,
tách nhiệm vụ bảng lương, và danh sách quyền khớp giữa backend với frontend.
Chạy: cd backend && python -m pytest tests -q
"""
import re
from pathlib import Path

import pytest

from app.core.config import settings
from app.core.data_scope import DataScope, scope_condition
from app.core.permissions import MANAGE_PORTAL_PERMISSIONS, data_scope, has_permission
from app.core.roles import BUSINESS_ROLES, VALID_ROLES
from app.services import payroll_service
from app.services.permission_service import ADMIN_ONLY_PERMISSIONS

FRONTEND_SRC = Path(__file__).resolve().parents[2] / "frontend" / "src"
needs_frontend = pytest.mark.skipif(not FRONTEND_SRC.exists(), reason="Không có mã nguồn frontend (vd: chạy trong container backend)")


def _account(role, ma_nv="NV50", ma_pb="PB06", permissions=()):
    return {"ma_nv": ma_nv, "ma_vai_tro": role, "ma_pb": ma_pb, "permissions": set(permissions)}


def test_admin_va_vai_tro_phong_ban_xem_toan_cong_ty():
    assert data_scope(_account("ADMIN", ma_pb="PB06")) is None
    assert data_scope(_account("BAN_GIAM_DOC", ma_nv="NV01", ma_pb="PB01")) is None
    assert data_scope(_account("NHAN_SU", ma_nv="NV02", ma_pb="PB02")) is None
    assert data_scope(_account("KE_TOAN", ma_nv="NV03", ma_pb="PB03")) is None


def test_admin_chi_co_quyen_he_thong_khong_co_quyen_nghiep_vu():
    # Admin (quản trị hệ thống) tách biệt với quản lý nhân sự, kể cả khi dữ liệu quyền ghi nhầm
    admin = _account("ADMIN", ma_nv="NV21", permissions={"PAYROLL_MANAGE", "ORG_MANAGE"})
    for code in ("ACCOUNT_MANAGE", "PERMISSION_ASSIGN", "EMPLOYEE_VIEW"):
        assert has_permission(admin, code)
    for code in ("PAYROLL_MANAGE", "LEAVE_APPROVE", "ATTENDANCE_MANAGE", "ORG_MANAGE", "CONTRACT_MANAGE", "EMPLOYEE_DELETE"):
        assert not has_permission(admin, code)


def test_nhan_vien_chi_xem_cap_duoi_truc_tiep():
    scope = data_scope(_account("NHAN_VIEN", ma_nv="NV09", ma_pb="PB06", permissions={"LEAVE_APPROVE"}))
    assert scope == DataScope(ma_nql="NV09")
    assert scope.covers({"ma_pb": "PB06", "ma_nql": "NV09"})
    assert not scope.covers({"ma_pb": "PB06", "ma_nql": "NV06"})


def test_danh_sach_vai_tro_hop_le():
    assert BUSINESS_ROLES | {"ADMIN", "NHAN_VIEN"} == VALID_ROLES


def test_quyen_toan_cong_ty_mo_rong_pham_vi_cho_dung_api():
    account = _account("NHAN_VIEN", ma_nv="NV14", permissions={"ACCOUNT_MANAGE"})
    assert data_scope(account, "ACCOUNT_MANAGE") is None
    assert data_scope(account) == DataScope(ma_nql="NV14")


def test_dieu_kien_sql_theo_pham_vi():
    assert scope_condition(None) == ("", {})
    sql, params = scope_condition(DataScope(ma_nql="NV04", ma_pb="PB04"))
    assert sql == " AND (nv.ma_pb = :scope_ma_pb OR nv.ma_nql = :scope_ma_nql)"
    assert params == {"scope_ma_pb": "PB04", "scope_ma_nql": "NV04"}


@pytest.fixture
def payroll_row(monkeypatch):
    # Bảng lương Kế toán đã gửi sang Ban Giám đốc, đang chờ duyệt
    row = {"trang_thai": "CHO_DUYET", "ma_nv": "NV10", "nguoi_lap": "NV03", "nguoi_duyet": None}
    monkeypatch.setattr(payroll_service.payroll_repository, "get_payroll_status_info", lambda db, ma_bl: dict(row))
    monkeypatch.setattr(
        payroll_service.payroll_repository,
        "update_payroll_status",
        lambda db, ma_bl, trang_thai, nguoi_duyet=None: {"ma_bl": ma_bl, "trang_thai": trang_thai},
    )
    return row


def test_nguoi_lap_khong_tu_duyet_bang_luong(payroll_row):
    with pytest.raises(PermissionError):
        payroll_service.change_payroll_status(None, 1, "DA_DUYET", nguoi_thuc_hien="NV03")
    assert payroll_service.change_payroll_status(None, 1, "DA_DUYET", nguoi_thuc_hien="NV01")["trang_thai"] == "DA_DUYET"


def test_khong_duyet_hay_chi_tra_luong_cua_chinh_minh(payroll_row):
    with pytest.raises(PermissionError):
        payroll_service.change_payroll_status(None, 1, "DA_DUYET", nguoi_thuc_hien="NV10")
    payroll_row["trang_thai"] = "DA_DUYET"
    with pytest.raises(PermissionError):
        payroll_service.change_payroll_status(None, 1, "DA_TRA", nguoi_thuc_hien="NV10")
    # Mở lại về Nháp không bị chặn
    assert payroll_service.change_payroll_status(None, 1, "NHAP", nguoi_thuc_hien="NV10")["trang_thai"] == "NHAP"


def test_tach_quyen_tinh_luong_va_duyet_luong():
    # Kế toán gửi duyệt & chi trả, Ban Giám đốc duyệt / trả về
    assert payroll_service.PAYROLL_STATUS_PERMISSION == {
        ("NHAP", "CHO_DUYET"): "PAYROLL_MANAGE",
        ("CHO_DUYET", "DA_DUYET"): "PAYROLL_APPROVE",
        ("CHO_DUYET", "NHAP"): "PAYROLL_APPROVE",
        ("DA_DUYET", "NHAP"): "PAYROLL_APPROVE",
        ("DA_DUYET", "DA_TRA"): "PAYROLL_MANAGE",
    }


def test_phai_gui_duyet_truoc_khi_duyet(payroll_row):
    payroll_row["trang_thai"] = "NHAP"
    with pytest.raises(ValueError):
        payroll_service.change_payroll_status(None, 1, "DA_DUYET", nguoi_thuc_hien="NV01")
    # Kế toán gửi duyệt được, Ban Giám đốc thì không
    with pytest.raises(PermissionError):
        payroll_service.change_payroll_status(None, 1, "CHO_DUYET", nguoi_thuc_hien="NV01", quyen={"PAYROLL_APPROVE"})
    result = payroll_service.change_payroll_status(None, 1, "CHO_DUYET", nguoi_thuc_hien="NV11", quyen={"PAYROLL_MANAGE"})
    assert result["trang_thai"] == "CHO_DUYET"


def test_ke_toan_khong_duyet_ban_giam_doc_khong_chi_tra(payroll_row):
    with pytest.raises(PermissionError):
        payroll_service.change_payroll_status(None, 1, "DA_DUYET", nguoi_thuc_hien="NV11", quyen={"PAYROLL_MANAGE"})
    assert payroll_service.change_payroll_status(
        None, 1, "DA_DUYET", nguoi_thuc_hien="NV01", quyen={"PAYROLL_APPROVE"}
    )["trang_thai"] == "DA_DUYET"
    payroll_row["trang_thai"] = "DA_DUYET"
    with pytest.raises(PermissionError):
        payroll_service.change_payroll_status(None, 1, "DA_TRA", nguoi_thuc_hien="NV01", quyen={"PAYROLL_APPROVE"})
    assert payroll_service.change_payroll_status(
        None, 1, "DA_TRA", nguoi_thuc_hien="NV11", quyen={"PAYROLL_MANAGE"}
    )["trang_thai"] == "DA_TRA"


def test_nguoi_duoc_cap_rieng_quyen_duyet_chi_duyet_luong_ban_giam_doc(payroll_row):
    payroll_row.update({"ma_nv": "NV05", "ma_pb": "PB02", "nguoi_lap": "NV11"})
    with pytest.raises(PermissionError):
        payroll_service.change_payroll_status(None, 1, "DA_DUYET", nguoi_thuc_hien="NV03", chi_duyet_ban_giam_doc=True)
    # Ban Giám đốc duyệt bình thường
    assert payroll_service.change_payroll_status(None, 1, "DA_DUYET", nguoi_thuc_hien="NV01")["trang_thai"] == "DA_DUYET"
    # Kế toán trưởng duyệt bảng lương của Tổng Giám đốc
    payroll_row.update({"ma_nv": "NV01", "ma_pb": settings.board_department_code})
    result = payroll_service.change_payroll_status(None, 1, "DA_DUYET", nguoi_thuc_hien="NV03", chi_duyet_ban_giam_doc=True)
    assert result["trang_thai"] == "DA_DUYET"


def _js_string_array(path: Path, name: str) -> set[str]:
    source = path.read_text(encoding="utf-8")
    match = re.search(rf"{name}\s*=\s*\[(.*?)\]", source, re.S)
    assert match, f"Không tìm thấy {name} trong {path}"
    return set(re.findall(r'"([A-Z_]+)"', match.group(1)))


@needs_frontend
def test_vai_tro_cong_quan_ly_khop_frontend():
    assert _js_string_array(FRONTEND_SRC / "utils" / "navigation.js", "BUSINESS_ROLES") == set(BUSINESS_ROLES)


@needs_frontend
def test_quyen_vao_cong_dieu_hanh_khop_frontend():
    frontend = _js_string_array(FRONTEND_SRC / "utils" / "navigation.js", "MANAGER_PORTAL_PERMISSIONS")
    assert set(MANAGE_PORTAL_PERMISSIONS) == frontend | {"ACCOUNT_MANAGE"}


@needs_frontend
def test_quyen_chi_admin_cap_khop_frontend():
    for path in (
        FRONTEND_SRC / "pages" / "manager" / "managerUtils.js",
        FRONTEND_SRC / "pages" / "admin" / "tabs" / "AdminPermissionsTab.jsx",
    ):
        assert _js_string_array(path, "ADMIN_ONLY_PERMISSIONS") == ADMIN_ONLY_PERMISSIONS, path
