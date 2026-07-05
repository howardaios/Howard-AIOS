from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class InputData(BaseModel):
    source: str
    type: str
    title: str
    content: str

    company: Optional[str] = None
    project: Optional[str] = None

    tags: List[str] = []

    created_at: datetime = datetime.now()
