from fastapi import APIRouter, HTTPException, status, Body, Depends
from pydantic import AnyUrl

from backend.src.database.schemas.news_schema import news_schema
from backend.src.client import db_client
from bson import ObjectId
from backend.src.routers.jwt_auth_users import (
    get_current_user_optional,
)

from backend.src.services.news_manager_service import NewsManagerService

news_router = APIRouter(prefix="/news", tags=["News"])


@news_router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_news(
    url: AnyUrl = Body(...),
    news: str = Body(...),
    current_user: dict = Depends(get_current_user_optional),
):
    return NewsManagerService.create_or_update(str(url), news, current_user)


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
