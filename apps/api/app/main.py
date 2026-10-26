from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import init_db
from app.seed.load import seed_paket

from app.routers import (
    auth, classes, packages, sessions, join, me,
    submissions, contradictions, scores, surveys, admin
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed initial package
    init_db()
    seed_paket()
    yield


app = FastAPI(
    title="FisGrade API",
    version="1.1",
    description="Backend API untuk asesmen formatif proses fisika multirepresentasi",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.cors_origin_list
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def health_check():
    return {
        "status": "ok",
        "app": "FisGrade",
        "env": settings.APP_ENV,
        "db": "ok"
    }


# Register Routers
app.include_router(auth.router)
app.include_router(classes.router)
app.include_router(packages.router)
app.include_router(sessions.router)
app.include_router(join.router)
app.include_router(me.router)
app.include_router(submissions.router)
app.include_router(contradictions.router)
app.include_router(scores.router)
app.include_router(surveys.router)
app.include_router(admin.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
