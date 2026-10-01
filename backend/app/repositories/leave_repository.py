from sqlalchemy import text
from sqlalchemy.orm import Session


def generate_leave_code(db: Session) -> str:
    """Sinh mã đơn từ tự động: DT0001, DT0002..."""
    latest_code = db.execute(
        text(
            """
            SELECT ma_don
            FROM don_tu
            WHERE ma_don REGEXP '^DT[0-9]+$'
            ORDER BY CAST(SUBSTRING(ma_don, 3) AS UNSIGNED) DESC
            LIMIT 1
            """
        )
    ).scalar_one_or_none()

    if latest_code is None:
        next_number = 1
    else:
        next_number = int(latest_code[2:]) + 1

    return f"DT{next_number:04d}"


def create_leave(db: Session, data: dict) -> dict:
    """Tạo đơn xin nghỉ mới."""
    ma_don = generate_leave_code(db)
    query = """
        INSERT INTO don_tu (
            ma_don, ma_nv, loai_don, ngay_bat_dau, ngay_ket_thuc,
            so_ngay, ly_do, trang_thai
        ) VALUES (
            :ma_don, :ma_nv, :loai_don, :ngay_bat_dau, :ngay_ket_thuc,
            :so_ngay, :ly_do, 'CHO_DUYET'
        )
    """
    db.execute(
        text(query),
        {
            "ma_don": ma_don,
            "ma_nv": data["ma_nv"],
            "loai_don": data["loai_don"],
            "ngay_bat_dau": data["ngay_bat_dau"],
            "ngay_ket_thuc": data["ngay_ket_thuc"],
            "so_ngay": data["so_ngay"],
            "ly_do": data["ly_do"],
        },
    )
    db.commit()
    return get_leave_by_id(db, ma_don)


def get_leave_by_id(db: Session, ma_don: str) -> dict | None:
    """Lấy chi tiết 1 đơn từ theo mã đơn."""
    query = """
        SELECT 
            dt.ma_don, dt.ma_nv, nv.ho_ten, pb.ten_pb,
            dt.loai_don, dt.ngay_tao, dt.ngay_bat_dau, dt.ngay_ket_thuc,
            dt.so_ngay, dt.ly_do, dt.trang_thai,
            dt.nguoi_duyet, nd.ho_ten AS ten_nguoi_duyet,
            dt.ngay_duyet, dt.y_kien_duyet
        FROM don_tu dt
        JOIN nhan_vien nv ON dt.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN nhan_vien nd ON dt.nguoi_duyet = nd.ma_nv
        WHERE dt.ma_don = :ma_don
    """
    row = db.execute(text(query), {"ma_don": ma_don}).mappings().first()
    return dict(row) if row else None


def get_leaves_by_employee(db: Session, ma_nv: str) -> list[dict]:
    """Lấy lịch sử đơn từ của 1 nhân viên."""
    query = """
        SELECT 
            dt.ma_don, dt.ma_nv, nv.ho_ten, pb.ten_pb,
            dt.loai_don, dt.ngay_tao, dt.ngay_bat_dau, dt.ngay_ket_thuc,
            dt.so_ngay, dt.ly_do, dt.trang_thai,
            dt.nguoi_duyet, nd.ho_ten AS ten_nguoi_duyet,
            dt.ngay_duyet, dt.y_kien_duyet
        FROM don_tu dt
        JOIN nhan_vien nv ON dt.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN nhan_vien nd ON dt.nguoi_duyet = nd.ma_nv
        WHERE dt.ma_nv = :ma_nv
        ORDER BY dt.ngay_bat_dau DESC, dt.ma_don DESC
    """
    rows = db.execute(text(query), {"ma_nv": ma_nv}).mappings().all()
    return [dict(r) for r in rows]


def cancel_leave(db: Session, ma_don: str, ma_nv: str) -> dict | None:
    """Nhân viên tự hủy đơn nghỉ (chỉ hủy được khi đơn còn ở trạng thái CHO_DUYET)."""
    leave = get_leave_by_id(db, ma_don)
    if not leave:
        return None
    if leave["ma_nv"] != ma_nv:
        raise ValueError("Bạn không có quyền hủy đơn của người khác.")
    if leave["trang_thai"] != "CHO_DUYET":
        raise ValueError("Chỉ có thể hủy đơn khi đơn đang ở trạng thái Chờ duyệt.")

    query = """
        UPDATE don_tu
        SET trang_thai = 'DA_HUY', ngay_cap_nhat = NOW()
        WHERE ma_don = :ma_don
    """
    db.execute(text(query), {"ma_don": ma_don})
    db.commit()
    return get_leave_by_id(db, ma_don)


def get_pending_leaves(db: Session) -> list[dict]:
    """Quản lý lấy danh sách các đơn đang chờ duyệt."""
    query = """
        SELECT 
            dt.ma_don, dt.ma_nv, nv.ho_ten, pb.ten_pb,
            dt.loai_don, dt.ngay_tao, dt.ngay_bat_dau, dt.ngay_ket_thuc,
            dt.so_ngay, dt.ly_do, dt.trang_thai,
            dt.nguoi_duyet, NULL AS ten_nguoi_duyet,
            dt.ngay_duyet, dt.y_kien_duyet
        FROM don_tu dt
        JOIN nhan_vien nv ON dt.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        WHERE dt.trang_thai = 'CHO_DUYET'
        ORDER BY dt.ngay_tao ASC
    """
    rows = db.execute(text(query)).mappings().all()
    return [dict(r) for r in rows]


def get_all_leaves(db: Session, trang_thai: str = None) -> list[dict]:
    """Quản lý lấy toàn bộ đơn từ (có thể lọc theo trạng thái)."""
    base_query = """
        SELECT 
            dt.ma_don, dt.ma_nv, nv.ho_ten, pb.ten_pb,
            dt.loai_don, dt.ngay_tao, dt.ngay_bat_dau, dt.ngay_ket_thuc,
            dt.so_ngay, dt.ly_do, dt.trang_thai,
            dt.nguoi_duyet, nd.ho_ten AS ten_nguoi_duyet,
            dt.ngay_duyet, dt.y_kien_duyet
        FROM don_tu dt
        JOIN nhan_vien nv ON dt.ma_nv = nv.ma_nv
        LEFT JOIN phong_ban pb ON nv.ma_pb = pb.ma_pb
        LEFT JOIN nhan_vien nd ON dt.nguoi_duyet = nd.ma_nv
        WHERE (:trang_thai IS NULL OR dt.trang_thai = :trang_thai)
        ORDER BY dt.ngay_tao DESC
    """
    rows = db.execute(text(base_query), {"trang_thai": trang_thai}).mappings().all()
    return [dict(r) for r in rows]


def review_leave(
    db: Session,
    ma_don: str,
    trang_thai: str,
    nguoi_duyet: str,
    y_kien_duyet: str = None
) -> dict | None:
    """Quản lý duyệt hoặc từ chối đơn."""
    query = """
        UPDATE don_tu
        SET trang_thai = :trang_thai,
            nguoi_duyet = :nguoi_duyet,
            ngay_duyet = NOW(),
            y_kien_duyet = :y_kien_duyet,
            ngay_cap_nhat = NOW()
        WHERE ma_don = :ma_don
    """
    result = db.execute(
        text(query),
        {
            "ma_don": ma_don,
            "trang_thai": trang_thai,
            "nguoi_duyet": nguoi_duyet,
            "y_kien_duyet": y_kien_duyet,
        },
    )
    db.commit()
    if result.rowcount == 0:
        return None
    return get_leave_by_id(db, ma_don)
