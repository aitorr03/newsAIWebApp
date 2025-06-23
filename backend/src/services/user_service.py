from backend.src.client import db_client
from pydantic import EmailStr
from typing import List, Dict, Any
from backend.src.database.schemas.news_schema import news_schema
from backend.src.database.enums.user_enums import UserHistorySortOptions
from bson import ObjectId


def validate_username(username: str) -> str:
    if not (6 <= len(username) <= 12):
        raise ValueError("Username must be between 6 and 12 characters")
    if not all(c.isalnum() or c in "_-" for c in username):
        raise ValueError("Username can only contain letters, numbers, '_' and '-'")
    return username


def validate_password(password: str) -> str:
    if not (5 <= len(password) <= 15):
        raise ValueError("Password must be between 5 and 15 characters")
    if not any(c.islower() for c in password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one digit")
    return password


def existing_username(username: str) -> bool:
    return db_client.local.users.find_one({"username": username}) is not None


def existing_email(email: EmailStr) -> bool:
    return db_client.local.users.find_one({"email": email}) is not None


def get_user_history(
    searched_user_id: ObjectId,
    sort_by: str,
    sort_order: int,
    page: int,
    limit: int,
) -> List[Dict[str, Any]]:
    skip = (page - 1) * limit

    sort_field_map = {
        "date": "date_analyzed",
        "real_percentage": "real_percentage",
        "fake_percentage": "fake_percentage",
    }
    sort_field = sort_field_map.get(sort_by, "date_analyzed")
    analyses = list(
        db_client.local.analysis.find({"user_id": searched_user_id})
        .sort(sort_field, sort_order)
        .skip(skip)
        .limit(limit)
    )

    news_ids = [a["news_id"] for a in analyses if a.get("news_id")]

    news_cursor = db_client.local.news.find({"_id": {"$in": news_ids}})
    news_map = {n["_id"]: n for n in news_cursor}

    history = []
    for a in analyses:
        news = news_map.get(a["news_id"])
        history.append(
            {
                "analysis_id": str(a["_id"]),
                "date_analyzed": a["date_analyzed"],
                "result": a["result"],
                "news": news_schema(news) if news else None,
            }
        )
    return history
