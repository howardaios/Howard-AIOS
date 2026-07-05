from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4


class AIOSBaseModel(BaseModel):
    id: str = str(uuid4())
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
