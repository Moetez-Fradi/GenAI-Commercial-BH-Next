# app/api/routes/history.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.base import get_db
from app.schemas.history import HistoryCreate, HistoryOut, PaginatedHistoryOut, HistoryMessageCreate
from app.services.history_service import upsert_history, add_message_to_recommendation
from app.models.history import History

router = APIRouter()


@router.post("/", response_model=HistoryOut)
def create_or_upsert_history(payload: HistoryCreate, db: Session = Depends(get_db)):
    return upsert_history(db, payload)


@router.get("/", response_model=List[HistoryOut])
def list_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = db.query(History).order_by(History.updated_at.desc()).offset(skip).limit(limit).all()
    return items


@router.get("/{ref_personne}", response_model=HistoryOut)
def get_history(ref_personne: str, db: Session = Depends(get_db)):
    item = db.query(History).filter(History.ref_personne == ref_personne).first()
    if not item:
        raise HTTPException(status_code=404, detail="History not found")
    return item


@router.post("/{ref_personne}/recommendations/{product}/messages", response_model=HistoryOut)
def add_message(ref_personne: str, product: str, payload: HistoryMessageCreate, db: Session = Depends(get_db)):
    updated = add_message_to_recommendation(db, ref_personne, product, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="History / client not found")
    return updated