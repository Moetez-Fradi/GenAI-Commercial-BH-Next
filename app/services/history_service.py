# app/services/history_service.py
from sqlalchemy.orm import Session
from app.models.history import History
from app.schemas.history import HistoryCreate, HistoryMessageCreate, RecommendationItem
from datetime import datetime
import uuid

def upsert_history(db: Session, history_in: HistoryCreate):
    """
    Create or update a History entry keyed by ref_personne.
    """
    existing = db.query(History).filter(History.ref_personne == history_in.ref_personne).first()
    recs_serialized = []
    if history_in.recommendations:
        recs_serialized = [r.model_dump() for r in history_in.recommendations]

    if existing:
        existing.name = history_in.name or existing.name
        existing.rank = history_in.rank if history_in.rank is not None else existing.rank
        if recs_serialized:
            existing.recommendations = recs_serialized
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new = History(
            ref_personne=history_in.ref_personne,
            name=history_in.name,
            rank=history_in.rank,
            recommendations=recs_serialized or [],
        )
        db.add(new)
        db.commit()
        db.refresh(new)
        return new

def add_message_to_recommendation(db: Session, ref_personne: str, product: str, msg_in: HistoryMessageCreate):
    """
    Append a message to the recommendation 'product' for the client 'ref_personne'.
    If the recommendation doesn't exist, create it.
    Returns the updated History row.
    """
    history = db.query(History).filter(History.ref_personne == ref_personne).first()
    if not history:
        return None

    recommendations = history.recommendations or []
    found = None

    for rec in recommendations:
        if rec.get("product") == product:
            found = rec
            break

    if not found:
        found = {
            "product": product,
            "status": "pending",
            "contact_method": msg_in.channel,
            "messages": [],
        }
        recommendations.append(found)

    msg_dict = {
        "id": msg_in.id or str(uuid.uuid4()),
        "channel": msg_in.channel,
        "content": msg_in.content,
        "sentAt": msg_in.sentAt.isoformat() if msg_in.sentAt else datetime.utcnow().isoformat(),
    }

    found.setdefault("messages", []).append(msg_dict)
    history.recommendations = recommendations
    db.add(history)
    db.commit()
    db.refresh(history)
    return history