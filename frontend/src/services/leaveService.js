/**
 * Service lấy dữ liệu Đơn từ trực tiếp từ MariaDB thông qua backend API
 * Tuyệt đối không dùng dữ liệu giả lập (mock data).
 */

export async function getLeaveHistory(ma_nv = 'NV10') {
  try {
    const cleanId = (ma_nv || 'NV10').toString().trim().toUpperCase().replace('-', '');
    const res = await fetch(`/api/v1/leaves/history/${cleanId}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error('Error fetching leaves:', e);
  }
  return [];
}
