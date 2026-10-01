from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import get_db

router = APIRouter()

@router.get("/history/{ma_nv}")
def get_leaves_by_employee(ma_nv: str, db: Session = Depends(get_db)):
    """Chỉ truy vấn SELECT lấy dữ liệu đơn từ từ database, không can thiệp logic nghiệp vụ"""
    clean_id = ma_nv.strip().upper().replace("-", "")
    query = text("""
        SELECT 
            dt.ma_don, dt.ma_nv, dt.loai_don, dt.ngay_tao,
            dt.ngay_bat_dau, dt.ngay_ket_thuc, dt.so_ngay,
            dt.ly_do, dt.trang_thai, dt.nguoi_duyet, dt.ngay_duyet,
            dt.y_kien_duyet,
            nv.ho_ten AS ten_nguoi_duyet
        FROM don_tu dt
        LEFT JOIN nhan_vien nv ON dt.nguoi_duyet = nv.ma_nv
        WHERE dt.ma_nv = :ma_nv
        ORDER BY dt.ngay_bat_dau DESC, dt.ma_don DESC
    """)
    rows = db.execute(query, {"ma_nv": clean_id}).fetchall()
    results = []
    for r in rows:
        m = dict(r._mapping)
        for k in ["ngay_tao", "ngay_bat_dau", "ngay_ket_thuc", "ngay_duyet"]:
            if m.get(k) is not None:
                m[k] = str(m[k])
        if m.get("so_ngay") is not None:
            m["so_ngay"] = float(m["so_ngay"])
        results.append(m)
    return results
