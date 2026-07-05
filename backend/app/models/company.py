from backend.app.models.base import AIOSBaseModel


class Company(AIOSBaseModel):
    name: str
    short_name: str | None = None
    industry: str | None = None
    description: str | None = None
