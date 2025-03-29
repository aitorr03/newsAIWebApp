import pydantic
from fastapi import APIRouter, HTTPException, status, Body
from backend.src.database.models.news import News, NewsCategory, get_news_category
from backend.src.database.schemas.news_schema import news_schema
from backend.src.client import db_client
from bson import ObjectId
from backend.src.services.huggingface_service import (
    generate_title,
    generate_summary,
    classify_news_type,
)
from urllib.parse import urlparse
from pydantic import AnyUrl, TypeAdapter

news_router = APIRouter(prefix="/news", tags=["News"])


@news_router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_news(url: str = Body(...), news: str = Body(...)):

    existing_news = db_client.local.news.find_one({"url": url})

    fake_probability = 0.1
    fake_result = "Fake"

    if existing_news:
        if fake_probability > existing_news["probability"]:
            update_data = {"result": fake_result, "probability": fake_probability}
        else:
            update_data = {}

        update_data["query_count"] = existing_news["query_count"] + 1

        db_client.local.news.update_one(
            {"_id": existing_news["_id"]}, {"$set": update_data}
        )

        return {
            "message": "News already exists, updated query count",
            "news_id": str(existing_news["_id"]),
            "query_count": update_data["query_count"],
        }

    title: str = generate_title(news)
    summary: str = generate_summary(news)
    category: NewsCategory = classify_news_type(news)

    source = urlparse(url).netloc

    adapter = TypeAdapter(AnyUrl)
    url_any = adapter.validate_python(url)

    news = News(
        title=title,
        summary=summary,
        category=category,
        url=url_any,
        source=source,
        result=fake_result,
        probability=fake_probability,
    )

    news_dict = news.model_dump(exclude={"id"})
    news_dict["url"] = url

    result = db_client.local.news.insert_one(news_dict)

    return {"message": "News created successfully", "news_id": str(result.inserted_id)}


@news_router.get("/{news_id}", response_model=dict)
async def get_news_by_id(news_id: str):

    news = db_client.local.news.find_one({"_id": ObjectId(news_id)})

    if not news:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="News not found"
        )

    return news_schema(news)


@news_router.delete("/{news_id}", response_model=dict)
async def delete_news(news_id: str):

    selected_news = db_client.local.news.delete_one({"_id": ObjectId(news_id)})

    if selected_news.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="News not found"
        )

    return {"message": "News deleted successfully"}


@news_router.patch("/{news_id}", response_model=dict)
async def patch_news(news_id: str, updated_fields: dict):

    result = db_client.local.news.update_one(
        {"_id": ObjectId(news_id)}, {"$set": updated_fields}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="News not found")

    return {"message": "News updated successfully"}
