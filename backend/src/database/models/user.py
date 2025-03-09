from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime, timezone


class UserRole(str, Enum):
    admin = "admin"
    user = "user"


class User(BaseModel):
    id: Optional[str] = None
    username: str = Field(
        ...,
        min_length=6,
        max_length=12,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Valid username",
    )
    email: EmailStr = Field(..., description="Valid email")
    hashed_password: str = Field(..., description="Valid hashed password")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    role: UserRole = UserRole.user
    disabled: bool = False
