from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "Howard AIOS",
        "version": "0.1.0"
    }
