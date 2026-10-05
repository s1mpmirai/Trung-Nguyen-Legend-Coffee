-- =================================================================================
-- HỆ THỐNG QUẢN LÝ NHÂN SỰ TRUNG NGUYÊN COFFEE (HRM LITE - CHUẨN HÓA 3NF)
-- HQTCSDL: MySQL 8.0+ / MariaDB 10.6+
-- ĐÃ ĐỒNG BỘ ĐẦY ĐỦ ngay_tao & ngay_cap_nhat TRÊN TẤT CẢ 16 BẢNG
-- =================================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS trungnguyen_hrm_lite;
CREATE DATABASE trungnguyen_hrm_lite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trungnguyen_hrm_lite;

-- =====================================================================
-- PHẦN 1: CẤU TRÚC CƠ SỞ DỮ LIỆU (DDL - 16 BẢNG)
-- =====================================================================

-- 1. Phòng ban
CREATE TABLE phong_ban (
    ma_pb VARCHAR(10) PRIMARY KEY,
    ten_pb VARCHAR(150) NOT NULL,
    ma_truong_pb VARCHAR(10) NULL,
    sdt VARCHAR(20),
    mo_ta VARCHAR(255),
    trang_thai TINYINT(1) DEFAULT 1,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục phòng ban';

-- 2. Chức vụ
CREATE TABLE chuc_vu (
    ma_cv VARCHAR(10) PRIMARY KEY,
    ten_cv VARCHAR(100) NOT NULL,
    cap_bac TINYINT DEFAULT 1 COMMENT '1=NV, 2=Tổ trưởng, 3=Phó/Trưởng phòng, 4=Phó GĐ, 5=Ban GĐ',
    phu_cap_chuc_vu DECIMAL(12,0) DEFAULT 0,
    mo_ta VARCHAR(255),
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục chức vụ';

-- 4. Bậc lương (Thang bảng lương)
CREATE TABLE bac_luong (
    ma_bac INT AUTO_INCREMENT PRIMARY KEY,
    ma_cv VARCHAR(10) NOT NULL,
    bac TINYINT NOT NULL COMMENT 'Bậc 1, 2, 3...',
    he_so DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    muc_luong DECIMAL(12,0) NOT NULL DEFAULT 0,
    mo_ta VARCHAR(255),
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (ma_cv, bac),
    CONSTRAINT fk_bl_chucvu FOREIGN KEY (ma_cv) REFERENCES chuc_vu(ma_cv) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Hệ số lương theo chức vụ và bậc';

-- 5. Hồ sơ nhân viên
CREATE TABLE nhan_vien (
    ma_nv VARCHAR(10) PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    ngay_sinh DATE NOT NULL,
    gioi_tinh ENUM('Nam', 'Nu', 'Khac') DEFAULT 'Nam',
    cccd VARCHAR(20) NOT NULL UNIQUE,
    dia_chi VARCHAR(255),
    sdt VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    so_nguoi_pt TINYINT DEFAULT 0 COMMENT 'Số người phụ thuộc',
    ma_pb VARCHAR(10) NOT NULL,
    ma_cv VARCHAR(10) NOT NULL,
    ma_bac INT NULL COMMENT 'Bậc lương hiện tại',
    ma_nql VARCHAR(10) NULL COMMENT 'Mã người quản lý trực tiếp',
    ngay_nghi_viec DATE NULL,
    trang_thai ENUM('DANG_LAM', 'NGHI_PHEP', 'NGHI_THAI_SAN', 'TAM_HOAN_HD', 'DA_NGHI_VIEC') DEFAULT 'DANG_LAM',
    hinh_thuc_lam_viec ENUM('FULL_TIME', 'PART_TIME') DEFAULT 'FULL_TIME' COMMENT 'Hình thức: Toàn thời gian / Bán thời gian',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_nv_phongban FOREIGN KEY (ma_pb) REFERENCES phong_ban(ma_pb) ON UPDATE CASCADE,
    CONSTRAINT fk_nv_chucvu FOREIGN KEY (ma_cv) REFERENCES chuc_vu(ma_cv) ON UPDATE CASCADE,
    CONSTRAINT fk_nv_bacluong FOREIGN KEY (ma_bac) REFERENCES bac_luong(ma_bac) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_nv_quanly FOREIGN KEY (ma_nql) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Hồ sơ thông tin nhân viên';

CREATE INDEX idx_nv_hoten ON nhan_vien(ho_ten);
CREATE INDEX idx_nv_mapb ON nhan_vien(ma_pb);
CREATE INDEX idx_nv_macv ON nhan_vien(ma_cv);
CREATE INDEX idx_nv_trangthai ON nhan_vien(trang_thai);

-- 6. Trình độ học vấn & Bằng cấp
CREATE TABLE bang_cap (
    ma_bc INT AUTO_INCREMENT PRIMARY KEY,
    ma_nv VARCHAR(10) NOT NULL,
    trinh_do ENUM('THPT', 'TRUNG_CAP', 'CAO_DANG', 'DAI_HOC', 'THAC_SI', 'TIEN_SI', 'CHUNG_CHI') NOT NULL,
    chuyen_nganh VARCHAR(150),
    noi_dao_tao VARCHAR(150),
    nam_tot_nghiep SMALLINT,
    xep_loai ENUM('TRUNG_BINH', 'KHA', 'GIOI', 'XUAT_SAC'),
    ghi_chu VARCHAR(255),
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bc_nhanvien FOREIGN KEY (ma_nv) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Trình độ bằng cấp nhân sự';

-- 7. Hợp đồng lao động
CREATE TABLE hop_dong_lao_dong (
    ma_hd VARCHAR(15) PRIMARY KEY,
    ma_nv VARCHAR(10) NOT NULL,
    loai_hd ENUM('THU_VIEC', 'XAC_DINH_1_NAM', 'XAC_DINH_3_NAM', 'KHONG_XAC_DINH', 'THOI_VU') NOT NULL,
    ngay_ky DATE NOT NULL,
    ngay_bat_dau DATE NOT NULL COMMENT 'Ngày vào làm / bắt đầu HĐ',
    ngay_ket_thuc DATE NULL,
    luong_co_ban DECIMAL(12,0) NOT NULL,
    ty_le_huong DECIMAL(5,2) DEFAULT 100.00,
    so_tai_khoan VARCHAR(30) NULL,
    ngan_hang VARCHAR(80) NULL,
    ma_so_thue VARCHAR(20) NULL,
    so_bhxh VARCHAR(20) NULL,
    trang_thai ENUM('HIEU_LUC', 'HET_HAN', 'DA_THANH_LY', 'TAM_HOAN') DEFAULT 'HIEU_LUC',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT ck_hd_luong CHECK (luong_co_ban > 0),
    CONSTRAINT fk_hd_nhanvien FOREIGN KEY (ma_nv) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Hợp đồng lao động';

-- 8. Đơn từ
CREATE TABLE don_tu (
    ma_don VARCHAR(15) PRIMARY KEY,
    ma_nv VARCHAR(10) NOT NULL,
    loai_don ENUM('NGHI_PHEP', 'NGHI_OM', 'NGHI_THAI_SAN', 'NGHI_KHONG_LUONG', 'NGHI_VIEC', 'KHAC') NOT NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NOT NULL,
    so_ngay DECIMAL(4,1) NOT NULL,
    ly_do VARCHAR(500) NOT NULL,
    trang_thai ENUM('CHO_DUYET', 'DA_DUYET', 'TU_CHOI', 'DA_HUY') DEFAULT 'CHO_DUYET',
    nguoi_duyet VARCHAR(10) NULL,
    ngay_duyet DATETIME NULL,
    y_kien_duyet VARCHAR(500),
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT ck_don_songay CHECK (so_ngay > 0),
    CONSTRAINT ck_don_ngay CHECK (ngay_ket_thuc >= ngay_bat_dau),
    CONSTRAINT fk_don_nhanvien FOREIGN KEY (ma_nv) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_don_nguoiduyet FOREIGN KEY (nguoi_duyet) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Đơn từ nghỉ phép';

-- 9. Ca làm việc
CREATE TABLE ca_lam_viec (
    ma_ca VARCHAR(10) PRIMARY KEY,
    ten_ca VARCHAR(60) NOT NULL,
    gio_vao TIME NOT NULL,
    gio_ra TIME NOT NULL,
    so_gio_chuan DECIMAL(4,2) DEFAULT 8.00,
    he_so DECIMAL(4,2) DEFAULT 1.00,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục ca làm việc';

-- 10. Chấm công
CREATE TABLE bang_cham_cong (
    ma_cc BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_nv VARCHAR(10) NOT NULL,
    ngay_cong DATE NOT NULL,
    ma_ca VARCHAR(10) NULL,
    gio_vao TIME NULL,
    gio_ra TIME NULL,
    so_gio_lam DECIMAL(4,2) DEFAULT 0,
    so_gio_tang_ca DECIMAL(4,2) DEFAULT 0,
    loai_cong ENUM('CONG_DU', 'DI_TRE', 'VE_SOM', 'NUA_CONG', 'NGHI_PHEP', 'NGHI_OM', 'NGHI_THAI_SAN', 'NGHI_KHONG_PHEP', 'NGHI_LE', 'CUOI_TUAN') DEFAULT 'CONG_DU',
    so_cong DECIMAL(3,2) DEFAULT 1.00,
    trang_thai_duyet ENUM('CHO_DUYET', 'DA_DUYET', 'TU_CHOI') DEFAULT 'CHO_DUYET',
    ma_don VARCHAR(15) NULL,
    ghi_chu VARCHAR(255),
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (ma_nv, ngay_cong),
    CONSTRAINT fk_cc_nhanvien FOREIGN KEY (ma_nv) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cc_ca FOREIGN KEY (ma_ca) REFERENCES ca_lam_viec(ma_ca) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_cc_don FOREIGN KEY (ma_don) REFERENCES don_tu(ma_don) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Bảng chấm công hàng ngày';

-- 10.1. Lịch sử quản lý sửa chấm công nhân viên (Tối đa 3 lần/tháng cho sửa giờ check-in)
CREATE TABLE IF NOT EXISTS lich_su_dieu_chinh_cong (
    ma_ls BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_cc BIGINT NOT NULL,
    ma_nv VARCHAR(10) NOT NULL,
    thang TINYINT NOT NULL,
    nam SMALLINT NOT NULL,
    gio_vao_cu TIME NULL,
    gio_vao_moi TIME NULL,
    gio_ra_cu TIME NULL,
    gio_ra_moi TIME NULL,
    ly_do VARCHAR(255) NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ls_cc FOREIGN KEY (ma_cc) REFERENCES bang_cham_cong(ma_cc) ON DELETE CASCADE,
    CONSTRAINT fk_ls_nv FOREIGN KEY (ma_nv) REFERENCES nhan_vien(ma_nv) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Lịch sử quản lý sửa chấm công nhân viên';

-- 10.2. Yêu cầu cập nhật hồ sơ cá nhân nhân viên (Chờ Quản lý phê duyệt mới lưu DB)
CREATE TABLE IF NOT EXISTS yeu_cau_cap_nhat_ho_so (
    ma_yc BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_nv VARCHAR(10) NOT NULL,
    thong_tin_cu JSON NULL COMMENT 'Snapshot thông tin cũ trước khi sửa',
    thong_tin_moi JSON NOT NULL COMMENT 'Thông tin nhân viên yêu cầu thay đổi',
    ly_do VARCHAR(500) NULL COMMENT 'Lý do xin thay đổi thông tin',
    trang_thai ENUM('CHO_DUYET', 'DA_DUYET', 'TU_CHOI', 'DA_HUY') DEFAULT 'CHO_DUYET',
    nguoi_duyet VARCHAR(10) NULL,
    ngay_duyet DATETIME NULL,
    y_kien_duyet VARCHAR(500) NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_yc_nhanvien FOREIGN KEY (ma_nv) REFERENCES nhan_vien(ma_nv) ON DELETE CASCADE,
    CONSTRAINT fk_yc_nguoiduyet FOREIGN KEY (nguoi_duyet) REFERENCES nhan_vien(ma_nv) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Yêu cầu cập nhật hồ sơ cá nhân nhân viên';

-- 10.3. Chốt/Khóa bảng công tháng
CREATE TABLE IF NOT EXISTS chot_cong_thang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thang TINYINT NOT NULL,
    nam SMALLINT NOT NULL,
    trang_thai VARCHAR(20) DEFAULT 'DA_CHOT',
    nguoi_chot VARCHAR(50) NULL,
    ngay_chot DATETIME DEFAULT CURRENT_TIMESTAMP,
    ghi_chu VARCHAR(255) NULL,
    UNIQUE (thang, nam)
) ENGINE=InnoDB COMMENT='Chốt và khóa bảng chấm công tháng';



-- 11. Bảng lương tháng
CREATE TABLE bang_luong (
    ma_bl BIGINT AUTO_INCREMENT PRIMARY KEY,
    thang TINYINT NOT NULL,
    nam SMALLINT NOT NULL,
    ma_nv VARCHAR(10) NOT NULL,
    luong_co_ban DECIMAL(12,0) NOT NULL,
    he_so_luong DECIMAL(4,2) DEFAULT 1.00,
    so_cong_chuan DECIMAL(4,1) NOT NULL DEFAULT 26.0,
    so_cong_thuc_te DECIMAL(4,1) DEFAULT 0,
    luong_theo_cong DECIMAL(12,0) DEFAULT 0,
    tong_phu_cap DECIMAL(12,0) DEFAULT 0,
    tien_thuong DECIMAL(12,0) DEFAULT 0,
    luong_gross DECIMAL(12,0) DEFAULT 0,
    bhxh DECIMAL(12,0) DEFAULT 0,
    bhyt DECIMAL(12,0) DEFAULT 0,
    bhtn DECIMAL(12,0) DEFAULT 0,
    thue_tncn DECIMAL(12,0) DEFAULT 0,
    khau_tru_khac DECIMAL(12,0) DEFAULT 0,
    tong_khau_tru DECIMAL(12,0) DEFAULT 0,
    luong_net DECIMAL(12,0) DEFAULT 0,
    trang_thai ENUM('NHAP', 'DA_DUYET', 'DA_TRA') DEFAULT 'NHAP',
    ghi_chu VARCHAR(255),
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (thang, nam, ma_nv),
    CONSTRAINT ck_bl_thang CHECK (thang BETWEEN 1 AND 12),
    CONSTRAINT fk_bl_nhanvien FOREIGN KEY (ma_nv) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bảng tính lương tháng nhân viên';

-- 12. Vai trò hệ thống
CREATE TABLE vai_tro (
    ma_vai_tro VARCHAR(30) PRIMARY KEY,
    ten_vai_tro VARCHAR(100) NOT NULL UNIQUE,
    mo_ta VARCHAR(255),
    he_thong TINYINT(1) NOT NULL DEFAULT 0,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục vai trò RBAC';

-- 13. Quyền chức năng
CREATE TABLE quyen (
    ma_quyen VARCHAR(50) PRIMARY KEY,
    ten_quyen VARCHAR(150) NOT NULL,
    nhom_quyen VARCHAR(50) NOT NULL,
    mo_ta VARCHAR(255),
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục quyền chức năng';

-- 14. Tài khoản
CREATE TABLE tai_khoan (
    ma_tk INT AUTO_INCREMENT PRIMARY KEY,
    ma_nv VARCHAR(10) NOT NULL UNIQUE COMMENT 'Mã nhân viên (Khóa ngoại & dùng để đăng nhập)',
    mat_khau VARCHAR(255) NOT NULL,
    ma_vai_tro VARCHAR(30) NOT NULL DEFAULT 'NHAN_VIEN',
    trang_thai ENUM('HOAT_DONG', 'KHOA', 'CHO_KICH_HOAT') DEFAULT 'HOAT_DONG',
    lan_dn_cuoi DATETIME NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tk_nhanvien FOREIGN KEY (ma_nv) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tk_vaitro FOREIGN KEY (ma_vai_tro) REFERENCES vai_tro(ma_vai_tro) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 15. Quyền mặc định theo vai trò
CREATE TABLE vai_tro_quyen (
    ma_vai_tro VARCHAR(30) NOT NULL,
    ma_quyen VARCHAR(50) NOT NULL,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (ma_vai_tro, ma_quyen),
    CONSTRAINT fk_vtq_vaitro FOREIGN KEY (ma_vai_tro) REFERENCES vai_tro(ma_vai_tro) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_vtq_quyen FOREIGN KEY (ma_quyen) REFERENCES quyen(ma_quyen) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Ánh xạ vai trò và quyền mặc định';

-- 16. Quyền tùy chỉnh cho tài khoản
CREATE TABLE tai_khoan_quyen (
    ma_tk INT NOT NULL,
    ma_quyen VARCHAR(50) NOT NULL,
    duoc_cap TINYINT(1) NOT NULL DEFAULT 1,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (ma_tk, ma_quyen),
    CONSTRAINT fk_tkq_taikhoan FOREIGN KEY (ma_tk) REFERENCES tai_khoan(ma_tk) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tkq_quyen FOREIGN KEY (ma_quyen) REFERENCES quyen(ma_quyen) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Khóa ngoại vòng
ALTER TABLE phong_ban
ADD CONSTRAINT fk_pb_truong_pb 
FOREIGN KEY (ma_truong_pb) REFERENCES nhan_vien(ma_nv) ON UPDATE CASCADE ON DELETE SET NULL;


-- =====================================================================
-- PHẦN 2: DỮ LIỆU MẪU CHUẨN XÁC
-- =====================================================================

START TRANSACTION;

-- 1. Phòng ban
INSERT INTO phong_ban (ma_pb, ten_pb, sdt, mo_ta) VALUES
('PB01', 'Ban Giám đốc',              '028 3829 1234', 'Điều hành toàn bộ tập đoàn'),
('PB02', 'Phòng Nhân sự',             '028 3829 1235', 'Quản lý nhân sự, tuyển dụng, đào tạo'),
('PB03', 'Phòng Kế toán – Tài chính', '028 3829 1236', 'Kế toán, tài chính, thuế'),
('PB04', 'Phòng Marketing',           '028 3829 1237', 'Truyền thông, quảng cáo thương hiệu'),
('PB05', 'Phòng Kinh doanh',          '028 3829 1238', 'Bán hàng, phát triển thị trường'),
('PB06', 'Phòng IT',                   '028 3829 1239', 'Công nghệ thông tin, hạ tầng'),
('PB07', 'Xưởng Sản xuất',            '0262 385 6780', 'Sản xuất, chế biến cà phê'),
('PB08', 'Phòng Kinh doanh Miền Bắc', '024 3933 5679', 'Kinh doanh khu vực phía Bắc');

-- 2. Chức vụ
INSERT INTO chuc_vu (ma_cv, ten_cv, cap_bac, phu_cap_chuc_vu, mo_ta) VALUES
('CV01', 'Nhân viên',               1,        0, 'Nhân viên thử việc / chính thức'),
('CV02', 'Nhân viên chính',         1,   500000, 'Nhân viên có kinh nghiệm'),
('CV03', 'Tổ trưởng / Trưởng nhóm', 2,  1000000, 'Tổ trưởng / trưởng nhóm bộ phận'),
('CV04', 'Phó phòng',               3,  2000000, 'Phó trưởng phòng'),
('CV05', 'Trưởng phòng',            3,  3000000, 'Trưởng phòng ban'),
('CV06', 'Phó Giám đốc',            4,  5000000, 'Phó giám đốc chi nhánh / khối'),
('CV07', 'Giám đốc',                5,  8000000, 'Giám đốc chi nhánh'),
('CV08', 'Tổng Giám đốc',           5, 15000000, 'Tổng giám đốc tập đoàn');

-- 4. Bậc lương
INSERT INTO bac_luong (ma_cv, bac, he_so, muc_luong, mo_ta) VALUES
('CV01', 1, 1.00,  8000000, 'Nhân viên thử việc / mới'),
('CV01', 2, 1.10,  9000000, 'Nhân viên sau 1 năm'),
('CV01', 3, 1.20, 10000000, 'Nhân viên sau 3 năm'),
('CV02', 1, 1.20, 10000000, 'NV chính bậc 1'),
('CV02', 2, 1.35, 12000000, 'NV chính bậc 2'),
('CV02', 3, 1.50, 14000000, 'NV chính bậc 3'),
('CV03', 1, 1.50, 15000000, 'Tổ trưởng bậc 1'),
('CV03', 2, 1.70, 17000000, 'Tổ trưởng bậc 2'),
('CV04', 1, 1.80, 18000000, 'Phó phòng bậc 1'),
('CV04', 2, 2.00, 20000000, 'Phó phòng bậc 2'),
('CV05', 1, 2.20, 25000000, 'Trưởng phòng bậc 1'),
('CV05', 2, 2.50, 30000000, 'Trưởng phòng bậc 2'),
('CV06', 1, 3.00, 40000000, 'PGĐ bậc 1'),
('CV06', 2, 3.50, 50000000, 'PGĐ bậc 2'),
('CV07', 1, 4.00, 55000000, 'Giám đốc bậc 1'),
('CV07', 2, 4.50, 65000000, 'Giám đốc bậc 2'),
('CV08', 1, 5.00, 80000000, 'Tổng Giám đốc');

-- 5. Nhân viên
INSERT INTO nhan_vien (ma_nv, ho_ten, ngay_sinh, gioi_tinh, cccd, dia_chi, sdt, email,
  so_nguoi_pt, ma_pb, ma_cv, ma_bac, ma_nql, ngay_nghi_viec, trang_thai) VALUES
('NV01','Đặng Lê Nguyên Vũ',  '1971-02-10','Nam','079071000001','Quận 2, TPHCM',         '0901234567','vudln@trungnguyen.com',    2,'PB01','CV08', 17,NULL, NULL,'DANG_LAM'),
('NV02','Nguyễn Thị Minh Tâm','1985-05-15','Nu', '079185000002','Quận 7, TPHCM',         '0912345678','tamntm@trungnguyen.com',   1,'PB02','CV05', 11,'NV01',NULL,'DANG_LAM'),
('NV03','Trần Văn Hùng',      '1982-10-20','Nam','079082000003','Bình Thạnh, TPHCM',     '0923456789','hungtv@trungnguyen.com',   0,'PB03','CV05', 11,'NV01',NULL,'DANG_LAM'),
('NV04','Lê Hoàng Phúc',      '1988-08-08','Nam','079088000004','Phú Nhuận, TPHCM',      '0934567890','phuclh@trungnguyen.com',   1,'PB04','CV05', 11,'NV01',NULL,'DANG_LAM'),
('NV05','Phạm Thị Hương',     '1990-12-12','Nu', '079190000005','Quận 1, TPHCM',         '0945678901','huongpt@trungnguyen.com',  0,'PB05','CV05', 11,'NV01',NULL,'DANG_LAM'),
('NV06','Võ Minh Tuấn',       '1987-07-07','Nam','079087000006','Quận 3, TPHCM',         '0956789012','tuanvm@trungnguyen.com',   2,'PB06','CV05', 11,'NV01',NULL,'DANG_LAM'),
('NV07','Nguyễn Văn Đức',     '1979-04-30','Nam','066079000007','TP. BMT, Đắk Lắk',     '0967890123','ducnv@trungnguyen.com',    1,'PB07','CV05', 11,'NV01',NULL,'DANG_LAM'),
('NV08','Hoàng Thị Lan',      '1992-09-02','Nu', '079192000008','Quận 4, TPHCM',         '0978901234','lanht@trungnguyen.com',    0,'PB02','CV04',  9,'NV02',NULL,'DANG_LAM'),
('NV09','Trần Minh Khoa',     '1995-11-11','Nam','079095000009','Quận 10, TPHCM',        '0989012345','khoatm@trungnguyen.com',   0,'PB06','CV03',  7,'NV06',NULL,'DANG_LAM'),
('NV10','Lê Thị Thu',         '1996-03-08','Nu', '079196000010','Gò Vấp, TPHCM',        '0990123456','thult@trungnguyen.com',    0,'PB02','CV01',  1,'NV08',NULL,'DANG_LAM'),
('NV11','Phạm Văn Nam',       '1994-06-15','Nam','079094000011','Tân Bình, TPHCM',       '0902345678','nampv@trungnguyen.com',    1,'PB03','CV02',  4,'NV03',NULL,'DANG_LAM'),
('NV12','Vũ Thị Ngọc',        '1997-10-10','Nu', '079197000012','Tân Phú, TPHCM',        '0913456789','ngocvt@trungnguyen.com',   0,'PB04','CV01',  1,'NV04',NULL,'DANG_LAM'),
('NV13','Bùi Văn Tiến',       '1993-01-25','Nam','079093000013','Quận 8, TPHCM',         '0924567890','tienbv@trungnguyen.com',   2,'PB05','CV02',  4,'NV05',NULL,'DANG_LAM'),
('NV14','Đinh Thị Mai',       '1998-12-20','Nu', '079198000014','Thủ Đức, TPHCM',        '0935678901','maidt@trungnguyen.com',    0,'PB06','CV01',  1,'NV09',NULL,'DANG_LAM'),
('NV15','Lý Văn Cường',       '1985-08-15','Nam','066085000015','Cư M''gar, Đắk Lắk',   '0946789012','cuonglv@trungnguyen.com',  1,'PB07','CV03',  7,'NV07',NULL,'DANG_LAM'),
('NV16','Ngô Thị Cẩm',        '1990-04-05','Nu', '066190000016','Buôn Đôn, Đắk Lắk',    '0957890123','camnt@trungnguyen.com',    0,'PB07','CV01',  1,'NV15',NULL,'DANG_LAM'),
('NV17','Trần Văn Long',      '1989-02-14','Nam','001089000017','Cầu Giấy, Hà Nội',     '0968901234','longtv@trungnguyen.com',   1,'PB08','CV04',  9,'NV01',NULL,'DANG_LAM'),
('NV18','Lê Thị Phương',      '1995-07-22','Nu', '001195000018','Đống Đa, Hà Nội',      '0979012345','phuonglt@trungnguyen.com', 0,'PB08','CV01',  1,'NV17',NULL,'DANG_LAM'),
('NV19','Phạm Minh Trí',      '1997-11-30','Nam','048097000019','Hải Châu, Đà Nẵng',    '0980123456','tripm@trungnguyen.com',    0,'PB05','CV01',  1,'NV05',NULL,'DANG_LAM'),
('NV20','Nguyễn Thị Tuyết',   '1994-01-01','Nu', '079194000020','Quận 1, TPHCM',         '0991234567','tuyetnt@trungnguyen.com',  0,'PB02','CV01',  1,'NV08','2025-12-31','DA_NGHI_VIEC');

-- Cập nhật trưởng phòng
UPDATE phong_ban SET ma_truong_pb = 'NV01' WHERE ma_pb = 'PB01';
UPDATE phong_ban SET ma_truong_pb = 'NV02' WHERE ma_pb = 'PB02';
UPDATE phong_ban SET ma_truong_pb = 'NV03' WHERE ma_pb = 'PB03';
UPDATE phong_ban SET ma_truong_pb = 'NV04' WHERE ma_pb = 'PB04';
UPDATE phong_ban SET ma_truong_pb = 'NV05' WHERE ma_pb = 'PB05';
UPDATE phong_ban SET ma_truong_pb = 'NV06' WHERE ma_pb = 'PB06';
UPDATE phong_ban SET ma_truong_pb = 'NV07' WHERE ma_pb = 'PB07';
UPDATE phong_ban SET ma_truong_pb = 'NV17' WHERE ma_pb = 'PB08';

-- 6. Bằng cấp
INSERT INTO bang_cap (ma_nv, trinh_do, chuyen_nganh, noi_dao_tao, nam_tot_nghiep, xep_loai, ghi_chu) VALUES
('NV01', 'THAC_SI',   'Quản trị Kinh doanh',     'ĐH Kinh tế TPHCM',         2002, 'XUAT_SAC',   'Thạc sĩ Quản trị'),
('NV02', 'THAC_SI',   'Quản trị Nguồn nhân lực', 'ĐH Quốc gia TPHCM',        2012, 'GIOI',       'Chứng chỉ HRM Quốc tế'),
('NV03', 'DAI_HOC',   'Kế toán - Kiểm toán',     'ĐH Kinh tế TPHCM',         2004, 'GIOI',       'Chứng chỉ Kế toán trưởng'),
('NV04', 'DAI_HOC',   'Marketing',               'ĐH Tài chính - Marketing', 2010, 'KHA',        'Digital Marketing'),
('NV05', 'DAI_HOC',   'Kinh doanh Quốc tế',      'ĐH Ngoại thương CS2',      2012, 'GIOI',       'TOEIC 850'),
('NV06', 'DAI_HOC',   'Khoa học Máy tính',       'ĐH Bách Khoa TPHCM',       2009, 'GIOI',       'Chứng chỉ Giải pháp Cloud'),
('NV07', 'DAI_HOC',   'Công nghệ Thực phẩm',     'ĐH Nông Lâm TPHCM',        2001, 'KHA',        'Chuyên gia pha chế nếm thử'),
('NV08', 'DAI_HOC',   'Luật Kinh tế',            'ĐH Luật TPHCM',            2014, 'KHA',        'Chuyên về Luật Lao động'),
('NV09', 'DAI_HOC',   'Kỹ thuật Phần mềm',       'ĐH Sài Gòn (SGU)',         2017, 'GIOI',       'Fullstack Developer'),
('NV10', 'CAO_DANG',  'Quản trị Văn phòng',      'CĐ Kinh tế TPHCM',         2018, 'KHA',        'Tin học văn phòng nâng cao'),
('NV11', 'DAI_HOC',   'Tài chính - Ngân hàng',   'ĐH Sài Gòn (SGU)',         2016, 'GIOI',       NULL),
('NV12', 'DAI_HOC',   'Thiết kế Đồ họa',         'ĐH Kiến trúc TPHCM',       2019, 'KHA',        NULL),
('NV13', 'CAO_DANG',  'Quản trị Bán hàng',       'CĐ Kinh tế Đối ngoại',     2015, 'TRUNG_BINH', NULL),
('NV14', 'DAI_HOC',   'Công nghệ Thông tin',     'ĐH Sài Gòn (SGU)',         2020, 'GIOI',       'Frontend Developer'),
('NV15', 'TRUNG_CAP', 'Vận hành máy chế biến',   'TC Kỹ thuật Đắk Lắk',      2006, 'KHA',        NULL),
('NV16', 'THPT',      'Phổ thông trung học',     'THPT Buôn Đôn',            2008, 'TRUNG_BINH', 'Công nhân trực tiếp');

-- 7. Hợp đồng lao động
INSERT INTO hop_dong_lao_dong (ma_hd, ma_nv, loai_hd, ngay_ky, ngay_bat_dau, ngay_ket_thuc, luong_co_ban, ty_le_huong, so_tai_khoan, ngan_hang, ma_so_thue, so_bhxh, trang_thai) VALUES
('HD-001','NV01','KHONG_XAC_DINH','1996-06-16','1996-06-16',NULL,        80000000, 100.00, '1001234567','Vietcombank','8071234567','7196000001', 'HIEU_LUC'),
('HD-002','NV02','KHONG_XAC_DINH','2010-03-01','2010-03-01',NULL,        35000000, 100.00, '1002345678','Techcombank','8085234567','7110000002', 'HIEU_LUC'),
('HD-003','NV03','KHONG_XAC_DINH','2012-05-15','2012-05-15',NULL,        32000000, 100.00, '1003456789','BIDV',       '8082345678','7112000003', 'HIEU_LUC'),
('HD-004','NV04','KHONG_XAC_DINH','2015-09-01','2015-09-01',NULL,        30000000, 100.00, '1004567890','MB Bank',    '8088456789','7115000004', 'HIEU_LUC'),
('HD-005','NV05','KHONG_XAC_DINH','2016-01-10','2016-01-10',NULL,        30000000, 100.00, '1005678901','ACB',        '8090567890','7116000005', 'HIEU_LUC'),
('HD-006','NV06','KHONG_XAC_DINH','2014-11-01','2014-11-01',NULL,        33000000, 100.00, '1006789012','Sacombank',  '8087678901','7114000006', 'HIEU_LUC'),
('HD-007','NV07','KHONG_XAC_DINH','2005-02-15','2005-02-15',NULL,        25000000, 100.00, '1007890123','Agribank',   '8079789012','7105000007', 'HIEU_LUC'),
('HD-008','NV08','XAC_DINH_3_NAM','2024-06-01','2024-06-01','2027-05-31', 18000000, 100.00, '1008901234','VPBank',     '8092890123','7118000008', 'HIEU_LUC'),
('HD-009','NV09','XAC_DINH_3_NAM','2022-08-15','2022-08-15','2025-08-14', 15000000, 100.00, '1009012345','TPBank',     '8095901234','7119000009', 'HIEU_LUC'),
('HD-010','NV10','XAC_DINH_1_NAM','2025-02-01','2025-02-01','2026-01-31', 10000000, 100.00, '1010123456','Vietcombank','8096012345','7120000010', 'HIEU_LUC'),
('HD-011','NV11','XAC_DINH_3_NAM','2022-05-10','2022-05-10','2025-05-09', 12000000, 100.00, '1011234567','BIDV',       '8094123456','7119000011', 'HIEU_LUC'),
('HD-012','NV12','XAC_DINH_1_NAM','2025-07-01','2025-07-01','2026-06-30',  9000000, 100.00, '1012345678','MB Bank',    '8097234567','7121000012', 'HIEU_LUC'),
('HD-013','NV13','XAC_DINH_3_NAM','2024-09-15','2024-09-15','2027-09-14', 11000000, 100.00, '1013456789','ACB',        '8093345678','7118000013', 'HIEU_LUC'),
('HD-014','NV14','XAC_DINH_1_NAM','2025-03-01','2025-03-01','2026-02-28',  9500000, 100.00, '1014567890','Sacombank',  '8098456789','7122000014', 'HIEU_LUC'),
('HD-015','NV15','KHONG_XAC_DINH','2010-11-20','2010-11-20',NULL,        16000000, 100.00, '1015678901','Agribank',   '8085567890','7110000015', 'HIEU_LUC'),
('HD-016','NV16','XAC_DINH_3_NAM','2024-06-10','2024-06-10','2027-06-09',  8500000, 100.00, '1016789012','Agribank',   '8090678901','7115000016', 'HIEU_LUC'),
('HD-017','NV17','KHONG_XAC_DINH','2016-08-01','2016-08-01',NULL,        20000000, 100.00, '1017890123','Vietinbank', '8089789012','7116000017', 'HIEU_LUC'),
('HD-018','NV18','XAC_DINH_1_NAM','2025-04-15','2025-04-15','2026-04-14',  9000000, 100.00, '1018901234','Vietinbank', '8095890123','7120000018', 'HIEU_LUC'),
('HD-019','NV19','THU_VIEC',      '2025-09-01','2025-09-01','2025-11-30',  8000000,  85.00, '1019012345','ACB',        '8097901234','7121000019', 'HIEU_LUC'),
('HD-020','NV20','XAC_DINH_1_NAM','2024-10-01','2024-10-01','2025-09-30',  8000000, 100.00, '1020123456','VPBank',     '8094012345','7119000020', 'DA_THANH_LY');

-- 8. Đơn từ
INSERT INTO don_tu (ma_don, ma_nv, loai_don, ngay_bat_dau, ngay_ket_thuc, so_ngay, ly_do,
  trang_thai, nguoi_duyet, ngay_duyet, y_kien_duyet) VALUES
('DT-001','NV10','NGHI_PHEP',        '2026-09-05','2026-09-06',   2.0,'Nghỉ phép năm đi du lịch',               'DA_DUYET', 'NV02','2026-08-26 09:00:00','Đồng ý'),
('DT-002','NV12','NGHI_OM',          '2026-09-10','2026-09-11',   2.0,'Nghỉ ốm sốt siêu vi, có giấy bác sĩ',  'DA_DUYET', 'NV04','2026-09-10 08:30:00','Đồng ý, nghỉ dưỡng bệnh'),
('DT-003','NV14','NGHI_PHEP',        '2026-09-15','2026-09-15',   1.0,'Nghỉ phép giải quyết việc gia đình',     'DA_DUYET', 'NV06','2026-09-14 15:00:00','OK'),
('DT-004','NV08','NGHI_PHEP',        '2026-09-20','2026-09-22',   3.0,'Đi công tác kết hợp nghỉ phép',          'CHO_DUYET',NULL,  NULL,                  NULL),
('DT-005','NV18','NGHI_PHEP',        '2026-09-25','2026-09-25',   1.0,'Nghỉ phép việc gia đình',                'CHO_DUYET',NULL,  NULL,                  NULL),
('DT-006','NV19','NGHI_KHONG_LUONG', '2026-09-30','2026-09-30',   1.0,'Nghỉ không lương giải quyết việc riêng', 'TU_CHOI',   'NV05','2026-09-16 08:00:00','Từ chối — cuối tháng cần nhân sự'),
('DT-007','NV11','NGHI_THAI_SAN',    '2026-10-01','2027-03-31', 182.0,'Nghỉ thai sản theo chế độ nhà nước',    'DA_DUYET', 'NV02','2026-09-05 10:00:00','Đồng ý theo chế độ BHXH'),
('DT-008','NV20','NGHI_VIEC',        '2025-12-01','2025-12-31',  30.0,'Xin nghỉ việc theo nguyện vọng cá nhân', 'DA_DUYET', 'NV02','2025-12-05 14:00:00','Đã thanh lý hợp đồng');

-- 9. Ca làm việc
INSERT INTO ca_lam_viec (ma_ca, ten_ca, gio_vao, gio_ra, so_gio_chuan, he_so) VALUES
('CA01', 'Hành chính', '08:00:00', '17:00:00', 8.00, 1.00),
('CA02', 'Ca sáng',    '06:00:00', '14:00:00', 8.00, 1.00),
('CA03', 'Ca chiều',   '14:00:00', '22:00:00', 8.00, 1.00);

-- 10. Chấm công
INSERT INTO bang_cham_cong (ma_nv, ngay_cong, ma_ca, gio_vao, gio_ra, so_gio_lam, so_gio_tang_ca, loai_cong, so_cong, ghi_chu) VALUES
('NV02','2026-09-01','CA01','07:55:00','17:05:00',8.00,0.00,'CONG_DU',1.00,NULL),
('NV02','2026-09-02','CA01','07:50:00','17:10:00',8.00,0.00,'CONG_DU',1.00,NULL),
('NV02','2026-09-03','CA01','08:15:00','17:00:00',7.75,0.00,'DI_TRE', 0.50,'Đi trễ 15 phút'),
('NV02','2026-09-04','CA01','07:58:00','17:00:00',8.00,0.00,'CONG_DU',1.00,NULL),
('NV10','2026-09-01','CA01','07:50:00','17:00:00',8.00,0.00,'CONG_DU',1.00,NULL),
('NV10','2026-09-02','CA01','07:55:00','17:05:00',8.00,0.00,'CONG_DU',1.00,NULL),
('NV10','2026-09-05',NULL,  NULL,      NULL,      0.00,0.00,'NGHI_PHEP',0.00,'Nghỉ phép năm'),
('NV10','2026-09-06',NULL,  NULL,      NULL,      0.00,0.00,'NGHI_PHEP',0.00,'Nghỉ phép năm'),
('NV07','2026-09-01','CA02','05:50:00','14:05:00',8.00,0.00,'CONG_DU',1.00,NULL),
('NV07','2026-09-02','CA02','05:45:00','14:00:00',8.00,0.00,'CONG_DU',1.00,NULL),
('NV07','2026-09-03','CA02','05:55:00','16:00:00',8.00,2.00,'CONG_DU',1.00,'OT 2 giờ'),
('NV15','2026-09-01','CA03','13:50:00','22:05:00',8.00,0.00,'CONG_DU',1.00,NULL),
('NV15','2026-09-02','CA03','13:45:00','22:00:00',8.00,0.00,'CONG_DU',1.00,NULL),
('NV09','2026-09-01','CA01','07:58:00','17:00:00',8.00,0.00,'CONG_DU',1.00,NULL),
('NV09','2026-09-03','CA01','07:50:00','20:00:00',8.00,3.00,'CONG_DU',1.00,'OT 3 giờ deploy');

-- 11. Bảng lương
INSERT INTO bang_luong (thang, nam, ma_nv, luong_co_ban, he_so_luong, so_cong_chuan, so_cong_thuc_te,
  luong_theo_cong, tong_phu_cap, tien_thuong,
  luong_gross, bhxh, bhyt, bhtn, thue_tncn, khau_tru_khac, tong_khau_tru, luong_net,
  trang_thai, ghi_chu) VALUES
(8,2026,'NV01',80000000,5.00,22.0,22.0,80000000,15000000,5000000,100000000,6400000,1200000,800000,20000000,0,28400000,71600000,'DA_DUYET','Tổng Giám đốc'),
(8,2026,'NV02',35000000,2.20,22.0,22.0,35000000, 3000000,      0, 38000000,2800000, 525000,350000, 4000000,0, 7675000,30325000,'DA_DUYET',NULL),
(8,2026,'NV03',32000000,2.20,22.0,22.0,32000000, 3000000,      0, 35000000,2560000, 480000,320000, 3000000,0, 6360000,28640000,'DA_DUYET',NULL),
(8,2026,'NV04',30000000,2.20,22.0,22.0,30000000, 3000000,      0, 33000000,2400000, 450000,300000, 2500000,0, 5650000,27350000,'DA_DUYET',NULL),
(8,2026,'NV05',30000000,2.20,22.0,22.0,30000000, 3000000,3000000, 36000000,2400000, 450000,300000, 2800000,0, 5950000,30050000,'DA_DUYET','Thưởng doanh số'),
(8,2026,'NV06',33000000,2.20,22.0,22.0,33000000, 3000000,      0, 36000000,2640000, 495000,330000, 3200000,0, 6665000,29335000,'DA_DUYET',NULL),
(8,2026,'NV07',25000000,2.20,22.0,22.0,25000000, 3000000,1000000, 29000000,2000000, 375000,250000, 1500000,0, 4125000,24875000,'DA_DUYET',NULL),
(8,2026,'NV08',18000000,1.80,22.0,22.0,18000000, 2000000,      0, 20000000,1440000, 270000,180000,  500000,0, 2390000,17610000,'DA_DUYET',NULL),
(8,2026,'NV09',15000000,1.50,22.0,22.0,15000000, 1000000,      0, 16000000,1200000, 225000,150000,  100000,0, 1675000,14325000,'DA_DUYET',NULL),
(8,2026,'NV10',10000000,1.00,22.0,20.0, 9090909,       0, 500000,  9590909, 800000, 150000,100000,       0,0, 1050000, 8540909,'DA_DUYET',NULL);

-- 12. Vai trò
INSERT INTO vai_tro (ma_vai_tro, ten_vai_tro, mo_ta, he_thong) VALUES
('ADMIN',       'Quản trị viên', 'Toàn quyền quản trị hệ thống và phân quyền', 1),
('QUAN_LY',     'Quản lý',       'Quản lý nhân sự và nghiệp vụ được phân công', 1),
('TRUONG_NHOM', 'Trưởng nhóm',   'Quản lý nhóm nhân sự trực thuộc',             1),
('NHAN_VIEN',   'Nhân viên',     'Sử dụng các chức năng cá nhân',               1);

-- 13. Quyền
INSERT INTO quyen (ma_quyen, ten_quyen, nhom_quyen, mo_ta) VALUES
('EMPLOYEE_VIEW',     'Xem nhân sự',         'NHAN_SU',    'Xem danh sách và hồ sơ nhân sự'),
('EMPLOYEE_CREATE',   'Thêm nhân sự',        'NHAN_SU',    'Tạo hồ sơ nhân sự mới'),
('EMPLOYEE_UPDATE',   'Sửa nhân sự',         'NHAN_SU',    'Cập nhật hồ sơ nhân sự'),
('EMPLOYEE_DELETE',   'Xóa nhân sự',         'NHAN_SU',    'Xóa hoặc ngừng sử dụng hồ sơ nhân sự'),
('LEAVE_VIEW',        'Xem đơn từ',          'DON_TU',     'Xem đơn nghỉ phép, nghỉ việc'),
('LEAVE_CREATE',      'Tạo đơn từ',          'DON_TU',     'Gửi đơn nghỉ phép, nghỉ việc'),
('LEAVE_APPROVE',     'Duyệt đơn từ',        'DON_TU',     'Duyệt hoặc từ chối đơn từ'),
('ATTENDANCE_MANAGE', 'Quản lý chấm công',   'CHAM_CONG',  'Xem và cập nhật chấm công'),
('PAYROLL_VIEW',      'Xem bảng lương',      'LUONG',      'Xem bảng lương cá nhân hoặc nhân sự'),
('PAYROLL_MANAGE',    'Tính và duyệt lương', 'LUONG',      'Tính, cập nhật và duyệt bảng lương'),
('ACCOUNT_MANAGE',    'Quản lý tài khoản',   'PHAN_QUYEN', 'Thêm, khóa, mở khóa tài khoản'),
('PERMISSION_ASSIGN', 'Cấp quyền tài khoản', 'PHAN_QUYEN', 'Gán hoặc thu hồi quyền cho tài khoản');

-- 14. Phân quyền theo vai trò
INSERT INTO vai_tro_quyen (ma_vai_tro, ma_quyen) VALUES
('ADMIN', 'ACCOUNT_MANAGE'),
('ADMIN', 'PERMISSION_ASSIGN'),
('ADMIN', 'EMPLOYEE_VIEW'),
('ADMIN', 'EMPLOYEE_CREATE'),
('ADMIN', 'EMPLOYEE_UPDATE'),
('ADMIN', 'EMPLOYEE_DELETE'),
('QUAN_LY', 'EMPLOYEE_VIEW'), ('QUAN_LY', 'EMPLOYEE_CREATE'), ('QUAN_LY', 'EMPLOYEE_UPDATE'),
('QUAN_LY', 'LEAVE_VIEW'), ('QUAN_LY', 'LEAVE_APPROVE'), ('QUAN_LY', 'ATTENDANCE_MANAGE'),
('QUAN_LY', 'PAYROLL_VIEW'), ('QUAN_LY', 'PAYROLL_MANAGE'),
('TRUONG_NHOM', 'EMPLOYEE_VIEW'), ('TRUONG_NHOM', 'LEAVE_VIEW'), ('TRUONG_NHOM', 'LEAVE_APPROVE'),
('TRUONG_NHOM', 'ATTENDANCE_MANAGE'), ('TRUONG_NHOM', 'PAYROLL_VIEW'),
('NHAN_VIEN', 'LEAVE_VIEW'), ('NHAN_VIEN', 'LEAVE_CREATE'), ('NHAN_VIEN', 'PAYROLL_VIEW');

-- 15. Tài khoản
INSERT INTO tai_khoan (ma_nv, mat_khau, ma_vai_tro, trang_thai) VALUES
('NV01', '1', 'ADMIN',       'HOAT_DONG'),
('NV02', '1', 'QUAN_LY',     'HOAT_DONG'),
('NV03', '1', 'QUAN_LY',     'HOAT_DONG'),
('NV04', '1', 'QUAN_LY',     'HOAT_DONG'),
('NV05', '1', 'QUAN_LY',     'HOAT_DONG'),
('NV06', '1', 'QUAN_LY',     'HOAT_DONG'),
('NV08', '1', 'QUAN_LY',     'HOAT_DONG'),
('NV09', '1', 'TRUONG_NHOM', 'HOAT_DONG'),
('NV10', '1', 'NHAN_VIEN',   'HOAT_DONG'),
('NV14', '1', 'NHAN_VIEN',   'HOAT_DONG');

-- 16. Quyền riêng theo tài khoản
-- Admin cấp quyền Quản lý tài khoản (ACCOUNT_MANAGE) cho nhân viên IT (NV14 - Đinh Thị Mai)
INSERT INTO tai_khoan_quyen (ma_tk, ma_quyen, duoc_cap)
SELECT ma_tk, 'ACCOUNT_MANAGE', 1 FROM tai_khoan WHERE ma_nv = 'NV14';

-- Cấp thêm quyền Thêm nhân sự cho Trưởng nhóm NV09
INSERT INTO tai_khoan_quyen (ma_tk, ma_quyen, duoc_cap)
SELECT ma_tk, 'EMPLOYEE_CREATE', 1 FROM tai_khoan WHERE ma_nv = 'NV09';

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;