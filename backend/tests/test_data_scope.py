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
from app.core.permissions import MANAGE_PORTAL_PERMISSIONS, data_scope
from app.services import payroll_service
from app.services.permission_service import ADMIN_ONLY_PERMISSIONS

FRONTEND_SRC = Path(__file__).resolve().parents[2] / "frontend" / "src"
HR = settings.hr_department_code
needs_frontend = pytest.mark.skipif(not FRONTEND_SRC.exists(), reason="Không có mã nguồn frontend (vd: chạy trong container backend)")


def _account(role, ma_nv="NV50", ma_pb="PB06", permissions=()):
    return {"ma_nv": ma_nv, "ma_vai_tro": role, "ma_pb": ma_pb, "permissions": set(permissions)}


def test_admin_va_quan_ly_phong_nhan_su_xem_toan_cong_ty():
    assert data_scope(_account("ADMIN", ma_pb="PB01")) is None
    assert data_scope(_account("QUAN_LY", ma_pb=HR)) is None


def test_quan_ly_phong_khac_chi_xem_phong_minh_va_cap_duoi():
    scope = data_scope(_account("QUAN_LY", ma_nv="NV04", ma_pb="PB04"))
    assert scope == DataScope(ma_nql="NV04", ma_pb="PB04")
    assert scope.covers({"ma_pb": "PB04", "ma_nql": "NV12"})
    assert scope.covers({"ma_pb": "PB08", "ma_nql": "NV04"})
    assert not scope.covers({"ma_pb": "PB06", "ma_nql": "NV06"})


def test_truong_nhom_chi_xem_cap_duoi_truc_tiep():
    scope = data_scope(_account("TRUONG_NHOM", ma_nv="NV09", ma_pb="PB06"))
    assert scope == DataScope(ma_nql="NV09")
    assert scope.covers({"ma_pb": "PB06", "ma_nql": "NV09"})
    assert not scope.covers({"ma_pb": "PB06", "ma_nql": "NV06"})


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
    row = {"trang_thai": "NHAP", "ma_nv": "NV10", "nguoi_lap": "NV03", "nguoi_duyet": None}
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


def _js_string_array(path: Path, name: str) -> set[str]:
    source = path.read_text(encoding="utf-8")
    match = re.search(rf"{name}\s*=\s*\[(.*?)\]", source, re.S)
    assert match, f"Không tìm thấy {name} trong {path}"
    return set(re.findall(r'"([A-Z_]+)"', match.group(1)))


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
