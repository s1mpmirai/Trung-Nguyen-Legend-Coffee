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


def get_all_company_payroll(db: Session, thang: int, nam: int) -> list[dict]:
    """Lấy danh sách bảng lương tháng của toàn bộ nhân viên cho quản lý."""
    query = """
        SELECT
            bl.ma_bl, bl.thang, bl.nam, bl.ma_nv,
            nv.ho_ten, pb.ten_pb, cv.ten_cv,
            bl.so_cong_thuc_te, bl.luong_gross, bl.tong_khau_tru, bl.luong_net,
            bl.trang_thai
        FROM bang_luong bl
        JOIN nhan_vien nv ON bl.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        WHERE bl.thang = :thang AND bl.nam = :nam
        ORDER BY nv.ma_nv ASC
    """
    rows = db.execute(text(query), {"thang": thang, "nam": nam}).mappings().all()
    return [dict(r) for r in rows]


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


def calculate_and_save_monthly_payroll(db: Session, thang: int, nam: int) -> int:
    """
    Tự động tính lương tháng cho toàn bộ nhân viên đang làm việc và lưu vào bảng bang_luong.
    Trả về số lượng bản ghi bảng lương đã được tính/cập nhật.
    """
    # 1. Lấy danh sách nhân viên đang làm việc kèm thông tin lương
    emp_query = """
        SELECT
            nv.ma_nv,
            COALESCE(bl.muc_luong, 5000000) AS luong_co_ban,
            COALESCE(bl.he_so, 1.00)        AS he_so_luong,
            COALESCE(cv.phu_cap_chuc_vu, 0) AS phu_cap
        FROM nhan_vien nv
        LEFT JOIN bac_luong bl ON nv.ma_bac = bl.ma_bac
        LEFT JOIN chuc_vu cv ON nv.ma_cv = cv.ma_cv
        WHERE nv.trang_thai = 'DANG_LAM'
    """
    employees = db.execute(text(emp_query)).mappings().all()

    count = 0
    so_cong_chuan = 26.0

    for emp in employees:
        ma_nv = emp["ma_nv"]
        luong_co_ban = float(emp["luong_co_ban"])
        he_so = float(emp["he_so_luong"])
        phu_cap = float(emp["phu_cap"])

        # 2. Tổng hợp công từ bảng chấm công
        cc_query = """
            SELECT
                COALESCE(SUM(so_cong), 0)          AS so_cong_thuc_te,
                COALESCE(SUM(so_gio_tang_ca), 0)   AS so_gio_tang_ca
            FROM bang_cham_cong
            WHERE ma_nv = :ma_nv
              AND MONTH(ngay_cong) = :thang
              AND YEAR(ngay_cong)  = :nam
        """
        cc = db.execute(
            text(cc_query), {"ma_nv": ma_nv, "thang": thang, "nam": nam}
        ).mappings().first()

        so_cong_thuc_te = float(cc["so_cong_thuc_te"]) if cc else 0.0
        so_gio_tang_ca = float(cc["so_gio_tang_ca"]) if cc else 0.0

        # 3. Tính toán các khoản lương
        luong_theo_cong = round((luong_co_ban * he_so / so_cong_chuan) * so_cong_thuc_te)
        tien_tang_ca = round((luong_co_ban * he_so / so_cong_chuan / 8) * 1.5 * so_gio_tang_ca)
        tien_thuong = 0
        luong_gross = luong_theo_cong + tien_tang_ca + int(phu_cap) + tien_thuong

        # Các khoản bảo hiểm bắt buộc theo luật lao động VN
        bhxh = round(luong_gross * 0.08)
        bhyt = round(luong_gross * 0.015)
        bhtn = round(luong_gross * 0.01)
        thue_tncn = 0  # Giảm trừ gia cảnh cơ bản 11tr
        if luong_gross > 11000000:
            thue_tncn = round((luong_gross - 11000000 - bhxh - bhyt - bhtn) * 0.05)
            if thue_tncn < 0:
                thue_tncn = 0

        tong_khau_tru = bhxh + bhyt + bhtn + thue_tncn
        luong_net = luong_gross - tong_khau_tru

        # 4. Lưu hoặc cập nhật vào bảng lương (ON DUPLICATE KEY UPDATE)
        upsert_query = """
            INSERT INTO bang_luong (
                thang, nam, ma_nv, luong_co_ban, he_so_luong,
                so_cong_chuan, so_cong_thuc_te, so_gio_tang_ca,
                luong_theo_cong, tien_tang_ca, tong_phu_cap, tien_thuong,
                luong_gross, bhxh, bhyt, bhtn, thue_tncn, khau_tru_khac,
                tong_khau_tru, luong_net, trang_thai
            ) VALUES (
                :thang, :nam, :ma_nv, :luong_co_ban, :he_so_luong,
                :so_cong_chuan, :so_cong_thuc_te, :so_gio_tang_ca,
                :luong_theo_cong, :tien_tang_ca, :tong_phu_cap, :tien_thuong,
                :luong_gross, :bhxh, :bhyt, :bhtn, :thue_tncn, 0,
                :tong_khau_tru, :luong_net, 'NHAP'
            )
            ON DUPLICATE KEY UPDATE
                so_cong_thuc_te = VALUES(so_cong_thuc_te),
                so_gio_tang_ca  = VALUES(so_gio_tang_ca),
                luong_theo_cong = VALUES(luong_theo_cong),
                tien_tang_ca    = VALUES(tien_tang_ca),
                tong_phu_cap    = VALUES(tong_phu_cap),
                luong_gross     = VALUES(luong_gross),
                bhxh            = VALUES(bhxh),
                bhyt            = VALUES(bhyt),
                bhtn            = VALUES(bhtn),
                thue_tncn       = VALUES(thue_tncn),
                tong_khau_tru   = VALUES(tong_khau_tru),
                luong_net       = VALUES(luong_net),
                ngay_cap_nhat   = NOW()
        """
        db.execute(
            text(upsert_query),
            {
                "thang": thang,
                "nam": nam,
                "ma_nv": ma_nv,
                "luong_co_ban": luong_co_ban,
                "he_so_luong": he_so,
                "so_cong_chuan": so_cong_chuan,
                "so_cong_thuc_te": so_cong_thuc_te,
                "so_gio_tang_ca": so_gio_tang_ca,
                "luong_theo_cong": luong_theo_cong,
                "tien_tang_ca": tien_tang_ca,
                "tong_phu_cap": phu_cap,
                "tien_thuong": tien_thuong,
                "luong_gross": luong_gross,
                "bhxh": bhxh,
                "bhyt": bhyt,
                "bhtn": bhtn,
                "thue_tncn": thue_tncn,
                "tong_khau_tru": tong_khau_tru,
                "luong_net": luong_net,
            },
        )
        count += 1

    db.commit()
    return count

