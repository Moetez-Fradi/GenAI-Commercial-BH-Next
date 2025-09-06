from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.models.history import History, HistoryMessage
from app.schemas.history import HistoryCreate, HistoryOut, HistoryMessageCreate, HistoryMessageOut

router = APIRouter()

@router.post("/", response_model=HistoryOut)
def create_history(history_in: HistoryCreate, db: Session = Depends(get_db)):
    history = History(**history_in.dict())
    db.add(history)
    db.commit()
    db.refresh(history)
    return history

@router.get("/", response_model=List[HistoryOut])
def list_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(History).offset(skip).limit(limit).all()

@router.post("/{ref_personne}/messages", response_model=HistoryMessageOut)
def add_message(ref_personne: str, msg_in: HistoryMessageCreate, db: Session = Depends(get_db)):
    history = db.query(History).filter(History.ref_personne == ref_personne).first()
    if not history:
        raise HTTPException(status_code=404, detail="History not found")
    msg = HistoryMessage(ref_personne=ref_personne, **msg_in.dict())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@router.get("/{ref_personne}/messages", response_model=List[HistoryMessageOut])
def get_messages(ref_personne: str, db: Session = Depends(get_db)):
    return db.query(HistoryMessage).filter(HistoryMessage.ref_personne == ref_personne).all()