from fastapi import APIRouter
from backend.app.models.input import InputData

router = APIRouter()


@router.post("/inbox")
async def inbox(data: InputData):

    return {
        "message": "Input received",
        "source": data.source,
        "type": data.type,
        "title": data.title
    }
