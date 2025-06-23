# tests/integration/test_news_router.py

import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import status
from bson import ObjectId

from backend.src.main import app
from backend.src.client import db_client
import backend.src.routers.news_router as news_router_module
import backend.src.services.news_manager_service as nm_service


@pytest.mark.asyncio
async def test_create_news_invokes_service(monkeypatch):
    # Stubeamos la lógica para no tocar la BDD
    monkeypatch.setattr(
        nm_service.NewsManagerService,
        "create_or_update",
        staticmethod(lambda url, body, user: {"foo": "bar"}),
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/news/",
            json={"url": "https://example.com/news", "news": "Fake news body..."},
        )
    assert res.status_code == status.HTTP_201_CREATED
    assert res.json() == {"foo": "bar"}


@pytest.mark.asyncio
async def test_get_news_by_id_success(monkeypatch):
    fake_id = str(ObjectId())
    fake_doc = {
        "_id": ObjectId(fake_id),
        "title": "T",
        "summary": "S",
        "primary_category": "Ciencia",
        "secondary_category": None,
        "url": None,
        "source": None,
        "date_analyzed": "2025-01-01T00:00:00Z",
        "result": "Real",
        "probability": 0.5,
        "query_count": 1,
    }

    # Stubeamos la llamada a Mongo y al schema
    class DummyColl:
        def find_one(self, q):
            return fake_doc

    monkeypatch.setattr(db_client, "local", type("L", (), {"news": DummyColl()})())
    monkeypatch.setattr(
        news_router_module,
        "news_schema",
        lambda doc: {"id": str(doc["_id"]), "title": doc["title"]},
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/news/{fake_id}")
    assert res.status_code == status.HTTP_200_OK
    assert res.json() == {"id": fake_id, "title": "T"}


@pytest.mark.asyncio
async def test_get_news_by_id_not_found(monkeypatch):
    class DummyColl:
        def find_one(self, q):
            return None

    monkeypatch.setattr(db_client, "local", type("L", (), {"news": DummyColl()})())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/news/{str(ObjectId())}")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()["detail"] == "News not found"


@pytest.mark.asyncio
async def test_delete_news_success(monkeypatch):
    class DummyColl:
        def delete_one(self, q):
            class R:
                deleted_count = 1

            return R()

    monkeypatch.setattr(db_client, "local", type("L", (), {"news": DummyColl()})())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.delete(f"/news/{str(ObjectId())}")
    assert res.status_code == status.HTTP_200_OK
    assert res.json() == {"message": "News deleted successfully"}


@pytest.mark.asyncio
async def test_delete_news_not_found(monkeypatch):
    class DummyColl:
        def delete_one(self, q):
            class R:
                deleted_count = 0

            return R()

    monkeypatch.setattr(db_client, "local", type("L", (), {"news": DummyColl()})())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.delete(f"/news/{str(ObjectId())}")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.json()["detail"] == "News not found"


@pytest.mark.asyncio
async def test_patch_news_success(monkeypatch):
    class DummyColl:
        def update_one(self, filt, data):
            class R:
                matched_count = 1

            return R()

    monkeypatch.setattr(db_client, "local", type("L", (), {"news": DummyColl()})())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.patch(
            f"/news/{str(ObjectId())}",
            json={"result": "Real", "probability": 0.9},
        )
    assert res.status_code == status.HTTP_200_OK
    assert res.json() == {"message": "News updated successfully"}


@pytest.mark.asyncio
async def test_patch_news_not_found(monkeypatch):
    class DummyColl:
        def update_one(self, filt, data):
            class R:
                matched_count = 0

            return R()

    monkeypatch.setattr(db_client, "local", type("L", (), {"news": DummyColl()})())

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.patch(
            f"/news/{str(ObjectId())}",
            json={"result": "Real"},
        )
    assert res.status_code == status.HTTP_404_NOT_FOUND
    assert res.json()["detail"] == "News not found"
