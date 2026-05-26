from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.ai import AIGeneration
from app.models.note import Note
from app.models.tag import Tag
from app.models.user import User
from app.schemas.ai import AIGenerationResponse
from app.schemas.notes import NoteCreate, NoteResponse, NoteUpdate
from app.services.gemini import gemini_service

router = APIRouter(prefix="/notes", tags=["Notes Workspace"])

def sync_note_tags(note: Note, tag_names: list[str] | None, db: Session, user_id: str):
    """Utility to resolve string tag names into DB Tag records and associate them with a note."""
    if tag_names is None:
        return
    
    # Normalize tag names to lowercase and remove spaces
    cleaned_names = list(set([name.strip().lower() for name in tag_names if name.strip()]))
    
    # Lookup tags already defined by this user
    existing_tags = db.query(Tag).filter(Tag.user_id == user_id, Tag.name.in_(cleaned_names)).all()
    existing_map = {t.name: t for t in existing_tags}
    
    resolved_tags = []
    for name in cleaned_names:
        if name in existing_map:
            resolved_tags.append(existing_map[name])
        else:
            new_tag = Tag(name=name, user_id=user_id)
            db.add(new_tag)
            resolved_tags.append(new_tag)
            
    note.tags = resolved_tags

@router.get("", response_model=list[NoteResponse])
def get_notes(
    search: str | None = None,
    tag: str | None = None,
    is_archived: bool | None = False,
    is_pinned: bool | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Note).filter(Note.user_id == current_user.id)
    
    # Filter archive status
    if is_archived is not None:
        query = query.filter(Note.is_archived == is_archived)
        
    # Filter pin status
    if is_pinned is not None:
        query = query.filter(Note.is_pinned == is_pinned)
        
    # Search keyword
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Note.title.ilike(search_filter),
                Note.content.ilike(search_filter)
            )
        )
        
    # Filter by specific tag
    if tag:
        tag_lower = tag.strip().lower()
        query = query.join(Note.tags).filter(Tag.name == tag_lower)
        
    # Sorting: Pinned first, then sorted by updated_at descending
    notes = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc()).all()
    return notes

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_note = Note(
        title=payload.title,
        content=payload.content,
        user_id=current_user.id
    )
    db.add(new_note)
    # Sync associated tags
    sync_note_tags(new_note, payload.tags, db, current_user.id)
    
    db.commit()
    db.refresh(new_note)
    return new_note

@router.get("/{id}", response_model=NoteResponse)
def get_note(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found."
        )
    return note

@router.patch("/{id}", response_model=NoteResponse)
def update_note(id: str, payload: NoteUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found."
        )
        
    update_data = payload.model_dump(exclude_unset=True)
    
    # Handle tags separately
    if "tags" in update_data:
        sync_note_tags(note, update_data.pop("tags"), db, current_user.id)
        
    # Apply other fields
    for field, value in update_data.items():
        setattr(note, field, value)
        
    note.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(note)
    return note

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found."
        )
    db.delete(note)
    db.commit()
    return None

@router.post("/{id}/generate-summary", response_model=AIGenerationResponse)
def generate_note_summary(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found."
        )
        
    # Request Gemini AI Insights
    insights = gemini_service.generate_note_insights(note.title, note.content)
    
    # Store history record of AI Analysis
    new_gen = AIGeneration(
        note_id=note.id,
        summary=insights.summary,
        action_items=insights.action_items,
        suggested_title=insights.suggested_title
    )
    db.add(new_gen)
    db.commit()
    db.refresh(new_gen)
    return new_gen
