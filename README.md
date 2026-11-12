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

Lần chạy đầu, MariaDB tự chạy lần lượt các file trong `database/migrations/` (`00` → `10`).

**CSDL đã tồn tại từ phiên bản trước:** backend mới cần các cột/bảng/dữ liệu thêm ở migration `04` → `10` (mỗi file chạy lại được nhiều lần; nên sao lưu trước, xem mục 3). Chạy lần lượt:

```bash
for f in 04_kiem_toan_bao_mat_nghiep_vu 05_pham_vi_phan_quyen 06_tach_quan_tri_he_thong 07_vai_tro_theo_phong_ban 08_gui_duyet_bang_luong 09_xoa_phong_ban_ngung_hoat_dong 10_ty_le_huong_bang_luong; do
  docker exec -i trungnguyen_hrm_lite sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD"' < database/migrations/$f.sql
done
```

Muốn nạp lại toàn bộ dữ liệu mẫu đã chỉnh sửa (xóa sạch dữ liệu hiện có): sao lưu trước (mục 3), rồi `docker compose down -v && docker compose up -d --build`.

## 2. Tài khoản demo

Mật khẩu dữ liệu mẫu là `1` (chỉ dùng để demo; tài khoản do Admin cấp mới nhận mật khẩu tạm ngẫu nhiên và bắt buộc đổi ở lần đăng nhập đầu).

| Mã NV | Vai trò | Cổng đăng nhập |
| --- | --- | --- |
| NV21 | ADMIN (nhân viên Phòng IT, quản trị hệ thống) | `/login-admin` → Cổng Quản trị |
| NV01 | BAN_GIAM_DOC (Tổng Giám đốc) | `/login-manage` → Cổng Quản lý (toàn công ty, báo cáo, duyệt đơn, duyệt bảng lương) |
| NV02, NV08 | NHAN_SU (Phòng Nhân sự) | `/login-manage` → Cổng Quản lý (hồ sơ, hợp đồng, phòng ban, chức vụ & thang lương, chấm công / chốt công, duyệt đơn) |
| NV03, NV11 | KE_TOAN (Phòng Kế toán); NV03 thêm quyền riêng `PAYROLL_APPROVE` chỉ để duyệt lương Ban Giám đốc | `/login-manage` → Cổng Quản lý (tính lương, xác nhận chi trả, không duyệt lương). NV11 tính lương rồi bấm "Gửi duyệt", NV01 duyệt hoặc trả về; bảng lương của NV01 do NV03 duyệt |
| NV06 | NHAN_VIEN, là Trưởng phòng IT (`phong_ban.ma_truong_pb`) | `/login` → Cổng Nhân viên. Nếu Admin cấp thêm quyền nghiệp vụ (vd `EMPLOYEE_VIEW`, `LEAVE_APPROVE`) thì vào được `/login-manage` và thấy toàn bộ Phòng IT |
| NV09 | NHAN_VIEN, tổ trưởng IT (quản lý trực tiếp của NV14) | `/login` → Cổng Nhân viên. Nếu được cấp quyền nghiệp vụ thì chỉ thấy cấp dưới trực tiếp |
| NV04, NV05 | NHAN_VIEN (trước là trưởng phòng Marketing / Kinh doanh; hai phòng đã giải thể, nhân sự chuyển về Phòng Nhân sự) | `/login` → Cổng Nhân viên |
| NV10 | NHAN_VIEN | `/login` → Cổng Nhân viên |
| NV14 | NHAN_VIEN + quyền riêng `ACCOUNT_MANAGE` | `/login-admin` → Cổng Quản trị (chỉ mục Tài khoản) |

Mọi nhân sự có tài khoản đều đăng nhập được Cổng Nhân viên để chấm công và xem lương của mình.

Ba trang đăng nhập tách biệt, mỗi phiên gắn với cổng đã đăng nhập (không chuyển ngang giữa Cổng Quản trị và Cổng Quản lý):

