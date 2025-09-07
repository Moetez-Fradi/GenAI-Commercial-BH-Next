from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import os
import aiosmtplib
from email.message import EmailMessage
from typing import List, Optional
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.db.base import get_db
from app.models.history import History, HistoryMessage
from app.schemas.history import RecommendationItem, ContactMethod

load_dotenv()
router = APIRouter()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT") or 0)
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


class EmailRequest(BaseModel):
    recipient: EmailStr
    subject: str
    body: str
    ref_personne: str
    name: Optional[str] = None
    rank: Optional[int] = 0
    recommendations: Optional[List[RecommendationItem]] = None
    channel: Optional[ContactMethod] = "email"


def _create_or_update_history_and_message(db: Session, data: dict):
    """
    Synchronous helper that performs DB operations.
    run_in_threadpool will call this so we don't block the event loop.
    """
    # validate recommendations (Pydantic already validated nested RecommendationItem,
    # but ensure we store plain dicts in JSON column)
    recs = []
    if data.get("recommendations"):
        for r in data["recommendations"]:
            # ensure required keys exist (product, status, contact_method)
            # RecommendationItem (Pydantic) already enforces these, but be defensive:
            if not all(k in r for k in ("product", "status", "contact_method")):
                raise ValueError("Each recommendation must include product, status and contact_method")
            # convert Pydantic model to plain dict if needed
            recs.append(dict(r))

    history = db.query(History).filter(History.ref_personne == data["ref_personne"]).first()
    if not history:
        history = History(
            ref_personne=data["ref_personne"],
            name=data.get("name") or str(data["recipient"]),
            rank=int(data.get("rank") or 0),
            recommendations=recs or []
        )
        db.add(history)
        db.commit()
        db.refresh(history)
    else:
        if recs:
            history.recommendations = recs
            db.add(history)
            db.commit()
            db.refresh(history)

    # create HistoryMessage
    msg = HistoryMessage(
        ref_personne=history.ref_personne,
        channel=data.get("channel") or "email",
        content=data["body"]
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {"ref_personne": history.ref_personne, "message_id": msg.id}


@router.post("/send_email")
async def send_email(req: EmailRequest, db: Session = Depends(get_db)):
    # build and send email
    message = EmailMessage()
    message["From"] = EMAIL_USERNAME
    message["To"] = req.recipient
    message["Subject"] = req.subject
    message.set_content(req.body)

    try:
        await aiosmtplib.send(
            message,
            hostname=EMAIL_HOST,
            port=EMAIL_PORT,
            start_tls=True,
            username=EMAIL_USERNAME,
            password=EMAIL_PASSWORD,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

    # Persist history + message without blocking event loop
    try:
        result = await run_in_threadpool(_create_or_update_history_and_message, db, req.dict())
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        try:
            # best-effort rollback in sync thread (db is the same Session object)
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to log history: {e}")

    return {"status": "Email sent and history logged successfully", **result}
