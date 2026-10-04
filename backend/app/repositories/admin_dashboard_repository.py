from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.datetime_utils import get_vietnam_now


def get_admin_dashboard_stats(db: Session) -> dict:
    now_vn = get_vietnam_now()

    # 1. Thống kê nhân sự
    emp_stats = db.execute(text("""
        SELECT 
            COUNT(*) AS tong_nv,
            SUM(CASE WHEN trang_thai = 'DANG_LAM' THEN 1 ELSE 0 END) AS dang_lam,
            SUM(CASE WHEN trang_thai = 'DA_NGHI_VIEC' THEN 1 ELSE 0 END) AS nghi_viec
        FROM nhan_vien
    """)).mappings().first()

    tong_nhan_su = emp_stats["tong_nv"] or 0
    nhan_su_dang_lam = emp_stats["dang_lam"] or 0
    nhan_su_nghi_viec = emp_stats["nghi_viec"] or 0

    # Nhân sự thử việc (từ hợp đồng THU_VIEC đang có hiệu lực)
    nhan_su_thu_viec = db.execute(text("""
        SELECT COUNT(DISTINCT ma_nv) 
        FROM hop_dong_lao_dong 
        WHERE loai_hd = 'THU_VIEC' AND trang_thai = 'HIEU_LUC'
    """)).scalar() or 0

    # 2. Thống kê phòng ban & chức vụ
    tong_phong_ban = db.execute(text("SELECT COUNT(*) FROM phong_ban WHERE trang_thai = 1")).scalar() or 0
    tong_chuc_vu = db.execute(text("SELECT COUNT(*) FROM chuc_vu")).scalar() or 0

    # 3. Thống kê tài khoản
    acc_stats = db.execute(text("""
        SELECT 
            COUNT(*) AS tong_tk,
            SUM(CASE WHEN trang_thai = 'HOAT_DONG' THEN 1 ELSE 0 END) AS hoat_dong,
            SUM(CASE WHEN trang_thai = 'KHOA' THEN 1 ELSE 0 END) AS khoa
        FROM tai_khoan
    """)).mappings().first()

    tong_tai_khoan = acc_stats["tong_tk"] or 0
    tai_khoan_hoat_dong = acc_stats["hoat_dong"] or 0
    tai_khoan_khoa = acc_stats["khoa"] or 0

    # Nhân sự chưa có tài khoản
    nhan_su_chua_co_tai_khoan = db.execute(text("""
        SELECT COUNT(*)
        FROM nhan_vien nv
        LEFT JOIN tai_khoan tk ON nv.ma_nv = tk.ma_nv
        WHERE tk.ma_nv IS NULL AND nv.trang_thai = 'DANG_LAM'
    """)).scalar() or 0

    # 4. Thống kê nhà cung cấp & kho sản phẩm
    ncc_stats = db.execute(text("""
        SELECT 
            COUNT(*) AS tong_ncc,
            SUM(CASE WHEN trang_thai = 1 THEN 1 ELSE 0 END) AS dang_hop_tac
        FROM nha_cung_cap
    """)).mappings().first()

    tong_nha_cung_cap = ncc_stats["tong_ncc"] or 0
    ncc_dang_hop_tac = ncc_stats["dang_hop_tac"] or 0

    sp_stats = db.execute(text("""
        SELECT 
            COUNT(*) AS tong_sp,
            SUM(CASE WHEN trang_thai = 1 THEN 1 ELSE 0 END) AS dang_ban,
            COALESCE(SUM(ton_kho), 0) AS tong_ton,
            COALESCE(SUM(ton_kho * gia_nhap), 0) AS tong_gia_tri,
            SUM(CASE WHEN ton_kho < 500 THEN 1 ELSE 0 END) AS canh_bao_ton_it
        FROM san_pham
    """)).mappings().first()

    tong_san_pham = sp_stats["tong_sp"] or 0
    san_pham_dang_ban = sp_stats["dang_ban"] or 0
    tong_so_luong_ton_kho = sp_stats["tong_ton"] or 0
    tong_gia_tri_kho = float(sp_stats["tong_gia_tri"] or 0)
    san_pham_canh_bao_ton_it = sp_stats["canh_bao_ton_it"] or 0

    # 5. Thống kê hợp đồng
    hd_stats = db.execute(text("""
        SELECT 
            COUNT(*) AS tong_hd,
            SUM(CASE WHEN trang_thai = 'HIEU_LUC' THEN 1 ELSE 0 END) AS hieu_luc,
            SUM(CASE WHEN trang_thai = 'HIEU_LUC' AND ngay_ket_thuc IS NOT NULL AND DATEDIFF(ngay_ket_thuc, CURDATE()) BETWEEN 0 AND 30 THEN 1 ELSE 0 END) AS sap_het_han_30
        FROM hop_dong_lao_dong
    """)).mappings().first()

    tong_hop_dong = hd_stats["tong_hd"] or 0
    hop_dong_hieu_luc = hd_stats["hieu_luc"] or 0
    hop_dong_sap_het_han_30_ngay = hd_stats["sap_het_han_30"] or 0

    # 6. Phân bố nhân sự theo phòng ban
    dept_rows = db.execute(text("""
        SELECT 
            pb.ma_pb,
            pb.ten_pb,
            COUNT(nv.ma_nv) AS so_luong_nv
        FROM phong_ban pb
        LEFT JOIN nhan_vien nv ON pb.ma_pb = nv.ma_pb AND nv.trang_thai = 'DANG_LAM'
        WHERE pb.trang_thai = 1
        GROUP BY pb.ma_pb, pb.ten_pb
        ORDER BY so_luong_nv DESC, pb.ma_pb ASC
    """)).mappings().all()
    phan_bo_phong_ban = [dict(r) for r in dept_rows]

    # 7. Phân bố theo vai trò người dùng
    role_rows = db.execute(text("""
        SELECT 
            vt.ma_vai_tro,
            vt.ten_vai_tro,
            COUNT(tk.ma_tk) AS so_tai_khoan
        FROM vai_tro vt
        LEFT JOIN tai_khoan tk ON vt.ma_vai_tro = tk.ma_vai_tro
        GROUP BY vt.ma_vai_tro, vt.ten_vai_tro
        ORDER BY so_tai_khoan DESC
    """)).mappings().all()
    phan_bo_vai_tro = [dict(r) for r in role_rows]

    # 8. Danh sách hợp đồng sắp hết hạn trong 30 ngày (tối đa 5 bản ghi mới nhất)
    expiring_rows = db.execute(text("""
        SELECT 
            hd.ma_hd,
            hd.ma_nv,
            nv.ho_ten,
            pb.ten_pb,
            hd.loai_hd,
            DATE_FORMAT(hd.ngay_ket_thuc, '%Y-%m-%d') AS ngay_ket_thuc,
            DATEDIFF(hd.ngay_ket_thuc, CURDATE()) AS so_ngay_con_lai
        FROM hop_dong_lao_dong hd
        JOIN nhan_vien nv ON hd.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        WHERE hd.trang_thai = 'HIEU_LUC' 
          AND hd.ngay_ket_thuc IS NOT NULL 
          AND DATEDIFF(hd.ngay_ket_thuc, CURDATE()) BETWEEN 0 AND 30
        ORDER BY so_ngay_con_lai ASC
        LIMIT 5
    """)).mappings().all()
    danh_sach_hd_sap_het_han = [dict(r) for r in expiring_rows]

    return {
        "tong_nhan_su": tong_nhan_su,
        "nhan_su_dang_lam": nhan_su_dang_lam,
        "nhan_su_nghi_viec": nhan_su_nghi_viec,
        "nhan_su_thu_viec": nhan_su_thu_viec,
        "tong_phong_ban": tong_phong_ban,
        "tong_chuc_vu": tong_chuc_vu,
        "tong_tai_khoan": tong_tai_khoan,
        "tai_khoan_hoat_dong": tai_khoan_hoat_dong,
        "tai_khoan_khoa": tai_khoan_khoa,
        "nhan_su_chua_co_tai_khoan": nhan_su_chua_co_tai_khoan,
        "tong_nha_cung_cap": tong_nha_cung_cap,
        "ncc_dang_hop_tac": ncc_dang_hop_tac,
        "tong_san_pham": tong_san_pham,
        "san_pham_dang_ban": san_pham_dang_ban,
        "tong_so_luong_ton_kho": tong_so_luong_ton_kho,
        "tong_gia_tri_kho": tong_gia_tri_kho,
        "san_pham_canh_bao_ton_it": san_pham_canh_bao_ton_it,
        "tong_hop_dong": tong_hop_dong,
        "hop_dong_hieu_luc": hop_dong_hieu_luc,
        "hop_dong_sap_het_han_30_ngay": hop_dong_sap_het_han_30_ngay,
        "phan_bo_phong_ban": phan_bo_phong_ban,
        "phan_bo_vai_tro": phan_bo_vai_tro,
        "danh_sach_hd_sap_het_han": danh_sach_hd_sap_het_han,
        "thoi_gian_cap_nhat": now_vn,
    }
