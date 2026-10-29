"""
Mọi API (trừ đăng nhập và health check) phải yêu cầu Bearer token.
Kiểm tra qua OpenAPI: endpoint có dependency OAuth2PasswordBearer sẽ mang khóa "security".
Chạy: cd backend && python -m pytest tests -q
"""
from app.main import app

PUBLIC_ENDPOINTS = {
    ("post", "/api/v1/auth/admin-login"),
    ("post", "/api/v1/auth/login-admin"),
    ("post", "/api/v1/auth/manager-login"),
    ("post", "/api/v1/auth/login-manager"),
    ("post", "/api/v1/auth/login-manage"),
    ("post", "/api/v1/auth/employee-login"),
    ("post", "/api/v1/auth/login-employee"),
    ("get", "/health"),
}


def _operations():
    schema = app.openapi()
    for path, methods in schema["paths"].items():
        for method, operation in methods.items():
            yield method, path, operation


def test_every_non_login_endpoint_requires_token():
    unprotected = sorted(
        f"{method.upper()} {path}"
        for method, path, operation in _operations()
        if (method, path) not in PUBLIC_ENDPOINTS and not operation.get("security")
    )
    assert unprotected == [], f"Endpoint không yêu cầu đăng nhập: {unprotected}"


def test_login_endpoints_stay_public():
    operations = {(method, path): op for method, path, op in _operations()}
    for key in PUBLIC_ENDPOINTS:
        if key in operations:
            assert not operations[key].get("security"), f"{key} phải truy cập được khi chưa đăng nhập"
