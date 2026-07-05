from fastapi import FastAPI

from backend.app.api.health import router as health_router
from backend.app.api.inbox import router as inbox_router

app = FastAPI(
    title="Howard AIOS",
    version="0.1.0"
)

app.include_router(health_router)
app.include_router(inbox_router)


@app.get("/")
async def root():
    return {
        "name": "Howard AIOS",
        "version": "0.1.0",
        "status": "running"
    }
