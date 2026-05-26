from datetime import datetime
from pydantic import BaseModel

class AIAnalysisResult(BaseModel):
    summary: str
    action_items: list[str]
    suggested_title: str

class AIGenerationResponse(BaseModel):
    id: str
    note_id: str
    summary: str
    action_items: list[str]
    suggested_title: str
    created_at: datetime

    class Config:
        from_attributes = True
