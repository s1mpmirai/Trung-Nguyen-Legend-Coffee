# HRM Lite — Trung Nguyên Legend Coffee

Đồ án Hệ thống thông tin doanh nghiệp (SGU 2026–2027). Phạm vi: CSDL & cổng Admin, mô phỏng hệ thống HRM.
Không bao gồm: kho (MRP), bán hàng/CRM, làm thêm giờ (OT), chấm công GPS.

| Thành phần | Công nghệ | Cổng |
| --- | --- | --- |
| CSDL | MariaDB 10.11 | `localhost:3307` |
| Backend | FastAPI (Python 3.11) | `http://localhost:8000` (tài liệu API: `/docs`) |
| Frontend | React 18 + Vite + Tailwind v4 | `http://localhost:3000` |

## 1. Cài đặt và chạy

```bash
cp .env.example .env          # rồi đổi SECRET_KEY và các mật khẩu CSDL
docker compose up -d --build
```

Lần chạy đầu, MariaDB tự chạy lần lượt các file trong `database/migrations/` (`00` → `05`).

**CSDL đã tồn tại từ phiên bản trước:** backend mới cần các cột/bảng thêm ở migration `04` và `05`. Chạy lần lượt:

```bash
docker exec -i trungnguyen_hrm_lite sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/04_kiem_toan_bao_mat_nghiep_vu.sql
docker exec -i trungnguyen_hrm_lite sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/05_pham_vi_phan_quyen.sql
```

Muốn nạp lại toàn bộ dữ liệu mẫu đã chỉnh sửa (xóa sạch dữ liệu hiện có): sao lưu trước (mục 3), rồi `docker compose down -v && docker compose up -d --build`.

## 2. Tài khoản demo

Mật khẩu dữ liệu mẫu là `1` (chỉ dùng để demo; tài khoản do Admin cấp mới nhận mật khẩu tạm ngẫu nhiên và bắt buộc đổi ở lần đăng nhập đầu).

| Mã NV | Vai trò | Cổng đăng nhập |
| --- | --- | --- |
| NV01 | ADMIN | `/login-manage` → Cổng Admin |
| NV02, NV08 | QUAN_LY (Phòng Nhân sự) + quyền riêng `ATTENDANCE_LOCK` | `/login-manage` → Cổng Quản lý (toàn công ty, chốt công) |
| NV03 | QUAN_LY (Phòng Kế toán) + quyền riêng `PAYROLL_MANAGE` | `/login-manage` → Cổng Quản lý (phòng mình + tính lương toàn công ty) |
| NV04, NV05, NV06, NV07 | QUAN_LY (trưởng phòng khác) | `/login-manage` → Cổng Quản lý (chỉ phòng mình) |
| NV09 | TRUONG_NHOM | `/login-manage` → Cổng Quản lý (chỉ nhân sự cấp dưới trực tiếp) |
| NV10 | NHAN_VIEN | `/login` → Cổng Nhân viên |
| NV14 | NHAN_VIEN + quyền riêng `ACCOUNT_MANAGE` | `/login-manage` → Cổng Admin (chỉ mục Tài khoản) |

Mọi nhân sự có tài khoản đều đăng nhập được Cổng Nhân viên để chấm công và xem lương của mình.

## 3. Sao lưu và phục hồi CSDL

Script nằm trong `database/backup/`; bản sao lưu lưu tại `database/backup/files/` (không commit vì chứa dữ liệu lương).

| Việc | Windows (PowerShell) | Linux / macOS / Git Bash |
| --- | --- | --- |
| Sao lưu (giữ 7 ngày) | `powershell -ExecutionPolicy Bypass -File database\backup\backup.ps1` | `sh database/backup/backup.sh 7` |
| Phục hồi | `powershell -ExecutionPolicy Bypass -File database\backup\restore.ps1 -File <file.zip>` | `sh database/backup/restore.sh <file.sql.gz>` |

- Sao lưu dùng `mariadb-dump --single-transaction --routines --triggers --events`: không khóa bảng, chạy được khi hệ thống đang hoạt động.
- Phục hồi yêu cầu gõ `PHUC HOI` để xác nhận và **tự sao lưu an toàn dữ liệu hiện tại trước khi ghi đè**.
- Lập lịch sao lưu tự động 23:00 hằng ngày trên Windows:

```powershell
schtasks /Create /SC DAILY /ST 23:00 /TN "TNL-HRM-Backup" /TR "powershell -ExecutionPolicy Bypass -File \"D:\duong\dan\du-an\database\backup\backup.ps1\""
```

  Linux/macOS: thêm dòng cron có trong đầu file `backup.sh`.
- Diễn tập phục hồi định kỳ: phục hồi bản mới nhất vào một container thử nghiệm và so số bản ghi `nhan_vien`, `bang_cham_cong`, `bang_luong` mà script in ra.

## 4. Quy tắc nghiệp vụ chính

