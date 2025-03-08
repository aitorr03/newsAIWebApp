from pydantic import BaseModel, Field, AnyUrl
from typing import Optional
from enum import Enum
from datetime import datetime, timezone


class NewsCategory(str, Enum):
    politics = "Política"
    economy = "Economía"
    sports = "Deportes"
    technology = "Tecnología"
    science = "Ciencia"
    health = "Salud"
    culture = "Cultura y Entretenimiento"
    international = "Internacional"
    events = "Sucesos"
    opinion = "Opinión"


class News(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=2, max_length=50, description="News title")
    summary: str = Field(..., min_length=15, max_length=250, description="News summary")
    category: NewsCategory
    url: Optional[AnyUrl] = Field(None, description="News URL")
    source: Optional[str] = Field(
        None, max_length=100, description="Source of the news"
    )
    date_analyzed: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    result: str = Field(
        ...,
        pattern=r"^(Fake|Real)$",
        description="Analysis result (Fake or Real)",
    )
    probability: float = Field(
        ..., ge=0.0, le=1.0, description="Probability of success"
    )
    query_count: int = Field(
        default=1, ge=1, description="Number of times the news was queried"
    )