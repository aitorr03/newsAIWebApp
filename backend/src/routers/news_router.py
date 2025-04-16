from fastapi import APIRouter, HTTPException, status, Body, Depends
from sympy.stats.rv import probability
from backend.src.database.models.analysis import Analysis
from backend.src.database.models.news import News
from backend.src.database.schemas.news_schema import news_schema
from backend.src.client import db_client
from bson import ObjectId
from urllib.parse import urlparse
from pydantic import AnyUrl, TypeAdapter
from backend.src.services.ollama_service import analyze_news
from backend.src.services.news_service import predict_fake_news
from backend.src.routers.jwt_auth_users import (
    get_current_user,
    get_current_user_optional,
)
from backend.src.database.models.user import User

news_router = APIRouter(prefix="/news", tags=["News"])


@news_router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_news(
    url: str = Body(...),
    news: str = Body(...),
    current_user: User = Depends(get_current_user_optional),
):

    existing_news = db_client.local.news.find_one({"url": url})

    analyzed_news = predict_fake_news(news)
    analysis_probability: float = analyzed_news["probability"]
    prediction: str = analyzed_news["prediction"]

    if existing_news:
        if analysis_probability > existing_news["probability"]:
            update_data = {"result": prediction, "probability": analysis_probability}
        else:
            update_data = {}

        update_data["query_count"] = existing_news["query_count"] + 1

        db_client.local.news.update_one(
            {"_id": existing_news["_id"]}, {"$set": update_data}
        )

        if current_user:
            analysis = Analysis(
                user_id=str(current_user["_id"]),
                news_id=str(existing_news["_id"]),
                result=prediction,
            )
            db_client.local.analysis.insert_one(analysis.model_dump(exclude={"id"}))
        return {
            "message": "News already exists, updated query count",
            "news_id": str(existing_news["_id"]),
            "query_count": update_data["query_count"],
        }

    generated_data: dict = analyze_news(news)

    source = urlparse(url).netloc

    adapter = TypeAdapter(AnyUrl)
    url_any = adapter.validate_python(url)

    news = News(
        title=generated_data["title"],
        summary=generated_data["summary"],
        primary_category=generated_data["primary_category"],
        secondary_category=generated_data.get("secondary_category"),
        url=url_any,
        source=source,
        result=prediction,
        probability=analysis_probability,
    )

    news_dict = news.model_dump(exclude={"id"})
    news_dict["url"] = url

    result = db_client.local.news.insert_one(news_dict)

    if current_user:
        analysis = Analysis(
            user_id=current_user["_id"], news_id=result.inserted_id, result=prediction
        )
        db_client.local.analysis.insert_one(analysis.model_dump(exclude={"id"}))

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