- **Chấm công web theo ca:** mỗi ngày check-in 1 lần; trễ quá 15 phút → `DI_TRE` (từ lần thứ 4 trong tháng trừ 1 giờ công); ra ca sớm quá 15 phút → `VE_SOM`. Số công theo giờ thực làm: ≥ 7h = 1 công, 4–7h = 0,5 công, < 4h = 0. Không tính làm thêm giờ.
- **Quản lý sửa công:** tối đa 3 lần sửa giờ vào/tháng/nhân viên; mọi thay đổi ghi vào `lich_su_dieu_chinh_cong` (người sửa, giá trị cũ → mới). Trưởng nhóm chỉ sửa công của cấp dưới trực tiếp.
- **Chốt công:** chỉ tài khoản có quyền `ATTENDANCE_LOCK` (mặc định Admin và Phòng Nhân sự). Chốt = duyệt mọi công còn chờ; công bị từ chối không được trả lương. Không mở khóa được khi bảng lương tháng đã duyệt/chi trả. Tháng đã chốt không nhận thêm đơn nghỉ.
- **Đơn từ:** số ngày nghỉ do hệ thống tính (T2–T6, trừ ngày lễ trong bảng `ngay_le`). Nghỉ phép năm = 1 công có lương, kiểm tra quỹ phép (12 ngày + 1 ngày/5 năm thâm niên, năm đầu tính theo tháng). Nghỉ ốm, thai sản = 0 công (BHXH chi trả). Nghỉ không lương = 0 công. Không tự duyệt đơn của mình.
- **Thôi việc có ngày hiệu lực:** ngày hiệu lực ở tương lai thì nhân sự vẫn làm việc và đăng nhập bình thường; đến ngày đó hệ thống tự chuyển `DA_NGHI_VIEC`, khóa tài khoản, thanh lý hợp đồng. Duyệt đơn xin nghỉ việc lên lịch thôi việc tại ngày kết thúc đơn. Không xóa cứng dữ liệu (FK `ON DELETE RESTRICT`).
- **Tính lương:** chỉ tài khoản có `PAYROLL_MANAGE` (mặc định Admin và Phòng Kế toán), chỉ khi đã chốt công. Tách nhiệm vụ: người bấm tính lương không được tự duyệt; không ai duyệt hay chi trả dòng lương của chính mình (bảng `bang_luong` ghi `nguoi_lap`, `nguoi_duyet`). Tính lại nhiều lần không nhân đôi (khóa `thang, nam, ma_nv`; giữ thưởng/khấu trừ; không ghi đè bảng đã duyệt).
  - Lương theo công = lương HĐ × tỷ lệ hưởng ÷ công chuẩn × công thực tế (công chuẩn = ngày T2–T6 trừ ngày lễ).
  - BH người lao động 8% + 1,5% + 1% trên (lương HĐ + phụ cấp chức vụ), trần 46,8 triệu (BHXH/BHYT) và 106,2 triệu (BHTN).
  - Thuế TNCN lũy tiến 5 bậc trên (Gross − BH − 15,5 triệu − 6,2 triệu × số người phụ thuộc). HĐ thử việc: không đóng BH, khấu trừ 10%.
  - Nhân viên chỉ xem/in được bảng lương đã duyệt hoặc đã chi trả.

## 5. Phân quyền (16 quyền)

`EMPLOYEE_VIEW/CREATE/UPDATE/DELETE`, `LEAVE_VIEW/CREATE/APPROVE`, `ATTENDANCE_MANAGE`, `ATTENDANCE_LOCK`, `PAYROLL_VIEW/MANAGE`, `REPORT_VIEW`, `CONTRACT_MANAGE`, `ORG_MANAGE`, `ACCOUNT_MANAGE`, `PERMISSION_ASSIGN`.
Quyền hiệu lực = quyền của vai trò ∪ quyền cấp riêng − quyền thu hồi, kiểm tra ở backend cho mọi API. Admin chỉnh ma trận vai trò × quyền ở Cổng Admin → Phân quyền RBAC.
Cổng Admin chỉ dành cho ADMIN hoặc tài khoản có `ACCOUNT_MANAGE`.

**Phạm vi dữ liệu** (áp dụng cho danh sách và hồ sơ nhân sự, đơn từ, chấm công, báo cáo, phân quyền):

| Ai | Thấy và xử lý |
| --- | --- |
| ADMIN, Quản lý thuộc Phòng Nhân sự (`HR_DEPARTMENT_CODE`, mặc định `PB02`) | Toàn công ty |
| Quản lý phòng ban khác | Nhân sự trong phòng mình + cấp dưới trực tiếp |
| Trưởng nhóm, nhân viên được cấp quyền quản lý riêng | Chỉ cấp dưới trực tiếp (`ma_nql`) |

`PAYROLL_MANAGE`, `ATTENDANCE_LOCK` có tác dụng toàn công ty nên chỉ Admin được cấp (cùng `ACCOUNT_MANAGE`, `PERMISSION_ASSIGN`, `ORG_MANAGE`, `CONTRACT_MANAGE`); Quản lý chỉ cấp được vai trò Nhân viên/Trưởng nhóm và các quyền nghiệp vụ còn lại cho nhân sự trong phạm vi của mình.

## 6. Kiểm thử

```bash
cd backend
pip install -r requirements.txt pytest
python -m pytest tests -q
```

- `tests/test_route_auth.py`: mọi API (trừ đăng nhập, health) bắt buộc có token.
- `tests/test_payroll_calculation.py`: ngày công, trần BH, giảm trừ gia cảnh, thuế lũy tiến, thử việc, ngày lễ, không OT.

## 7. Thông tin nhóm

(Điền danh sách thành viên, MSSV, phân công theo yêu cầu đồ án.)
