import os
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from backend.src.client import db_client
from backend.src.database.models.user import User
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from backend.src.database.models.user import UserRole
from dotenv import load_dotenv
from pathlib import Path

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10
router = APIRouter()

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

SECRET_KEY = os.getenv("SECRET_KEY")
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


async def is_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.admin.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden, user is not admin",
        )
    return current_user


@auth_users.post("/register", response_model=dict)
async def register_user(user: User):

    if db_client.local.users.find_one({"username": user.username}):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Username already exists"
        )

    if db_client.local.users.find_one({"email": user.email}):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    hashed_password = crypt.hash(user.hashed_password)
    user_dict = user.model_dump(exclude={"id"})
    user_dict["hashed_password"] = hashed_password

    result = db_client.local.users.insert_one(user_dict)

    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id),
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at,
    }


@auth_users.post("/login", response_model=dict)
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    user = db_client.local.users.find_one({"username": form_data.username})

    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid credentials")

    if not crypt.verify(form_data.password, user["hashed_password"]):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@auth_users.get("/me", response_model=dict)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        "created_at": current_user["created_at"],
    }


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
