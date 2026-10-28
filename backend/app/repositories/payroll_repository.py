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
            bl.giam_tru_gia_canh, bl.thu_nhap_tinh_thue,
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


def get_all_company_payroll(db: Session, thang: int, nam: int) -> list[dict]:
    """Lấy danh sách bảng lương tháng của toàn bộ nhân viên cho quản lý."""
    query = """
        SELECT
            bl.ma_bl, bl.thang, bl.nam, bl.ma_nv,
            nv.ho_ten, pb.ten_pb, cv.ten_cv,
            bl.luong_co_ban, bl.he_so_luong, bl.so_cong_chuan,
            bl.so_cong_thuc_te,
            bl.luong_theo_cong, bl.so_gio_tang_ca, bl.tien_tang_ca, bl.tong_phu_cap, bl.tien_thuong,
            bl.luong_gross, bl.bhxh, bl.bhyt, bl.bhtn, bl.thue_tncn, bl.tong_khau_tru,
            bl.luong_net, bl.trang_thai, bl.ghi_chu,
            (
                SELECT CONCAT_WS(' • ', h.ngan_hang, h.so_tai_khoan)
                FROM hop_dong_lao_dong h
                WHERE h.ma_nv = bl.ma_nv AND h.trang_thai <> 'DA_HUY'
                ORDER BY h.ngay_bat_dau DESC
                LIMIT 1
            ) AS tai_khoan_nhan_luong
        FROM bang_luong bl
        JOIN nhan_vien nv ON bl.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        WHERE bl.thang = :thang AND bl.nam = :nam
        ORDER BY nv.ma_nv ASC
    """
    rows = db.execute(text(query), {"thang": thang, "nam": nam}).mappings().all()
    return [dict(r) for r in rows]


def get_payroll_status(db: Session, ma_bl: int) -> str | None:
    return db.execute(
        text("SELECT trang_thai FROM bang_luong WHERE ma_bl = :ma_bl"), {"ma_bl": ma_bl}
    ).scalar()


def update_payroll_status(db: Session, ma_bl: int, trang_thai: str) -> dict | None:
    """Cập nhật trạng thái duyệt/chi trả bảng lương."""
    query = """
        UPDATE bang_luong
        SET trang_thai = :trang_thai, ngay_cap_nhat = NOW()
        WHERE ma_bl = :ma_bl
    """
    result = db.execute(text(query), {"ma_bl": ma_bl, "trang_thai": trang_thai})
    db.commit()
    if result.rowcount == 0:
        return None
    return {"ma_bl": ma_bl, "trang_thai": trang_thai}


def get_payroll_inputs(db: Session, start, end) -> list[dict]:
    """
    Lấy dữ liệu đầu vào tính lương của tháng [start, end]:
    nhân sự còn làm trong tháng (kể cả nghỉ việc giữa tháng), hợp đồng hiện hành,
    bậc lương, phụ cấp chức vụ, số người phụ thuộc và tổng hợp chấm công trong tháng.
    """
    query = """
        SELECT
            nv.ma_nv, nv.so_nguoi_pt,
            hd.luong_co_ban AS luong_hop_dong, hd.ty_le_huong, hd.loai_hd,
            bl.muc_luong AS luong_bac, bl.he_so AS he_so_luong,
            COALESCE(cv.phu_cap_chuc_vu, 0) AS phu_cap_chuc_vu,
            COALESCE(cc.so_cong, 0) AS so_cong_thuc_te,
            COALESCE(cc.so_gio_tang_ca, 0) AS so_gio_tang_ca
        FROM nhan_vien nv
        LEFT JOIN (
            SELECT hd1.*
            FROM hop_dong_lao_dong hd1
            INNER JOIN (
                SELECT ma_nv, MAX(ngay_bat_dau) AS max_ngay
                FROM hop_dong_lao_dong
                WHERE ngay_bat_dau <= :end AND trang_thai <> 'DA_HUY'
                GROUP BY ma_nv
            ) latest ON hd1.ma_nv = latest.ma_nv AND hd1.ngay_bat_dau = latest.max_ngay
            WHERE hd1.trang_thai <> 'DA_HUY'
        ) hd ON hd.ma_nv = nv.ma_nv
        LEFT JOIN bac_luong bl ON nv.ma_bac = bl.ma_bac
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        LEFT JOIN (
            SELECT ma_nv, SUM(so_cong) AS so_cong, SUM(so_gio_tang_ca) AS so_gio_tang_ca
            FROM bang_cham_cong
            WHERE ngay_cong BETWEEN :start AND :end
            GROUP BY ma_nv
        ) cc ON cc.ma_nv = nv.ma_nv
        WHERE NOT (nv.trang_thai = 'DA_NGHI_VIEC' AND COALESCE(nv.ngay_nghi_viec, '1900-01-01') < :start)
          AND (hd.ma_hd IS NOT NULL OR bl.ma_bac IS NOT NULL)
        ORDER BY nv.ma_nv
    """
    rows = db.execute(text(query), {"start": start, "end": end}).mappings().all()
    return [dict(r) for r in rows]


def get_payroll_rows_of_month(db: Session, thang: int, nam: int) -> dict[str, dict]:
    """Bảng lương đã có của tháng (theo mã NV) để giữ thưởng / khấu trừ khác và không ghi đè bảng đã duyệt."""
    query = """
        SELECT ma_nv, trang_thai, tien_thuong, khau_tru_khac
        FROM bang_luong
        WHERE thang = :thang AND nam = :nam
    """
    rows = db.execute(text(query), {"thang": thang, "nam": nam}).mappings().all()
    return {r["ma_nv"]: dict(r) for r in rows}


