from backend.src.client import db_client
from backend.src.database.models.user import User
from backend.src.database.schemas.user_schema import user_schema
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr


def existing_username(username: str) -> bool:
    return db_client.local.users.find_one({"username": username}) is not None


def existing_email(email: EmailStr) -> bool:
    return db_client.local.users.find_one({"email": email}) is not None
