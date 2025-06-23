import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import status
from backend.src.main import app


@pytest.mark.asyncio
async def test_register_and_login(monkeypatch):
    # Mocks de validación
    monkeypatch.setattr(
        "backend.src.services.user_service.existing_username", lambda x: False
    )
    monkeypatch.setattr(
        "backend.src.services.user_service.existing_email", lambda x: False
    )

    # Creamos un transport que monta la app FastAPI sin levantar servidor
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        register_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "Aa12345",
        }
        resp = await ac.post("/users/register", json=register_data)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["username"] == "testuser"

        login_data = {"username": "testuser", "password": "Aa12345"}
        resp = await ac.post("/users/login", data=login_data)
        assert resp.status_code == status.HTTP_200_OK
        assert "access_token" in resp.json()
