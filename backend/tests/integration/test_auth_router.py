import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import status
from bson import ObjectId
from datetime import datetime, timezone, timedelta

from backend.src.main import app
from backend.src.client import db_client
import backend.src.routers.jwt_auth_users as auth_mod
import backend.src.services.user_service as user_service


@pytest.mark.asyncio
async def test_register_and_login(monkeypatch):
    monkeypatch.setattr(user_service, "existing_username", lambda x: False)
    monkeypatch.setattr(user_service, "existing_email", lambda x: False)

    class DummyUsers:
        def insert_one(self, doc):
            class R:
                inserted_id = ObjectId("64b7f57e5f4c2a6f9d1e2b3c")

            return R()

    monkeypatch.setattr(db_client, "local", type("L", (), {"users": DummyUsers()})())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {"username": "testuser", "email": "t@e.com", "password": "Aa12345"}
        res = await ac.post("/users/register", json=payload)
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["username"] == "testuser"
        assert data["user_id"] == "64b7f57e5f4c2a6f9d1e2b3c"

        stored = {
            "_id": ObjectId("64b7f57e5f4c2a6f9d1e2b3c"),
            "username": "testuser",
            "hashed_password": auth_mod.crypt.hash("Aa12345"),
            "email": "t@e.com",
            "role": "user",
            "created_at": datetime.now(timezone.utc),
        }

        class LoginUsers:
            def find_one(self, q):
                return stored

        monkeypatch.setattr(
            db_client, "local", type("L", (), {"users": LoginUsers()})()
        )

        res2 = await ac.post(
            "/users/login", data={"username": "testuser", "password": "Aa12345"}
        )
        assert res2.status_code == status.HTTP_200_OK
        assert "access_token" in res2.json()


@pytest.mark.asyncio
async def test_get_me_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/users/me")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_get_me_authorized(monkeypatch):
    user_doc = {
        "_id": ObjectId("64b7f57e5f4c2a6f9d1e2b3d"),
        "username": "usuario1",
        "email": "u1@e.com",
        "created_at": datetime.now(timezone.utc),
        "role": "user",
        "hashed_password": "",
    }

    class Users:
        def find_one(self, q):
            return user_doc

    monkeypatch.setattr(
        db_client,
        "local",
        type("L", (), {"users": Users(), "analysis": None, "news": None})(),
    )

    token = auth_mod.create_access_token(
        {"sub": user_doc["username"]},
        expires_delta=timedelta(minutes=auth_mod.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_200_OK
    j = res.json()
    assert j["username"] == "usuario1"
    assert j["email"] == "u1@e.com"
    assert "id" in j and isinstance(j["id"], str)


@pytest.mark.asyncio
async def test_update_me_success(monkeypatch):
    orig = {
        "_id": ObjectId("64b7f57e5f4c2a6f9d1e2b3e"),
        "username": "orig",
        "email": "orig@e.com",
        "hashed_password": auth_mod.crypt.hash("Aa12345"),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }

    class Users:
        def find_one(self, q):
            return orig

        def update_one(self, filt, data):
            self._called = (filt, data)

    dummy = type("L", (), {"users": Users(), "analysis": None, "news": None})()
    monkeypatch.setattr(db_client, "local", dummy)
    monkeypatch.setattr(user_service, "existing_username", lambda x: False)
    monkeypatch.setattr(user_service, "existing_email", lambda x: False)

    token = auth_mod.create_access_token(
        {"sub": orig["username"]},
        expires_delta=timedelta(minutes=auth_mod.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.patch(
            "/users/me",
            json={"username": "nuevo1", "email": "nuevo@e.com", "password": "Bb12345"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["message"] == "User updated successfully"
    assert hasattr(dummy.users, "_called")


@pytest.mark.asyncio
async def test_update_me_conflict_username(monkeypatch):
    orig = {
        "_id": ObjectId(),
        "username": "orig",
        "email": "orig@e.com",
        "hashed_password": auth_mod.crypt.hash("Aa12345"),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }

    class Users:
        def find_one(self, q):
            return orig

    dummy = type("L", (), {"users": Users(), "analysis": None, "news": None})()
    monkeypatch.setattr(db_client, "local", dummy)
    monkeypatch.setattr(user_service, "existing_username", lambda x: True)

    token = auth_mod.create_access_token(
        {"sub": orig["username"]},
        expires_delta=timedelta(minutes=auth_mod.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.patch(
            "/users/me",
            json={"username": "otrouser"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert res.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_get_all_users_admin_and_forbidden(monkeypatch):
    admin = {
        "_id": ObjectId(),
        "username": "admin",
        "email": "a@e.com",
        "created_at": datetime.now(timezone.utc),
        "role": "admin",
        "hashed_password": "",
    }
    sample_users = [
        {
            "_id": ObjectId(),
            "username": "u1",
            "email": "u1@e",
            "role": "user",
            "created_at": datetime.now(timezone.utc),
        },
        {
            "_id": ObjectId(),
            "username": "u2",
            "email": "u2@e",
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
        },
    ]

    class UsersAdmin:
        def find_one(self, q):
            return admin

        def find(self):
            return sample_users

    dummy1 = type("L", (), {"users": UsersAdmin(), "analysis": None, "news": None})()
    monkeypatch.setattr(db_client, "local", dummy1)
    token_admin = auth_mod.create_access_token(
        {"sub": admin["username"]},
        expires_delta=timedelta(minutes=auth_mod.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(
            "/users/admin", headers={"Authorization": f"Bearer {token_admin}"}
        )
    assert res.status_code == status.HTTP_200_OK
    arr = res.json()
    assert len(arr) == 2 and all("id" in u for u in arr)

    user = {**admin, "role": "user", "username": "norm"}

    class UsersNorm:
        def find_one(self, q):
            return user

    dummy2 = type("L", (), {"users": UsersNorm(), "analysis": None, "news": None})()
    monkeypatch.setattr(db_client, "local", dummy2)
    token_norm = auth_mod.create_access_token(
        {"sub": user["username"]},
        expires_delta=timedelta(minutes=auth_mod.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res2 = await ac.get(
            "/users/admin", headers={"Authorization": f"Bearer {token_norm}"}
        )
    assert res2.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
async def test_get_my_history(monkeypatch):
    u = {
        "_id": ObjectId(),
        "username": "hist",
        "email": "h@e.com",
        "created_at": datetime.now(timezone.utc),
        "role": "user",
        "hashed_password": "",
    }

    class Users:
        def find_one(self, q):
            return u

    class AnalysisColl:
        def find(self, q):
            return []

    dummy = type(
        "L", (), {"users": Users(), "analysis": AnalysisColl(), "news": None}
    )()
    monkeypatch.setattr(db_client, "local", dummy)
    monkeypatch.setattr(
        user_service, "get_user_history", lambda uid, s, so, p, l: [{"foo": "bar"}]
    )

    token = auth_mod.create_access_token(
        {"sub": u["username"]},
        expires_delta=timedelta(minutes=auth_mod.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(
            "/users/me/history?sort_by=date&sort_order=1&page=1&limit=5",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert res.status_code == status.HTTP_200_OK
    assert res.json() == [{"foo": "bar"}]
