# tests/unit/test_user_service.py
import pytest
from bson import ObjectId
from backend.src.services import user_service


# Datos de ejemplo
mock_user_id = ObjectId("64b7f57e5f4c2a6f9d1e2b3c")
mock_analysis_doc = {
    "_id": ObjectId("64b7f57e5f4c2a6f9d1e2b3d"),
    "user_id": mock_user_id,
    "news_id": ObjectId("64b7f57e5f4c2a6f9d1e2b3e"),
    "date_analyzed": "2025-01-01T00:00:00Z",
    "result": "Fake",
}
mock_news_doc = {
    "_id": mock_analysis_doc["news_id"],
    "title": "Noticia de ejemplo",
    "summary": "Resumen largo " * 10,
    "primary_category": "Ciencia",
    "secondary_category": None,
    "url": None,
    "source": None,
    "date_analyzed": "2025-01-01T00:00:00Z",
    "result": "Fake",
    "probability": 0.42,
    "query_count": 1,
}


class FakeCursor:
    def __init__(self, docs):
        self._docs = docs
        self._ops = {}

    def sort(self, field, order):
        self._ops["sort"] = (field, order)
        return self

    def skip(self, n):
        self._ops["skip"] = n
        return self

    def limit(self, n):
        self._ops["limit"] = n
        return self

    def __iter__(self):
        return iter(self._docs)


@pytest.mark.parametrize("username", ["user_1", "johnDoe-12"])
def test_validate_username_valid(username):
    assert user_service.validate_username(username) == username


@pytest.mark.parametrize(
    "username", ["us", "this_is_way_too_long_username", "invalid@name"]
)
def test_validate_username_invalid(username):
    with pytest.raises(ValueError):
        user_service.validate_username(username)


@pytest.mark.parametrize("password", ["Abc123", "ZxY987654"])
def test_validate_password_valid(password):
    assert user_service.validate_password(password) == password


@pytest.mark.parametrize("password", ["abc", "123456", "ONLYUPPER", "onlylower"])
def test_validate_password_invalid(password):
    with pytest.raises(ValueError):
        user_service.validate_password(password)


def make_dummy_local(users_find_one=None, analysis_cursor=None, news_list=None):
    class UsersColl:
        def find_one(self, q):
            return users_find_one

    class AnalysisColl:
        def find(self, q):
            return analysis_cursor

    class NewsColl:
        def find(self, q):
            return news_list or []

    # objeto que sustituye a db_client.local
    return type(
        "L", (), {"users": UsersColl(), "analysis": AnalysisColl(), "news": NewsColl()}
    )()


def test_existing_username_true(monkeypatch):
    dummy = make_dummy_local(users_find_one={"_id": ObjectId()})
    monkeypatch.setattr(user_service.db_client, "local", dummy)
    assert user_service.existing_username("cualquiera") is True


def test_existing_username_false(monkeypatch):
    dummy = make_dummy_local(users_find_one=None)
    monkeypatch.setattr(user_service.db_client, "local", dummy)
    assert user_service.existing_username("cualquiera") is False


def test_existing_email_true(monkeypatch):
    dummy = make_dummy_local(users_find_one={"_id": ObjectId()})
    monkeypatch.setattr(user_service.db_client, "local", dummy)
    assert user_service.existing_email("u@e.com") is True


def test_existing_email_false(monkeypatch):
    dummy = make_dummy_local(users_find_one=None)
    monkeypatch.setattr(user_service.db_client, "local", dummy)
    assert user_service.existing_email("u@e.com") is False


@pytest.mark.parametrize(
    "sort_by, expected_field",
    [
        ("date", "date_analyzed"),
        ("real_percentage", "real_percentage"),
        ("fake_percentage", "fake_percentage"),
        ("algo_ignorado", "date_analyzed"),
    ],
)
def test_get_user_history_with_news(monkeypatch, sort_by, expected_field):
    fake_cursor = FakeCursor([mock_analysis_doc])
    dummy = make_dummy_local(analysis_cursor=fake_cursor, news_list=[mock_news_doc])
    monkeypatch.setattr(user_service.db_client, "local", dummy)
    # stub de news_schema
    monkeypatch.setattr(
        user_service,
        "news_schema",
        lambda news: {"id": str(news["_id"]), "title": news["title"]},
    )

    history = user_service.get_user_history(
        searched_user_id=mock_user_id,
        sort_by=sort_by,
        sort_order=-1,
        page=2,
        limit=5,
    )
    # Debe llevar un elemento
    assert isinstance(history, list) and len(history) == 1
    # Comprobamos campos
    entry = history[0]
    assert entry["analysis_id"] == str(mock_analysis_doc["_id"])
    assert entry["date_analyzed"] == mock_analysis_doc["date_analyzed"]
    assert entry["result"] == mock_analysis_doc["result"]
    assert entry["news"] == {
        "id": str(mock_news_doc["_id"]),
        "title": mock_news_doc["title"],
    }
    # Operaciones de cursor
    assert fake_cursor._ops["sort"][0] == expected_field
    assert fake_cursor._ops["skip"] == (2 - 1) * 5
    assert fake_cursor._ops["limit"] == 5


def test_get_user_history_without_news(monkeypatch):
    fake_cursor = FakeCursor([mock_analysis_doc])
    dummy = make_dummy_local(analysis_cursor=fake_cursor, news_list=[])
    monkeypatch.setattr(user_service.db_client, "local", dummy)

    history = user_service.get_user_history(
        searched_user_id=mock_user_id,
        sort_by="date",
        sort_order=1,
        page=1,
        limit=1,
    )
    assert len(history) == 1
    assert history[0]["news"] is None
