from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.tags import TagResponse

class NoteCreate(BaseModel):
    title: str = Field(default="Untitled Note", max_length=150)
    content: str = Field(default="")
    tags: list[str] = Field(default_factory=list)

class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=150)
    content: str | None = Field(default=None)
    is_archived: bool | None = None
    is_pinned: bool | None = None
    is_public: bool | None = None
    tags: list[str] | None = None

class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    is_archived: bool
    is_pinned: bool
    is_public: bool
    share_id: str | None
    user_id: str
    created_at: datetime
    updated_at: datetime
    tags: list[TagResponse] = []

    class Config:
        from_attributes = True
