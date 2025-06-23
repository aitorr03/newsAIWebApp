import pytest
from httpx import AsyncClient
from httpx import ASGITransport
from bson import ObjectId
from backend.src.main import app
from backend.src.routers import news_router

mock_user = {
    "_id": str(ObjectId()),
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "created_at": "2025-01-01T00:00:00Z",
}


@pytest.mark.asyncio
async def test_create_news(monkeypatch):
    monkeypatch.setattr(
        "backend.src.routers.news_router.NewsManagerService.create_or_update",
        lambda url, news, user: {"result": "Fake", "probability": 0.88},
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/news/",
            json={"url": "https://example.com/news", "news": "Fake news body..."},
        )
        assert response.status_code == 201
        assert response.json()["result"] == "Fake"
