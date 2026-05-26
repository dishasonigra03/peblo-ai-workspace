import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import relationship
from app.database import Base

def generate_ai_id():
    return f"AI_{uuid.uuid4().hex[:8].upper()}"

class AIGeneration(Base):
    __tablename__ = "ai_generations"

    id = Column(String, primary_key=True, default=generate_ai_id)
    note_id = Column(String, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False, index=True)
    summary = Column(String, nullable=False)
    action_items = Column(JSON, nullable=False)  # List of strings
    suggested_title = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    note = relationship("Note", back_populates="ai_generations")
