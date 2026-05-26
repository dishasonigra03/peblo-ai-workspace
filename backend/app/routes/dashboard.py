from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.ai import AIGeneration
from app.models.note import Note, note_tags
from app.models.tag import Tag
from app.models.user import User
from app.schemas.dashboard import ActivityStats, DashboardAnalytics, TagStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard Analytics"])

@router.get("/analytics", response_model=DashboardAnalytics)
def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Total notes count
    total_notes = db.query(Note).filter(Note.user_id == current_user.id).count()
    
    # 2. Recently edited notes (limit 5)
    recently_edited = db.query(Note).filter(
        Note.user_id == current_user.id
    ).order_by(Note.updated_at.desc()).limit(5).all()
    
    # 3. Most used tags (limit 5)
    tag_counts = db.query(
        Tag.name,
        func.count(note_tags.c.note_id).label("count")
    ).join(note_tags).join(Note).filter(
        Note.user_id == current_user.id
    ).group_by(Tag.name).order_by(text("count DESC")).limit(5).all()
    
    most_used_tags = [TagStats(name=name, count=count) for name, count in tag_counts]
    
    # 4. AI usage count (number of generations linked to user notes)
    ai_usage_count = db.query(AIGeneration).join(Note).filter(
        Note.user_id == current_user.id
    ).count()
    
    # 5. Weekly activity summary (last 7 days note changes)
    weekly_activity = []
    today = datetime.now(timezone.utc).date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        
        # Calculate day start & end times
        start_datetime = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
        end_datetime = datetime.combine(day, datetime.max.time(), tzinfo=timezone.utc)
        
        count = db.query(Note).filter(
            Note.user_id == current_user.id,
            Note.updated_at >= start_datetime,
            Note.updated_at <= end_datetime
        ).count()
        
        weekly_activity.append(ActivityStats(date=day_str, count=count))
        
    return DashboardAnalytics(
        total_notes=total_notes,
        recently_edited=recently_edited,
        most_used_tags=most_used_tags,
        ai_usage_count=ai_usage_count,
        weekly_activity=weekly_activity
    )
