"""
Quy tắc nghiệp vụ hợp đồng lao động (kiểm tra ở máy chủ, không tin dữ liệu từ giao diện).

- Loại hợp đồng hợp lệ; HĐ không xác định thời hạn không có ngày kết thúc, loại khác bắt buộc có
  và ngày kết thúc phải sau ngày bắt đầu.
- Tỷ lệ hưởng lương: thử việc 85% – 100% (Điều 26 BLLĐ 2019), hợp đồng chính thức 100%.
- Lương cơ bản phải lớn hơn 0.
- Trạng thái: chỉ đổi qua lại giữa Hiệu lực / Hết hạn / Tạm hoãn. Thanh lý phải qua chức năng Thanh lý,
  xóa qua chức năng Xóa; hợp đồng đã thanh lý hoặc đã xóa không sửa được.
"""
from datetime import date

from sqlalchemy.orm import Session

from app.core.datetime_utils import get_vietnam_now
from app.repositories import contract_repository

CONTRACT_TYPES = {
    "THU_VIEC": "Thử việc",
    "XAC_DINH_1_NAM": "Xác định thời hạn 1 năm",
    "XAC_DINH_3_NAM": "Xác định thời hạn 3 năm",
    "KHONG_XAC_DINH": "Không xác định thời hạn",
    "THOI_VU": "Thời vụ",
}
INDEFINITE = "KHONG_XAC_DINH"
PROBATION = "THU_VIEC"
PROBATION_MIN_RATE = 85.0
FULL_RATE = 100.0

EDITABLE_STATUSES = {"HIEU_LUC", "HET_HAN", "TAM_HOAN"}
STATUS_LABELS = {
    "HIEU_LUC": "Hiệu lực",
    "HET_HAN": "Hết hạn",
    "TAM_HOAN": "Tạm hoãn",
    "DA_THANH_LY": "Đã thanh lý",
    "DA_HUY": "Đã xóa",
}

TERM_FIELDS = ("loai_hd", "ngay_ky", "ngay_bat_dau", "ngay_ket_thuc", "luong_co_ban", "ty_le_huong")
EXTRA_FIELDS = ("so_tai_khoan", "ngan_hang", "ma_so_thue", "so_bhxh")


def _as_date(value) -> date | None:
    if value is None or isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


def validate_contract_terms(terms: dict) -> dict:
    """Kiểm tra điều khoản hợp đồng (đã gộp giá trị cũ và mới); trả về điều khoản đã chuẩn hóa."""
    loai_hd = str(terms.get("loai_hd") or "").strip().upper()
    if loai_hd not in CONTRACT_TYPES:
        raise ValueError("Loại hợp đồng không hợp lệ.")

    ngay_ky = _as_date(terms.get("ngay_ky"))
    ngay_bat_dau = _as_date(terms.get("ngay_bat_dau"))
    ngay_ket_thuc = _as_date(terms.get("ngay_ket_thuc"))
    if ngay_ky is None or ngay_bat_dau is None:
        raise ValueError("Vui lòng nhập ngày ký và ngày bắt đầu hiệu lực của hợp đồng.")

    if loai_hd == INDEFINITE:
        ngay_ket_thuc = None
    elif ngay_ket_thuc is None:
        raise ValueError("Vui lòng nhập ngày kết thúc hợp đồng.")
    elif ngay_ket_thuc <= ngay_bat_dau:
        raise ValueError("Ngày kết thúc phải sau ngày bắt đầu hiệu lực.")

    try:
        luong = float(terms.get("luong_co_ban"))
    except (TypeError, ValueError) as error:
        raise ValueError("Lương cơ bản không hợp lệ.") from error
    if luong <= 0:
        raise ValueError("Lương cơ bản phải lớn hơn 0.")

    raw_rate = terms.get("ty_le_huong")
    try:
        rate = FULL_RATE if raw_rate is None else float(raw_rate)
    except (TypeError, ValueError) as error:
        raise ValueError("Tỷ lệ hưởng lương không hợp lệ.") from error
    if loai_hd == PROBATION:
        if not PROBATION_MIN_RATE <= rate <= FULL_RATE:
            raise ValueError("Lương thử việc phải từ 85% đến 100% mức lương của công việc (Điều 26 Bộ luật Lao động).")
    elif rate != FULL_RATE:
        raise ValueError("Hợp đồng chính thức hưởng 100% lương; tỷ lệ dưới 100% chỉ áp dụng cho hợp đồng thử việc.")

    return {
        "loai_hd": loai_hd,
        "ngay_ky": ngay_ky,
        "ngay_bat_dau": ngay_bat_dau,
        "ngay_ket_thuc": ngay_ket_thuc,
        "luong_co_ban": luong,
        "ty_le_huong": rate,
    }


