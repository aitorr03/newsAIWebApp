import pytest
from bson import ObjectId
from backend.src.services import user_service

mock_user_id = ObjectId()
mock_analysis_sample = [
    {
        "_id": ObjectId(),
        "user_id": mock_user_id,
        "news_id": ObjectId(),
        "date_analyzed": "2025-01-01T00:00:00Z",
        "result": "Fake",
    }
]
mock_news_sample = [
    {
        "_id": mock_analysis_sample[0]["news_id"],
        "title": "Noticia falsa",
        "result": "Fake",
    }
]


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
