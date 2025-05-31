from fastapi import FastAPI
from backend.src.routers import jwt_auth_users as jwt, news_router, stats_router
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
load_dotenv()


app.include_router(news_router.news_router)
app.include_router(jwt.auth_users)
app.include_router(jwt.router)

app.include_router(stats_router.stats_router)


@app.get("/")
async def saludar():
    return {"message": "¡Bienvenido!"}
