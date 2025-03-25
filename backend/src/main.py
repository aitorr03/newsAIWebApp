from fastapi import FastAPI
from backend.src.routers import jwt_auth_users as jwt, news_router
from dotenv import load_dotenv
import os

app = FastAPI()
load_dotenv()


app.include_router(news_router.news_router)
app.include_router(jwt.auth_users)
app.include_router(jwt.router)


@app.get("/")
async def saludar():
    return {"message": "¡Bienvenido!"}
