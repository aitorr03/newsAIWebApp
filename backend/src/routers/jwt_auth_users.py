import os
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.params import Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from pydantic import AnyUrl, TypeAdapter
from backend.src.client import db_client
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import backend.src.database.models.user as user_class
from dotenv import load_dotenv
from pathlib import Path
import backend.src.services.user_service as user_service
from backend.src.database.schemas.user_schema import user_schema
from typing import Optional, List, Dict, Any
from backend.src.database.enums.user_enums import UserHistorySortOptions
from bson import ObjectId
from fastapi import Request, Query

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

SECRET_KEY = os.getenv("SECRET_KEY") or "testsecret"
oauth2 = OAuth2PasswordBearer(tokenUrl="login")

crypt = CryptContext(schemes=["bcrypt"], deprecated="auto")

auth_users = APIRouter(prefix="/users", tags=["Auth Users"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def create_access_token(data: dict, expires_delta: timedelta):
    if SECRET_KEY is None:
        raise Exception("Environment variables not loaded correctly")
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    if SECRET_KEY is None:
        raise Exception("Environment variables not loaded correctly")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user = db_client.local.users.find_one({"username": username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return user


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[dict]:
    # Si no llega token, devolvemos None y dejamos que el endpoint lo interprete
    if not token:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            return None
        return db_client.local.users.find_one({"username": username})
    except JWTError:
        # Token inválido o expirado → devolvemos None
        return None


async def is_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != user_class.UserRole.admin.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden, user is not admin",
        )
    return current_user


@auth_users.post("/register", response_model=dict)
async def register_user(user: user_class.RegisterUserRequest):

    if user_service.existing_email(user.email):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Username already exists"
        )

    if user_service.existing_username(user.username):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    hashed_password = crypt.hash(user.password)

    new_user = user_class.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user_class.UserRole.user.value,
        disabled=False,
    )

    user_dict = new_user.model_dump(exclude={"id"})
    result = db_client.local.users.insert_one(user_dict)

    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id),
        "username": new_user.username,
        "email": new_user.email,
        "created_at": new_user.created_at,
    }


@auth_users.post("/login", response_model=dict)
async def login_user(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    # 1) intenta leer JSON
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    username = body.get("username") or form_data.username
    password = body.get("password") or form_data.password

    user = db_client.local.users.find_one({"username": username})
    if not user or not crypt.verify(password, user["hashed_password"]):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@auth_users.get("/me", response_model=dict)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    return user_schema(current_user)


@auth_users.patch("/me", response_model=dict)
async def update_user(
    new_fields: user_class.UpdateUserRequest,
    current_user: dict = Depends(get_current_user),
):
    new_data = new_fields.model_dump(exclude_none=True)

    if "username" in new_data and new_data["username"] != current_user["username"]:
        if user_service.existing_username(new_data["username"]):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, detail="Username already exists"
            )

    if "email" in new_data and new_data["email"] != current_user["email"]:
        if user_service.existing_email(new_data["email"]):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, detail="Email already exists"
            )

    if "password" in new_data:
        hashed_new = crypt.hash(new_data["password"])
        if hashed_new == current_user["hashed_password"]:
            new_data.pop("password", None)
        else:
            new_data["hashed_password"] = hashed_new
            new_data.pop("password", None)

    db_client.local.users.update_one({"_id": current_user["_id"]}, {"$set": new_data})
    return {"message": "User updated successfully"}


@auth_users.get("/admin", response_model=list)
async def get_all_users(admin_user: dict = Depends(is_admin_user)):
    users = db_client.local.users.find()
    return [
        {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"],
        }
        for user in users
    ]


# Obtener historial de noticias analizadas por el usuario
@auth_users.get("/me/history", response_model=List[Dict[str, Any]])
async def get_my_history(
    sort_by: UserHistorySortOptions = Query(UserHistorySortOptions.date),
    sort_order: int = Query(-1, ge=-1, le=1),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1),
    current_user: dict = Depends(get_current_user),
):
    searched_user_id = current_user["_id"]
    if isinstance(searched_user_id, str):
        searched_user_id = ObjectId(searched_user_id)

    history = user_service.get_user_history(
        searched_user_id, sort_by, sort_order, page, limit
    )
    print(list(db_client.local.analysis.find({"user_id": searched_user_id})))
    return history
