import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import status, HTTPException
from bson import ObjectId
from datetime import datetime, timezone

from backend.src.main import app
from backend.src.client import db_client
from backend.src.routers.comments_router import get_current_user


@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_news_comments_success(monkeypatch):
    fake_comment = {
        "_id": ObjectId(),
        "news_id": ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa"),
        "user_id": ObjectId("bbbbbbbbbbbbbbbbbbbbbbbb"),
        "user_username": "alice",
        "text": "¡Hola mundo!",
        "created_at": datetime(2025, 1, 1, tzinfo=timezone.utc),
        "edited_at": None,
    }

    class FakeCursor:
        def __init__(self, docs):
            self._docs = docs

        def sort(self, field, order):
            assert field == "created_at" and order == -1
            return self

        def skip(self, n):
            assert n == 0
            return self

        def limit(self, n):
            assert n == 10
            return self

        def __iter__(self):
            return iter(self._docs)

    dummy_local = type(
        "L",
        (),
        {
            "comments": type(
                "C", (), {"find": lambda self, q: FakeCursor([fake_comment])}
            )()
        },
    )()
    monkeypatch.setattr(db_client, "local", dummy_local)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(
            "/comments/?news_id=aaaaaaaaaaaaaaaaaaaaaaaa&page=1&limit=10"
        )

    assert res.status_code == status.HTTP_200_OK
    body = res.json()
    assert isinstance(body, list) and len(body) == 1
    comment = body[0]
    assert comment["text"] == fake_comment["text"]
    assert comment["user_username"] == fake_comment["user_username"]


@pytest.mark.asyncio
async def test_get_news_comments_invalid_id():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/comments/?news_id=notanobjectid")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "news_id inválido" in res.text


@pytest.mark.asyncio
async def test_create_comment_success(monkeypatch):
    mock_user = {"_id": str(ObjectId()), "username": "bob"}
    app.dependency_overrides[get_current_user] = lambda: mock_user

    new_doc_id = ObjectId()

    class CommentsColl:
        def insert_one(self, doc):
            assert doc["text"] == "Hola"
            assert isinstance(doc["created_at"], datetime)

            class R:
                acknowledged = True
                inserted_id = new_doc_id

            return R()

        def find_one(self, q):
            assert q["_id"] == new_doc_id
            return {
                "_id": new_doc_id,
                "news_id": ObjectId("cccccccccccccccccccccccc"),
                "user_id": ObjectId(mock_user["_id"]),
                "user_username": mock_user["username"],
                "text": "Hola",
                "created_at": datetime(2025, 1, 1, tzinfo=timezone.utc),
                "edited_at": None,
            }

    dummy_local = type("L", (), {"comments": CommentsColl()})()
    monkeypatch.setattr(db_client, "local", dummy_local)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/comments/", json={"news_id": "cccccccccccccccccccccccc", "text": "Hola"}
        )

    assert res.status_code == status.HTTP_201_CREATED
    j = res.json()
    assert j["text"] == "Hola"
    assert j["user_username"] == "bob"
    assert j["_id"] == str(new_doc_id)


@pytest.mark.asyncio
async def test_create_comment_db_error(monkeypatch):
    mock_user = {"_id": str(ObjectId()), "username": "bob"}
    app.dependency_overrides[get_current_user] = lambda: mock_user

    class CommentsColl:
        def insert_one(self, doc):
            class R:
                acknowledged = False
                inserted_id = None

            return R()

    dummy_local = type("L", (), {"comments": CommentsColl()})()
    monkeypatch.setattr(db_client, "local", dummy_local)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/comments/", json={"news_id": str(ObjectId()), "text": "X"}
        )

    assert res.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


@pytest.mark.asyncio
async def test_delete_comment_success(monkeypatch):
    user_id = ObjectId()
    mock_user = {"_id": str(user_id), "username": "charlie"}
    app.dependency_overrides[get_current_user] = lambda: mock_user

    class CommentsColl:
        def find_one(self, q):
            return {"_id": q["_id"], "user_id": user_id}

        def delete_one(self, q):
            class R:
                deleted_count = 1

            return R()

    dummy_local = type("L", (), {"comments": CommentsColl()})()
    monkeypatch.setattr(db_client, "local", dummy_local)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.delete(f"/comments/{str(ObjectId())}")

    assert res.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.asyncio
async def test_delete_comment_not_found_or_forbidden(monkeypatch):
    mock_user = {"_id": str(ObjectId()), "username": "dave"}
    app.dependency_overrides[get_current_user] = lambda: mock_user

    class CommentsColl:
        def find_one(self, q):
            return None

    dummy_local = type("L", (), {"comments": CommentsColl()})()
    monkeypatch.setattr(db_client, "local", dummy_local)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.delete(f"/comments/{str(ObjectId())}")

    assert res.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_update_comment_success(monkeypatch):
    user_id = ObjectId()
    mock_user = {"_id": str(user_id), "username": "ellen"}
    app.dependency_overrides[get_current_user] = lambda: mock_user

    class CommentsColl:
        def find_one(self, q):
            return {
                "_id": q["_id"],
                "user_id": user_id,
                "text": "viejo",
                "user_username": "ellen",
                "news_id": ObjectId(),
                "created_at": datetime.now(timezone.utc),
                "edited_at": None,
            }

        def update_one(self, filt, data):
            assert "text" in data["$set"] and "edited_at" in data["$set"]

            class R:
                matched_count = 1

            return R()

    dummy_local = type("L", (), {"comments": CommentsColl()})()
    monkeypatch.setattr(db_client, "local", dummy_local)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.patch(
            f"/comments/{str(ObjectId())}", json={"text": "nuevo texto"}
        )

    assert res.status_code == status.HTTP_200_OK
    assert "_id" in res.json()


@pytest.mark.asyncio
async def test_update_comment_not_found_or_forbidden(monkeypatch):
    mock_user = {"_id": str(ObjectId()), "username": "frank"}
    app.dependency_overrides[get_current_user] = lambda: mock_user

    class CommentsColl:
        def find_one(self, q):
            # comentario de otro usuario
            return {
                "_id": q["_id"],
                "user_id": ObjectId(),
                "text": "",
                "created_at": datetime.now(timezone.utc),
            }

    dummy_local = type("L", (), {"comments": CommentsColl()})()
    monkeypatch.setattr(db_client, "local", dummy_local)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.patch(f"/comments/{str(ObjectId())}", json={"text": "oops"})

    assert res.status_code == status.HTTP_404_NOT_FOUND
