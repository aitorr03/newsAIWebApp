from fastapi import APIRouter, Query, HTTPException, status
from typing import List, Dict, Any, Optional
from pymongo import DESCENDING
from backend.src.client import db_client
from bson import ObjectId

stats_router = APIRouter(prefix="/stats", tags=["Stats"])


def objectid_to_str(obj):
    if isinstance(obj, dict):
        return {k: objectid_to_str(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [objectid_to_str(x) for x in obj]
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj


@stats_router.get("/news", response_model=List[Dict[str, Any]])
async def get_news_stats(
    sort_by: str = Query("query_count"),
    sort_order: int = Query(-1, ge=-1, le=1),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1),
    primary_category: Optional[str] = Query(
        None, description="Filtrar por categoría principal"
    ),
    result: Optional[str] = Query(
        None, description="Filtrar por resultado ('Real' o 'Fake')"
    ),
):
    allowed_sort_keys = ["query_count", "date_analyzed", "probability", "result"]
    if sort_by not in allowed_sort_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"sort_by must be one of {allowed_sort_keys}",
        )

    query = {}
    if primary_category:
        query["primary_category"] = primary_category
    if result:
        if result not in ["Real", "Fake"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="result must be 'Real' or 'Fake'",
            )
        query["result"] = result

    skip = (page - 1) * limit

    cursor = (
        db_client.local.news.find(query)
        .sort(sort_by, sort_order)
        .skip(skip)
        .limit(limit)
    )
    news_list = [objectid_to_str(news) for news in cursor]

    return news_list
