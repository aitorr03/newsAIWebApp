from fastapi import APIRouter, HTTPException, status
from src.database.models.news import News
from src.database.schemas.news_schema import news_schema
from src.client import db_client
from bson import ObjectId

news_router = APIRouter(prefix="/news", tags=["News"])


@news_router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_news(news: News):

    news_url = str(news.url) if news.url else None

    existing_news = db_client.local.news.find_one({"url": news_url})

    if existing_news:
        if news.probability > existing_news["probability"]:
            update_data = {
                "result": news.result,
                "probability": news.probability,
                "date_analyzed": news.date_analyzed,
            }
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

    news_dict = news.model_dump(exclude={"id"})
    news_dict["url"] = news_url

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
