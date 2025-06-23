from fastapi import APIRouter, status, Body, Depends, HTTPException
from bson import ObjectId
from backend.src.client import db_client
from backend.src.database.models.comment import Comment
from backend.src.routers.jwt_auth_users import get_current_user
from datetime import datetime, timezone
from typing import List
from fastapi import Query

comments_router = APIRouter(prefix="/comments", tags=["Comments"])


@comments_router.get(
    "/",
    response_model=List[Comment],
    summary="Listar comentarios de una noticia",
)
async def get_news_comments(
    news_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100, description="Comentarios por página"),
):
    try:
        nid = ObjectId(news_id)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "news_id inválido")

    skip = (page - 1) * limit
    cursor = (
        db_client.local.comments.find({"news_id": nid})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    comments = []
    for doc in cursor:
        comments.append(Comment.model_validate(doc))
    return comments


@comments_router.post("/", response_model=Comment, status_code=status.HTTP_201_CREATED)
async def create_comment(
    news_id: str = Body(...),
    text: str = Body(..., min_length=1, max_length=1000),
    current_user: dict = Depends(get_current_user),
):
    new_comment = {
        "news_id": ObjectId(news_id),
        "user_id": ObjectId(current_user["_id"]),
        "user_username": current_user["username"],
        "text": text,
        "created_at": datetime.now(timezone.utc),
    }
    created = db_client.local.comments.insert_one(new_comment)
    if not created.acknowledged:
        raise HTTPException(500, "Error creando comentario")

    created_doc = db_client.local.comments.find_one({"_id": created.inserted_id})
    return Comment.model_validate(created_doc)


@comments_router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user),
):
    comment_id = ObjectId(comment_id)
    comment = db_client.local.comments.find_one({"_id": comment_id})
    if not comment or str(comment["user_id"]) != current_user["_id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND)
    db_client.local.comments.delete_one({"_id": comment_id})


@comments_router.patch("/{comment_id}", response_model=Comment)
async def update_comment(
    comment_id: str,
    text: str = Body(..., min_length=1, max_length=1000),
    current_user: dict = Depends(get_current_user),
):
    comment_id = ObjectId(comment_id)
    comment = db_client.local.comments.find_one({"_id": comment_id})
    if not comment or str(comment["user_id"]) != current_user["_id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND)
    db_client.local.comments.update_one(
        {"_id": comment_id},
        {"$set": {"text": text, "edited_at": datetime.now(timezone.utc)}},
    )
    comment.update({"text": text, "edited_at": datetime.now(timezone.utc)})
    return {"_id": str(comment_id)}
