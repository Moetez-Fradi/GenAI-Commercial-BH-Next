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
        # ensure messages have ISO strings for DB
        for r in history_in.recommendations:
            recs_serialized.append(r.model_dump())
    if existing:
        existing.name = history_in.name or existing.name
        existing.rank = history_in.rank if history_in.rank is not None else existing.rank
        existing.recommendations = recs_serialized or existing.recommendations
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new = History(
            ref_personne=history_in.ref_personne,
            name=history_in.name,
            rank=history_in.rank,
            recommendations=recs_serialized or []
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

    # find recommendation by product
    found = None
    for rec in recommendations:
        if isinstance(rec, dict) and rec.get("product") == product:
            found = rec
            break

    if not found:
        found = {
            "product": product,
            "label": None,
            "status": "pending",
            "contacts": [],
            "messages": []
        }
        recommendations.append(found)

    # prepare message dict
    msg_id = msg_in.id or str(uuid.uuid4())
    msg_dict = {
        "id": msg_id,
        "channel": msg_in.channel.value if hasattr(msg_in.channel, "value") else msg_in.channel,
        "content": msg_in.content,
        "sentAt": msg_in.sentAt.isoformat() if isinstance(msg_in.sentAt, datetime) else str(msg_in.sentAt)
    }

    # append message
    if "messages" not in found or found["messages"] is None:
        found["messages"] = []
    found["messages"].append(msg_dict)

    # ensure contact is recorded
    ch = msg_dict["channel"]
    if "contacts" not in found or found["contacts"] is None:
        found["contacts"] = []
    if ch not in found["contacts"]:
        found["contacts"].append(ch)

    # update recommendations and save
    history.recommendations = recommendations
    db.add(history)
    db.commit()
    db.refresh(history)
    return history