from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone


class Analysis(BaseModel):
    id: Optional[str] = None
    user_id: str = Field(..., description="ID of the user who analyzed the news")
    news_id: str = Field(..., description="ID of the news article")
    date_analyzed: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    result: str = Field(
        ...,
        pattern=r"^(Fake|Real)$",
        description="Analysis result (Fake or Real)",
    )
