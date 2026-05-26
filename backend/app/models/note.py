import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Table
from sqlalchemy.orm import relationship
from app.database import Base

def generate_note_id():
    return f"NOTE_{uuid.uuid4().hex[:8].upper()}"

def generate_share_id():
    return uuid.uuid4().hex

# Junction table note_tags
note_tags = Table(
    "note_tags",
    Base.metadata,
    Column("note_id", String, ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)

class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True, default=generate_note_id)
    title = Column(String, default="Untitled Note", nullable=False)
    content = Column(String, default="", nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False, index=True)
    is_pinned = Column(Boolean, default=False, nullable=False, index=True)
    is_public = Column(Boolean, default=False, nullable=False, index=True)
    share_id = Column(String, unique=True, index=True, default=generate_share_id, nullable=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="notes")
    tags = relationship("Tag", secondary=note_tags, back_populates="notes")
    ai_generations = relationship("AIGeneration", back_populates="note", cascade="all, delete-orphan")
