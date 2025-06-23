import pytest
from bson import ObjectId
from backend.src.services.news_manager_service import NewsManagerService

mock_user = {"_id": str(ObjectId()), "username": "testuser"}


@pytest.mark.asyncio
async def test_create_or_update_news_creates_new(monkeypatch):
    mock_url = "https://example.com/news"
    mock_text = "Noticia falsa sobre economía global."

    monkeypatch.setattr(
        "backend.src.services.news_manager_service.db_client.local.news.find_one",
        lambda f: None,
    )
    monkeypatch.setattr(
        "backend.src.services.news_manager_service.detect_language", lambda text: "es"
    )
    monkeypatch.setattr(
        "backend.src.services.news_manager_service.translate_to_english",
        lambda text: "Fake news about global economy.",
    )
    monkeypatch.setattr(
        "backend.src.services.news_manager_service.predict_fake_news",
        lambda text: {"prediction": "Fake", "probability": 0.87},
    )
    monkeypatch.setattr(
        "backend.src.services.news_manager_service.analyze_news",
        lambda text: {
            "title": "Crisis económica falsa",
            "summary": "Una noticia falsa sobre la economía ha circulado recientemente.",
            "primary_category": "Economía",
            "secondary_category": "Política",
        },
    )

    fake_inserted_id = ObjectId()
    monkeypatch.setattr(
        "backend.src.services.news_manager_service.db_client.local.news.insert_one",
        lambda doc: type(
            "InsertResult", (), {"acknowledged": True, "inserted_id": fake_inserted_id}
        )(),
    )
    monkeypatch.setattr(
        "backend.src.services.news_manager_service.db_client.local.news.find_one",
        lambda query: {
            "_id": fake_inserted_id,
            "title": "Crisis económica falsa",
            "summary": "Una noticia falsa sobre la economía ha circulado recientemente.",
            "primary_category": "Economía",
            "secondary_category": "Política",
            "url": mock_url,
            "source": "example.com",
            "result": "Fake",
            "probability": 0.87,
            "query_count": 1,
            "date_analyzed": "2025-01-01T00:00:00Z",
        },
    )
    monkeypatch.setattr(
        "backend.src.services.news_manager_service.db_client.local.analysis.insert_one",
        lambda doc: None,
    )

    result = NewsManagerService.create_or_update(mock_url, mock_text, mock_user)
    assert result["url"] == mock_url
    assert result["result"] == "Fake"
    assert result["primary_category"] == "Economía"
