from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId


class Analysis(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: Optional[ObjectId] = Field(default=None, alias="_id")
    user_id: Optional[ObjectId] = Field(
        None, description="ID of the user who analyzed the news"
    )
    news_id: ObjectId = Field(..., description="ID of the news article")
    date_analyzed: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    result: str = Field(
        ...,
        pattern=r"^(Fake|Real)$",
        description="Analysis result (Fake or Real)",
    )
