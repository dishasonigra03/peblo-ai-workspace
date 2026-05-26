from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.note import Note
from app.schemas.notes import NoteResponse

router = APIRouter(prefix="/shared", tags=["Public Sharing"])

@router.get("/{shareId}", response_model=NoteResponse)
def get_shared_note(shareId: str, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.share_id == shareId).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared note not found."
        )
        
    # Enforce note privacy check
    if not note.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This note has been marked private by the owner."
        )
        
    return note
