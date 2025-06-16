from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId


class Comment(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True, json_encoders={ObjectId: str}
    )
    text: str = Field(..., min_length=1, max_length=1000, description="Comment text")
    id: Optional[ObjectId] = Field(default=None, alias="_id")
    user_id: Optional[ObjectId] = Field(
        ..., description="ID of the user who wrote the comment"
    )
    news_id: ObjectId = Field(..., description="ID of the news article")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Date when the comment was created",
    )
    edited_at: Optional[datetime] = Field(
        default=None, description="Date when the comment was edited"
    )
