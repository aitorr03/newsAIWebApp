from fastapi import APIRouter, HTTPException, status, Body

from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional
from enum import Enum
from datetime import datetime, timezone


class UserRole(str, Enum):
    admin = "admin"
    user = "user"


class RegisterUserRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("password")
    def check_password(cls, password):
        if not (6 <= len(password) <= 15):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be between 6 and 15 characters",
            )
        if not any(c.islower() for c in password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one lowercase letter",
            )
        if not any(c.isupper() for c in password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one uppercase letter",
            )
        if not any(c.isdigit() for c in password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one digit",
            )
        return password

    @field_validator("username")
    def check_username(cls, username):
        if not (6 <= len(username) <= 12):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be between 6 and 12 characters",
            )
        if not all(c.isalnum() or c in "_-" for c in username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username can only contain letters, numbers, '_' and '-'",
            )
        return username


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
