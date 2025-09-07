from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from dotenv import load_dotenv, find_dotenv
import os
import json
import logging
from typing import List, Optional
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.models.history import History, HistoryMessage
from app.schemas.history import RecommendationItem, ContactMethod

load_dotenv(find_dotenv() or ".env")
router = APIRouter()
logger = logging.getLogger("whatsapp")
logger.setLevel(logging.INFO)


ACCOUNT_SID = os.getenv("DEFAULT_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("DEFAULT_AUTH_TOKEN")
WHATSAPP_FROM = os.getenv("DEFAULT_WHATSAPP_FROM")


def mask(s: str) -> str:
    if not s:
        return "<empty>"
    s = s.strip()
    if len(s) <= 8:
        return s[0:2] + "..." + s[-2:]
    return s[:4] + "..." + s[-3:]


logger.info("Twilio config: ACCOUNT_SID=%s WHATSAPP_FROM=%s", mask(ACCOUNT_SID), mask(WHATSAPP_FROM))
twilio_client = Client(ACCOUNT_SID, AUTH_TOKEN)


class MessageRequest(BaseModel):
    phone_number: str
    message: Optional[str] = None
    content_sid: Optional[str] = None
    content_variables: Optional[dict] = None

    # fields for history linking / creation (same pattern as email endpoint)
    ref_personne: str
    name: Optional[str] = None
    rank: Optional[int] = 0
    recommendations: Optional[List[RecommendationItem]] = None


def build_whatsapp_to(raw_phone: str) -> str:
    raw = (raw_phone or "").strip()
    if not raw:
        raise ValueError("phone_number empty")

    if raw.startswith("+"):
        digits = "".join(ch for ch in raw if ch.isdigit())
        if not digits:
            raise ValueError("phone_number invalid")
        return f"whatsapp:+{digits}"

    digits = "".join(ch for ch in raw if ch.isdigit())
    if not digits:
        raise ValueError("phone_number invalid")

    if digits.startswith("216"):
        return f"whatsapp:+{digits}"

    if len(digits) == 8:
        return f"whatsapp:+216{digits}"

    return f"whatsapp:+{digits}"


def _send_whatsapp_sync(msg: MessageRequest, to_addr: str):
    """Synchronous Twilio call (runs in threadpool)."""
    if msg.content_sid:
        vars_json = None
        if msg.content_variables:
            vars_json = json.dumps(msg.content_variables)
        return twilio_client.messages.create(
            from_=WHATSAPP_FROM,
            to=to_addr,
            content_sid=msg.content_sid,
            content_variables=vars_json,
        )
    else:
        return twilio_client.messages.create(
            from_=WHATSAPP_FROM,
            to=to_addr,
            body=msg.message,
        )


def _create_or_update_history_and_message(db: Session, data: dict, channel: str = "whatsapp"):
    """
    Synchronous DB helper to create History (if missing) and append a HistoryMessage.
    Returns dict with ref_personne and message id.
    """
    recs = []
    if data.get("recommendations"):
        for r in data["recommendations"]:
            if not all(k in r for k in ("product", "status", "contact_method")):
                raise ValueError("Each recommendation must include product, status and contact_method")
            recs.append(dict(r))

    history = db.query(History).filter(History.ref_personne == data["ref_personne"]).first()
    if not history:
        history = History(
            ref_personne=data["ref_personne"],
            name=data.get("name") or data.get("phone_number") or "<unknown>",
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

    # create HistoryMessage content: prefer plaintext message, otherwise store template info
    if data.get("message"):
        content_text = data["message"]
    else:
        content_text = f"template:{data.get('content_sid')}"
        if data.get("content_variables"):
            content_text += " vars:" + json.dumps(data["content_variables"])

    msg = HistoryMessage(
        ref_personne=history.ref_personne,
        channel=channel,
        content=content_text
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {"ref_personne": history.ref_personne, "message_id": msg.id}


@router.post("/send_whatsapp")
async def send_whatsapp(msg: MessageRequest, db: Session = Depends(get_db)):
    # validate phone -> to address
    try:
        to_addr = build_whatsapp_to(msg.phone_number)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    if not msg.message and not msg.content_sid:
        raise HTTPException(status_code=400, detail="Either 'message' or 'content_sid' must be provided")

    # send via Twilio in threadpool
    try:
        twilio_message = await run_in_threadpool(_send_whatsapp_sync, msg, to_addr)
    except TwilioRestException as e:
        logger.error("Twilio error: code=%s status=%s msg=%s", e.code, e.status, e.msg)
        raise HTTPException(status_code=(e.status or 500), detail=f"Twilio error {e.code}: {e.msg}")
    except Exception as e:
        logger.exception("Unexpected error sending whatsapp")
        raise HTTPException(status_code=500, detail=str(e))

    # persist history + message without blocking event loop
    try:
        result = await run_in_threadpool(_create_or_update_history_and_message, db, msg.dict(), "whatsapp")
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to log history: {e}")

    return {
        "status": "WhatsApp sent and history logged successfully",
        "sid": getattr(twilio_message, "sid", None),
        "twilio_status": getattr(twilio_message, "status", None),
        "to": to_addr,
        **result
    }