| Trang | API | Ai đăng nhập được |
| --- | --- | --- |
| `/login-admin` | `POST /auth/admin-login` | Vai trò ADMIN hoặc tài khoản có `ACCOUNT_MANAGE` |
| `/login-manage` | `POST /auth/manager-login` | Ban Giám đốc, Nhân sự, Kế toán hoặc có quyền nghiệp vụ; **từ chối ADMIN** |
| `/login` | `POST /auth/employee-login` | Mọi tài khoản đang hoạt động |

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
- **Chốt công:** chỉ tài khoản có quyền `ATTENDANCE_LOCK` (mặc định Phòng Nhân sự). Chốt = duyệt mọi công còn chờ; công bị từ chối không được trả lương. Không mở khóa được khi bảng lương tháng đã duyệt/chi trả. Tháng đã chốt không nhận thêm đơn nghỉ.
- **Đơn từ:** số ngày nghỉ do hệ thống tính (T2–T6, trừ ngày lễ trong bảng `ngay_le`). Nghỉ phép năm = 1 công có lương, kiểm tra quỹ phép (12 ngày + 1 ngày/5 năm thâm niên, năm đầu tính theo tháng). Nghỉ ốm, thai sản = 0 công (BHXH chi trả). Nghỉ không lương = 0 công. Không tự duyệt đơn của mình.
- **Thôi việc có ngày hiệu lực:** ngày hiệu lực ở tương lai thì nhân sự vẫn làm việc và đăng nhập bình thường; đến ngày đó hệ thống tự chuyển `DA_NGHI_VIEC`, khóa tài khoản, thanh lý hợp đồng. Duyệt đơn xin nghỉ việc lên lịch thôi việc tại ngày kết thúc đơn. Không xóa cứng dữ liệu (FK `ON DELETE RESTRICT`).
- **Tính lương:** chỉ tài khoản có `PAYROLL_MANAGE` (mặc định Phòng Kế toán tính, Tổng Giám đốc duyệt), chỉ khi đã chốt công. Tách nhiệm vụ: người bấm tính lương không được tự duyệt; không ai duyệt hay chi trả dòng lương của chính mình (bảng `bang_luong` ghi `nguoi_lap`, `nguoi_duyet`). Tính lại nhiều lần không nhân đôi (khóa `thang, nam, ma_nv`; giữ thưởng/khấu trừ; không ghi đè bảng đã duyệt).
  - Lương theo công = lương HĐ × tỷ lệ hưởng ÷ công chuẩn × công thực tế (công chuẩn = ngày T2–T6 trừ ngày lễ).
  - BH người lao động 8% + 1,5% + 1% trên (lương HĐ + phụ cấp chức vụ), trần 46,8 triệu (BHXH/BHYT) và 106,2 triệu (BHTN).
  - Thuế TNCN lũy tiến 5 bậc trên (Gross − BH − 15,5 triệu − 6,2 triệu × số người phụ thuộc). HĐ thử việc: không đóng BH, khấu trừ 10%.
  - Nhân viên chỉ xem/in được bảng lương đã duyệt hoặc đã chi trả.
- **Hợp đồng lao động:** 4 loại (thử việc, xác định 1 năm, xác định 3 năm, không xác định thời hạn). Lương thử việc 85–100% lương công việc (Điều 26 BLLĐ), hợp đồng chính thức 100%; tỷ lệ hưởng được lưu vào từng dòng bảng lương. Hợp đồng quá ngày kết thúc tự chuyển `HET_HAN` (máy chủ kiểm tra mỗi giờ); báo cáo nhân sự cảnh báo hợp đồng hết hạn trong 60 ngày. Thôi việc có hiệu lực thì hợp đồng được thanh lý; xóa hợp đồng là xóa mềm, khôi phục được.

## 5. Phân quyền (16 quyền)

`EMPLOYEE_VIEW/CREATE/UPDATE/DELETE`, `LEAVE_VIEW/CREATE/APPROVE`, `ATTENDANCE_MANAGE`, `ATTENDANCE_LOCK`, `PAYROLL_VIEW/MANAGE`, `REPORT_VIEW`, `CONTRACT_MANAGE`, `ORG_MANAGE`, `ACCOUNT_MANAGE`, `PERMISSION_ASSIGN`.
Quyền hiệu lực = quyền của vai trò ∪ quyền cấp riêng − quyền thu hồi, kiểm tra ở backend cho mọi API. Admin chỉnh ma trận vai trò × quyền ở Cổng Admin → Phân quyền RBAC.
Cổng Admin chỉ dành cho ADMIN hoặc tài khoản có `ACCOUNT_MANAGE`, và **tách biệt với Cổng Quản lý** (yêu cầu đồ án mục II.2):

