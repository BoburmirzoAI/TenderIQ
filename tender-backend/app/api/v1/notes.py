"""Tender notes/comments endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.tender import Tender
from app.models.tender_note import TenderNote
from app.models.user import User
from app.schemas.base import PaginatedResponse, SuccessResponse
from app.schemas.tender_note import NoteCreate, NoteRead, NoteUpdate

router = APIRouter()


@router.get("/tender/{tender_id}", response_model=PaginatedResponse[NoteRead])
async def list_notes(
    tender_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List notes for a tender (only user's own notes)."""
    base = select(TenderNote).where(
        TenderNote.tender_id == tender_id,
        TenderNote.user_id == user.id,
    )
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()

    result = await db.execute(
        base.order_by(TenderNote.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    notes = result.scalars().all()

    items = [
        NoteRead(
            id=n.id,
            tender_id=n.tender_id,
            user_id=n.user_id,
            content=n.content,
            color=n.color,
            created_at=n.created_at,
            updated_at=n.updated_at,
            user_name=user.full_name,
        )
        for n in notes
    ]

    total_pages = (total + per_page - 1) // per_page
    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.post("/tender/{tender_id}", response_model=SuccessResponse[NoteRead])
async def create_note(
    tender_id: int,
    body: NoteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a note to a tender."""
    tender = await db.get(Tender, tender_id)
    if not tender or tender.is_deleted:
        raise HTTPException(status_code=404, detail="Tender topilmadi")

    note_count = (
        await db.execute(
            select(func.count()).select_from(TenderNote).where(
                TenderNote.tender_id == tender_id, TenderNote.user_id == user.id
            )
        )
    ).scalar_one()
    if note_count >= 50:
        raise HTTPException(status_code=400, detail="Bitta tenderga maksimum 50 ta izoh")

    note = TenderNote(
        tender_id=tender_id,
        user_id=user.id,
        content=body.content,
        color=body.color,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    return SuccessResponse(
        data=NoteRead(
            id=note.id,
            tender_id=note.tender_id,
            user_id=note.user_id,
            content=note.content,
            color=note.color,
            created_at=note.created_at,
            updated_at=note.updated_at,
            user_name=user.full_name,
        )
    )


@router.patch("/{note_id}", response_model=SuccessResponse[NoteRead])
async def update_note(
    note_id: int,
    body: NoteUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a note (only owner)."""
    note = await db.get(TenderNote, note_id)
    if not note or note.user_id != user.id:
        raise HTTPException(status_code=404, detail="Izoh topilmadi")

    if body.content is not None:
        note.content = body.content
    if body.color is not None:
        note.color = body.color

    await db.commit()
    await db.refresh(note)

    return SuccessResponse(
        data=NoteRead(
            id=note.id,
            tender_id=note.tender_id,
            user_id=note.user_id,
            content=note.content,
            color=note.color,
            created_at=note.created_at,
            updated_at=note.updated_at,
            user_name=user.full_name,
        )
    )


@router.delete("/{note_id}", response_model=SuccessResponse[dict])
async def delete_note(
    note_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a note (only owner)."""
    note = await db.get(TenderNote, note_id)
    if not note or note.user_id != user.id:
        raise HTTPException(status_code=404, detail="Izoh topilmadi")

    await db.delete(note)
    await db.commit()
    return SuccessResponse(data={"deleted": True})
