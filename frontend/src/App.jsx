import React, { useState, useEffect } from 'react';
import Login from './pages/auth/Login';
import AttendanceDashboard from './pages/employee/AttendanceDashboard';

function App() {
  // Trạng thái màn hình: kiểm tra nếu đã lưu phiên đăng nhập
  const [currentPage, setCurrentPage] = useState('login');
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    const savedMaNv = localStorage.getItem('user_ma_nv');
    if (savedMaNv) {
      setUserSession({
        ma_nv: savedMaNv,
      });
      setCurrentPage('attendance');
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUserSession(userData);
    setCurrentPage('attendance');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_ma_nv');
    localStorage.removeItem('auth_token');
    setUserSession(null);
    setCurrentPage('login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start">
      {/* Container chuẩn mobile-first: Full width trên điện thoại, gom gọn ở giữa màn hình (max-w-md) khi mở trên máy tính */}
      <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] shadow-2xl flex flex-col relative overflow-x-hidden">
        {currentPage === 'login' ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <AttendanceDashboard
            userSession={userSession}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}

export default App;