- **ADMIN = quản trị hệ thống (nhân viên IT), không phải giám đốc.** Vai trò ADMIN cố định 3 quyền `ACCOUNT_MANAGE`, `PERMISSION_ASSIGN`, `EMPLOYEE_VIEW` (chặn cứng ở backend, `app/core/roles.py`), không vào được Cổng Quản lý và không có quyền nghiệp vụ (duyệt đơn, chấm công, lương, hợp đồng, tổ chức).
- Cổng Admin: cấp / khóa / mở khóa tài khoản, phân quyền (vai trò, quyền riêng, ma trận vai trò × quyền); xem, tìm kiếm nâng cao, lọc, sắp xếp danh bạ nhân sự, phòng ban, chức vụ (chỉ xem).
- Hợp đồng lao động, thêm/sửa/xóa phòng ban, chức vụ & thang lương nằm ở Cổng Quản lý (quyền `CONTRACT_MANAGE`, `ORG_MANAGE`).
- Không xóa tài khoản: muốn ngừng cho đăng nhập thì khóa tài khoản (mở khóa lại được). Không khóa được tài khoản của chính mình, tài khoản quản trị gốc `NV21` hay ADMIN hoạt động cuối cùng.

**Phạm vi dữ liệu** (áp dụng cho danh sách và hồ sơ nhân sự, đơn từ, chấm công, báo cáo, phân quyền):

| Ai | Thấy và xử lý |
| --- | --- |
| ADMIN (chỉ xem), Quản lý thuộc Phòng Nhân sự (`HR_DEPARTMENT_CODE`, mặc định `PB02`) hoặc Ban Giám đốc (`BOARD_DEPARTMENT_CODE`, mặc định `PB01`) | Toàn công ty |
| Trưởng phòng ban khác (người được ghi là `ma_truong_pb` của phòng) được cấp quyền quản lý riêng | Nhân sự trong phòng mình + cấp dưới trực tiếp |
| Trưởng nhóm, nhân viên được cấp quyền quản lý riêng | Chỉ cấp dưới trực tiếp (`ma_nql`) |

`PAYROLL_MANAGE`, `ATTENDANCE_LOCK` có tác dụng toàn công ty nên chỉ Admin được cấp (cùng `ACCOUNT_MANAGE`, `PERMISSION_ASSIGN`, `ORG_MANAGE`, `CONTRACT_MANAGE`); Quản lý chỉ cấp được vai trò Nhân viên và các quyền nghiệp vụ còn lại cho nhân sự trong phạm vi của mình (vai trò phòng ban và ADMIN chỉ Admin mới gán được).

## 6. Đối chiếu với HRM thương mại và hạn chế đã biết

Nghiệp vụ lõi được đối chiếu với Odoo HR, BambooHR và MISA AMIS HRM (tháng 11/2026):

| Phân hệ | Thông lệ HRM thương mại | Hệ thống này |
| --- | --- | --- |
| Hồ sơ, phạm vi dữ liệu | Quản lý chỉ thấy cấp dưới hoặc phòng mình; nhân viên tự sửa hồ sơ qua duyệt | Có (3 mức phạm vi, yêu cầu sửa hồ sơ qua duyệt) |
| Đơn từ | Kiểm tra quỹ phép, trừ ngày lễ, không tự duyệt | Có (duyệt 1 cấp) |
| Chấm công | Sửa công có ghi vết, chốt công trước khi tính lương | Có |
| Tính lương | Nháp → gửi duyệt → duyệt → chi trả; người tính khác người duyệt; bảng đã duyệt không tính lại | Có |
| Hợp đồng | Tự hết hạn, nhắc gia hạn | Có |
| Phân quyền | Vai trò + quyền riêng, Admin tách khỏi nghiệp vụ | Có (chặt hơn mặc định Odoo) |

Chưa làm (ngoài phạm vi đồ án, nêu để không hiểu nhầm là lỗi):

- Hợp đồng chưa kiểm tra thời gian thử việc tối đa 60 ngày (Điều 25 BLLĐ) và giới hạn ký hợp đồng xác định thời hạn tối đa 2 lần (Điều 20 BLLĐ).
- Quên check-out không tự xử lý: ngày đó không có giờ ra, Quản lý sửa tay (tính vào 3 lần/tháng).
- Nhân viên chỉ hủy được đơn còn chờ duyệt; đơn đã duyệt không thu hồi được.
- Nhật ký kiểm toán chỉ có cho sửa công, duyệt đơn, duyệt lương; chưa ghi vết cấp quyền, đổi vai trò, sửa hồ sơ, sửa hợp đồng.
- Chưa khóa tài khoản sau nhiều lần đăng nhập sai; chưa có thông báo email / đẩy.
- Tham số lương (`app/services/payroll_service.py`): lương cơ sở 2,34 triệu, lương tối thiểu vùng I 5,31 triệu, giảm trừ 15,5 / 6,2 triệu, biểu thuế 5 bậc theo quy định áp dụng kỳ tính thuế 2026; cần cập nhật tay khi Nhà nước thay đổi.

## 7. Thông tin nhóm

(Điền danh sách thành viên, MSSV, phân công theo yêu cầu đồ án.)
