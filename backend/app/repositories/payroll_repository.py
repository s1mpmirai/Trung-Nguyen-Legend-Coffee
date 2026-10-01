from sqlalchemy import text
from sqlalchemy.orm import Session


def get_payroll_by_month(db: Session, ma_nv: str, thang: int, nam: int) -> dict | None:
    """Lấy bảng lương 1 tháng cụ thể của nhân viên."""
    query = """
        SELECT
            bl.ma_bl, bl.thang, bl.nam, bl.ma_nv,
            bl.luong_co_ban, bl.he_so_luong,
            bl.so_cong_chuan, bl.so_cong_thuc_te, bl.so_gio_tang_ca,
            bl.luong_theo_cong, bl.tien_tang_ca,
            bl.tong_phu_cap, bl.tien_thuong,
            bl.luong_gross,
            bl.bhxh, bl.bhyt, bl.bhtn,
            bl.thue_tncn, bl.khau_tru_khac, bl.tong_khau_tru,
            bl.luong_net,
            bl.trang_thai, bl.ghi_chu,
            bl.ngay_tao, bl.ngay_cap_nhat,
            nv.ho_ten
        FROM bang_luong bl
        JOIN nhan_vien nv ON bl.ma_nv = nv.ma_nv
        WHERE bl.ma_nv = :ma_nv
          AND bl.thang = :thang
          AND bl.nam   = :nam
        LIMIT 1
    """
    row = db.execute(
        text(query), {"ma_nv": ma_nv, "thang": thang, "nam": nam}
    ).mappings().first()
    return dict(row) if row else None


def get_payroll_months(db: Session, ma_nv: str) -> list[dict]:
    """Lấy danh sách các tháng/năm đã có bảng lương của nhân viên."""
    query = """
        SELECT thang, nam, trang_thai, luong_net
        FROM bang_luong
        WHERE ma_nv = :ma_nv
        ORDER BY nam DESC, thang DESC
    """
    rows = db.execute(text(query), {"ma_nv": ma_nv}).mappings().all()
    return [dict(r) for r in rows]


def get_payroll_year_summary(db: Session, ma_nv: str, nam: int) -> dict | None:
    """Tổng hợp lương cả năm của nhân viên."""
    query = """
        SELECT
            COUNT(*)            AS so_thang,
            SUM(luong_gross)    AS tong_gross,
            SUM(tong_khau_tru)  AS tong_khau_tru,
            SUM(luong_net)      AS tong_net,
            SUM(tien_thuong)    AS tong_thuong,
            SUM(tong_phu_cap)   AS tong_phu_cap,
            SUM(bhxh)           AS tong_bhxh,
            SUM(bhyt)           AS tong_bhyt,
            SUM(bhtn)           AS tong_bhtn,
            SUM(thue_tncn)      AS tong_thue_tncn
        FROM bang_luong
        WHERE ma_nv = :ma_nv AND nam = :nam
    """
    row = db.execute(text(query), {"ma_nv": ma_nv, "nam": nam}).mappings().first()
    if not row or row["so_thang"] == 0:
        return None
    return dict(row)
