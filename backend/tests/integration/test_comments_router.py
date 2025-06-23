import pytest
from httpx import AsyncClient, ASGITransport
from bson import ObjectId
from fastapi import status
from backend.src.main import app
from backend.src.routers import comments_router

mock_user = {"_id": str(ObjectId()), "username": "testuser"}


@pytest.mark.asyncio
async def test_get_comments(monkeypatch):
    mock_comment = {
        "_id": ObjectId(),
        "text": "Comentario de prueba",
        "user_id": ObjectId(),
        "user_username": "testuser",
        "news_id": ObjectId(),
        "created_at": "2025-01-01T00:00:00Z",
        "edited_at": None,
    }

    monkeypatch.setattr(
        "backend.src.routers.comments_router.db_client.local.comments.find",
        lambda f: iter([mock_comment]),
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get(
            "/comments/?news_id=000000000000000000000000&page=1&limit=1"
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_comment(monkeypatch):
    inserted_id = ObjectId()

    def mock_insert(comment):
        return type(
            "InsertResult", (), {"acknowledged": True, "inserted_id": inserted_id}
        )()

    def mock_find_one(query):
        return {
            "_id": query["_id"],
            "text": "Nuevo comentario",
            "user_id": mock_user["_id"],  # como str
            "user_username": mock_user["username"],
            "news_id": ObjectId(),
            "created_at": "2025-01-01T00:00:00Z",
            "edited_at": None,
        }

    monkeypatch.setattr(
        "backend.src.routers.comments_router.db_client.local.comments.insert_one",
        mock_insert,
    )
    monkeypatch.setattr(
        "backend.src.routers.comments_router.db_client.local.comments.find_one",
        mock_find_one,
    )
    app.dependency_overrides[comments_router.get_current_user] = lambda: mock_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/comments/", json={"news_id": str(ObjectId()), "text": "Nuevo comentario"}
        )
        assert resp.status_code == 201
        assert resp.json()["text"] == "Nuevo comentario"

    app.dependency_overrides = {}
