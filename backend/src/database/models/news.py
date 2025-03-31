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
    opinion = "Opinión"
    environment = "Medio Ambiente"
    education = "Educación"


def get_news_category(category_name: str) -> NewsCategory:
    for category in NewsCategory:
        if category.value == category_name:
            return category
    raise ValueError(f"Unknown category name: {category_name}")


class News(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=10, max_length=125, description="News title")
    summary: str = Field(
        ..., min_length=100, max_length=500, description="News summary"
    )
    primary_category: NewsCategory = Field(..., description="Primary news category")
    secondary_category: Optional[NewsCategory] = Field(
        None, description="Secondary news category (optional)"
    )
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