def upsert_payroll_line(db: Session, line: dict) -> None:
    """Thêm mới hoặc cập nhật 1 dòng bảng lương ở trạng thái NHAP (người gọi commit)."""
    query = """
        INSERT INTO bang_luong (
            thang, nam, ma_nv, luong_co_ban, he_so_luong,
            so_cong_chuan, so_cong_thuc_te, so_gio_tang_ca,
            luong_theo_cong, tien_tang_ca, tong_phu_cap, tien_thuong,
            luong_gross, bhxh, bhyt, bhtn,
            giam_tru_gia_canh, thu_nhap_tinh_thue, thue_tncn, khau_tru_khac,
            tong_khau_tru, luong_net, trang_thai, ghi_chu
        ) VALUES (
            :thang, :nam, :ma_nv, :luong_co_ban, :he_so_luong,
            :so_cong_chuan, :so_cong_thuc_te, :so_gio_tang_ca,
            :luong_theo_cong, :tien_tang_ca, :tong_phu_cap, :tien_thuong,
            :luong_gross, :bhxh, :bhyt, :bhtn,
            :giam_tru_gia_canh, :thu_nhap_tinh_thue, :thue_tncn, :khau_tru_khac,
            :tong_khau_tru, :luong_net, 'NHAP', :ghi_chu
        )
        ON DUPLICATE KEY UPDATE
            luong_co_ban       = VALUES(luong_co_ban),
            he_so_luong        = VALUES(he_so_luong),
            so_cong_chuan      = VALUES(so_cong_chuan),
            so_cong_thuc_te    = VALUES(so_cong_thuc_te),
            so_gio_tang_ca     = VALUES(so_gio_tang_ca),
            luong_theo_cong    = VALUES(luong_theo_cong),
            tien_tang_ca       = VALUES(tien_tang_ca),
            tong_phu_cap       = VALUES(tong_phu_cap),
            tien_thuong        = VALUES(tien_thuong),
            luong_gross        = VALUES(luong_gross),
            bhxh               = VALUES(bhxh),
            bhyt               = VALUES(bhyt),
            bhtn               = VALUES(bhtn),
            giam_tru_gia_canh  = VALUES(giam_tru_gia_canh),
            thu_nhap_tinh_thue = VALUES(thu_nhap_tinh_thue),
            thue_tncn          = VALUES(thue_tncn),
            khau_tru_khac      = VALUES(khau_tru_khac),
            tong_khau_tru      = VALUES(tong_khau_tru),
            luong_net          = VALUES(luong_net),
            ghi_chu            = VALUES(ghi_chu),
            ngay_cap_nhat      = NOW()
    """
    db.execute(text(query), line)


def get_payroll_by_year(db: Session, ma_nv: str, nam: int) -> dict | None:
    """
    Lấy tổng hợp lương cả năm của nhân viên từ database.
    - Nếu năm đó đủ 12 tháng: cộng và trừ đầy đủ 12 tháng.
    - Nếu mới có đến tháng N (ví dụ tháng 9 hoặc tháng 10): tính tổng hợp lũy kế từ tháng 1 đến tháng có bảng lương trong năm đó.
    """
    query = """
        SELECT
            bl.ma_bl, bl.thang, bl.nam, bl.ma_nv,
            bl.luong_co_ban, bl.he_so_luong,
            bl.so_cong_chuan, bl.so_cong_thuc_te, bl.so_gio_tang_ca,
            bl.luong_theo_cong, bl.tien_tang_ca,
            bl.tong_phu_cap, bl.tien_thuong,
            bl.luong_gross,
            bl.bhxh, bl.bhyt, bl.bhtn,
            bl.giam_tru_gia_canh, bl.thu_nhap_tinh_thue,
            bl.thue_tncn, bl.khau_tru_khac, bl.tong_khau_tru,
            bl.luong_net,
            bl.trang_thai, bl.ghi_chu,
            bl.ngay_tao, bl.ngay_cap_nhat,
            nv.ho_ten
        FROM bang_luong bl
        JOIN nhan_vien nv ON bl.ma_nv = nv.ma_nv
        WHERE bl.ma_nv = :ma_nv
          AND bl.nam = :nam
        ORDER BY bl.thang ASC
    """
    rows = db.execute(text(query), {"ma_nv": ma_nv, "nam": nam}).mappings().all()
    if not rows:
        return None

    items = [dict(r) for r in rows]
    tong_gross = sum(float(r["luong_gross"] or 0) for r in items)
    tong_net = sum(float(r["luong_net"] or 0) for r in items)
    tong_khau_tru = sum(float(r["tong_khau_tru"] or 0) for r in items)
    tong_bhxh = sum(float(r["bhxh"] or 0) for r in items)
    tong_bhyt = sum(float(r["bhyt"] or 0) for r in items)
    tong_bhtn = sum(float(r["bhtn"] or 0) for r in items)
    tong_thue_tncn = sum(float(r["thue_tncn"] or 0) for r in items)
    tong_cong_thuc_te = sum(float(r["so_cong_thuc_te"] or 0) for r in items)
    tong_gio_tang_ca = sum(float(r["so_gio_tang_ca"] or 0) for r in items)
    ho_ten = items[0]["ho_ten"] if items else ""

    return {
        "ma_nv": ma_nv,
        "ho_ten": ho_ten,
        "nam": nam,
        "so_thang_co_luong": len(items),
        "tong_gross": tong_gross,
        "tong_net": tong_net,
        "tong_khau_tru": tong_khau_tru,
        "tong_bhxh": tong_bhxh,
        "tong_bhyt": tong_bhyt,
        "tong_bhtn": tong_bhtn,
        "tong_thue_tncn": tong_thue_tncn,
        "tong_cong_thuc_te": tong_cong_thuc_te,
        "tong_gio_tang_ca": tong_gio_tang_ca,
        "chi_tiet_thang": items,
    }


