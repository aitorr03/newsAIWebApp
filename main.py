from fastapi import FastAPI
from routers import news_router
from routers import jwt_auth_users as jwt

app = FastAPI()

app.include_router(news_router.news_router)
app.include_router(jwt.auth_users)


@app.get("/")
async def saludar():
    return {"message": "¡Bienvenido!"}
