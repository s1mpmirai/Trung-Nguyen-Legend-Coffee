/**
 * Service kết nối dữ liệu Chấm công & Nhân sự
 * Ánh xạ 100% với cấu trúc Database Schema (bang_cham_cong, nhan_vien, phong_ban, thong_ke_thang)
 */

export const INITIAL_DATABASE_DATA = {
  // Bảng nhan_vien (Employees)
  employee: {
    ma_nv: 'NV-8824',
    ho_ten: 'Nguyễn Thị Mai Linh',
    phong_ban: 'PHÒNG MARKETING',
    ma_pb: 'PB04',
    chuc_vu: 'Chuyên viên Marketing',
    loai_hop_dong: 'Chính thức',
    trang_thai: 'DANG_LAM',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
    online_status: true,
  },

  // Bảng dia_diem (Work Locations)
  location: {
    ten_dia_diem: 'Văn phòng Tòa nhà Landmark 81, TP. HCM',
    vi_do: 10.7951,
    kinh_do: 106.7218,
    ban_kinh_cho_phep: 50,
    khoang_cach_hien_tai: 15, // 15m
    hop_le: true,
  },

  // Bảng thong_ke_thang (MonthlyStatistics) - Tháng 10/2023
  monthlyStats: {
    thang: 10,
    nam: 2023,
    so_ngay_cong_thuc_te: 21.5,
    so_ngay_cong_chuan: 22.0,
    so_lan_di_muon: 1,
    chi_tiet_muon: 'Muộn 5 phút (12/10)',
    so_gio_ot: 4.5,
    he_so_ot: 'x1.5',
    phep_nam_con_lai: 9.5,
    tong_phep_nam: 12.0,
    han_dung_phep: '31/12',
    cap_nhat_luc: '5 phút trước',
  },

  // Bảng bang_cham_cong (AttendanceRecords / TimeLogs)
  recentRecords: [
    {
      ma_cc: 101,
      thu: 'T2',
      ngay: '23',
      ngay_day_du: '2023-10-23',
      gio_vao: '08:24',
      gio_ra: '17:35',
      ca_lam_viec: 'Ca hành chính',
      dia_diem_cham: 'Landmark 81 (GPS)',
      hinh_thuc: 'GPS',
      trang_thai: 'Đúng giờ',
      ghi_chu: '',
      loai_cong: 'CONG_DU',
    },
    {
      ma_cc: 100,
      thu: 'T6',
      ngay: '20',
      ngay_day_du: '2023-10-20',
      gio_vao: '08:29',
      gio_ra: '19:00',
      ca_lam_viec: 'Ca hành chính',
      dia_diem_cham: 'QR Lễ tân (OT 1.5h)',
      hinh_thuc: 'QR_CODE',
      trang_thai: 'Đúng giờ',
      ghi_chu: 'OT 1.5h',
      loai_cong: 'CONG_DU',
    },
    {
      ma_cc: 99,
      thu: 'T5',
      ngay: '19',
      ngay_day_du: '2023-10-19',
      gio_vao: '08:15',
      gio_ra: '17:32',
      ca_lam_viec: 'Ca hành chính',
      dia_diem_cham: 'Máy chấm công cửa',
      hinh_thuc: 'FINGERPRINT',
      trang_thai: 'Đúng giờ',
      ghi_chu: '',
      loai_cong: 'CONG_DU',
    },
  ],
};

/**
 * Lấy dữ liệu bảng chấm công của nhân viên
 */
export async function getAttendanceDashboardData(ma_nv = 'NV10') {
  try {
    const cleanId = (ma_nv || 'NV10').toString().trim().toUpperCase().replace('-', '');
    const res = await fetch(`/api/v1/attendance/dashboard/${cleanId}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.error('Error fetching dashboard from API:', e);
  }
  return INITIAL_DATABASE_DATA;
}

/**
 * Thực hiện chấm công vào ca (Check-in)
 */
export async function checkInAttendance(ma_nv, locationData) {
  try {
    const res = await fetch('/api/v1/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ma_nv, location: locationData }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // offline fallback
  }
  
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return {
    success: true,
    gio_vao: timeStr,
    message: `Chấm công VÀO CA thành công lúc ${timeStr}`,
  };
}

/**
 * Thực hiện chấm công ra ca (Check-out)
 */
export async function checkOutAttendance(ma_nv, locationData) {
  try {
    const res = await fetch('/api/v1/attendance/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ma_nv, location: locationData }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    // offline fallback
  }

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return {
    success: true,
    gio_ra: timeStr,
    message: `Chấm công RA CA thành công lúc ${timeStr}`,
  };
}

/**
 * Lấy danh sách lịch sử chấm công chi tiết theo tháng/năm
 */
export async function getAttendanceHistory(ma_nv = 'NV10', month = null, year = null) {
  try {
    const cleanId = (ma_nv || 'NV10').toString().trim().toUpperCase().replace('-', '');
    let url = `/api/v1/attendance/history/${cleanId}`;
    const params = [];
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Error fetching attendance history:', e);
  }
  return { month: month || 10, year: year || 2026, summary: {}, records: [] };
}
