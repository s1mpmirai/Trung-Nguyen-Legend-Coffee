from sqlalchemy import text
from sqlalchemy.orm import Session

# sinh mã nhân viên tự động tăng dần theo số lượng nhân viên hiện có trong cơ sở dữ liệu    
def generate_employee_code(db: Session) -> str:
    latest_code = db.execute(
        text(
            """
            SELECT ma_nv
            FROM nhan_vien
            WHERE ma_nv REGEXP '^NV[0-9]+$'
            ORDER BY CAST(SUBSTRING(ma_nv, 3) AS UNSIGNED) DESC
            LIMIT 1
            """
        )
    ).scalar_one_or_none()

    if latest_code is None:
        next_number = 1
    else:
        next_number = int(latest_code[2:]) + 1

    return f"NV{next_number:02d}"

def define_pass(): # tư động lấy pass = 1
    return "1"