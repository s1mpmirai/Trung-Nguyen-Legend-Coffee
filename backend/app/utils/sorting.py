def build_order_by(
    sort_by: str | None,
    sort_order: str | None,
    allowed_columns: dict[str, str],
    default_order: str,
) -> str:
    """Sinh mệnh đề ORDER BY an toàn: chỉ nhận cột nằm trong whitelist, chống SQL injection.

    allowed_columns: ánh xạ tên trường phía client -> biểu thức SQL.
    default_order: thứ tự mặc định, đồng thời làm khóa phụ để kết quả phân trang ổn định.
    """
    column = allowed_columns.get((sort_by or "").strip().lower())
    if column is None:
        return f"ORDER BY {default_order}"

    direction = "DESC" if str(sort_order or "").lower() == "desc" else "ASC"
    return f"ORDER BY {column} {direction}, {default_order}"
