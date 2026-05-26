import uuid
from sqlalchemy import Column, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

def generate_tag_id():
    return f"TAG_{uuid.uuid4().hex[:8].upper()}"

class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=generate_tag_id)
    name = Column(String, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="tags")
    notes = relationship("Note", secondary="note_tags", back_populates="tags")

    __table_args__ = (
        UniqueConstraint("name", "user_id", name="uq_tag_name_user_id"),
    )
