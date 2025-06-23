from fastapi import HTTPException, status
from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import Optional
from enum import Enum
from datetime import datetime, timezone
from backend.src.services.user_service import validate_password, validate_username
from bson import ObjectId


class UserRole(str, Enum):
    admin = "admin"
    user = "user"


class User(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: Optional[ObjectId] = Field(default=None, alias="_id")
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


class RegisterUserRequest(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(..., min_length=5, max_length=15)

    @field_validator("username")
    def check_username(cls, username):
        try:
            return validate_username(username)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @field_validator("password")
    def check_password(cls, password):
        try:
            return validate_password(password)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


class UpdateUserRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

    @field_validator("username")
    def check_username(cls, username):
        if username is None:
            return username
        try:
            return validate_username(username)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @field_validator("password")
    def check_password(cls, password):
        if password is None:
            return password
        try:
            return validate_password(password)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