def create_contract(db: Session, data: dict) -> dict:
    """Ký mới hợp đồng: luôn ở trạng thái Hiệu lực (quá hạn thì lượt quét định kỳ chuyển sang Hết hạn)."""
    terms = validate_contract_terms(data)
    payload = {**data, **terms, "trang_thai": "HIEU_LUC"}
    created = contract_repository.create_contract(db, payload)
    contract_repository.expire_overdue_contracts(db)
    return contract_repository.get_contract_by_id(db, created["ma_hd"])


def update_contract(db: Session, ma_hd: str, changes: dict) -> dict | None:
    """Sửa hợp đồng theo quy tắc nghiệp vụ; trả về None nếu không tìm thấy."""
    contract = contract_repository.get_contract_by_id(db, ma_hd)
    if not contract:
        return None

    current_status = contract.get("trang_thai")
    if current_status == "DA_THANH_LY":
        raise ValueError("Hợp đồng đã thanh lý không thể chỉnh sửa. Hãy ký hợp đồng mới nếu cần.")
    if current_status == "DA_HUY":
        raise ValueError("Hợp đồng đã xóa không thể chỉnh sửa. Hãy khôi phục hợp đồng trước.")

    fields: dict = {}
    if any(key in changes for key in TERM_FIELDS):
        # Trường không gửi lên giữ giá trị cũ; gửi null (vd: ngày kết thúc) là chủ động xóa
        merged = {key: changes.get(key, contract.get(key)) for key in TERM_FIELDS}
        fields.update(validate_contract_terms(merged))

    for key in EXTRA_FIELDS:
        if key in changes:
            value = changes[key]
            fields[key] = value.strip() if isinstance(value, str) and value.strip() else None

    if "trang_thai" in changes and changes["trang_thai"] is not None:
        new_status = str(changes["trang_thai"]).strip().upper()
        if new_status not in EDITABLE_STATUSES:
            label = STATUS_LABELS.get(new_status)
            if new_status == "DA_THANH_LY":
                raise ValueError("Muốn thanh lý hợp đồng, hãy dùng chức năng Thanh lý.")
            if new_status == "DA_HUY":
                raise ValueError("Muốn xóa hợp đồng, hãy dùng chức năng Xóa.")
            raise ValueError(f"Trạng thái hợp đồng không hợp lệ{f' ({label})' if label else ''}.")
        end = fields.get("ngay_ket_thuc", _as_date(contract.get("ngay_ket_thuc")))
        if new_status == "HIEU_LUC" and end is not None and end < get_vietnam_now().date():
            raise ValueError("Hợp đồng đã quá ngày kết thúc nên không thể chuyển về Hiệu lực. Hãy gia hạn ngày kết thúc hoặc ký hợp đồng mới.")
        fields["trang_thai"] = new_status

    if not fields:
        return contract
    contract_repository.update_contract(db, ma_hd, fields)
    contract_repository.expire_overdue_contracts(db)
    return contract_repository.get_contract_by_id(db, ma_hd)
