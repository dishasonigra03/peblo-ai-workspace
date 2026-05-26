from pydantic import BaseModel
from app.schemas.notes import NoteResponse

class TagStats(BaseModel):
    name: str
    count: int

class ActivityStats(BaseModel):
    date: str  # format 'YYYY-MM-DD'
    count: int

class DashboardAnalytics(BaseModel):
    total_notes: int
    recently_edited: list[NoteResponse]
    most_used_tags: list[TagStats]
    ai_usage_count: int
    weekly_activity: list[ActivityStats]
