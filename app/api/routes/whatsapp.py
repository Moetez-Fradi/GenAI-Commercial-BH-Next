from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from dotenv import load_dotenv, find_dotenv
import os
import json
import logging

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
    message: str | None = None
    content_sid: str | None = None
    content_variables: dict | None = None

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

@router.post("/send_whatsapp")
async def send_whatsapp(msg: MessageRequest):
    try:
        to_addr = build_whatsapp_to(msg.phone_number)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    if not msg.message and not msg.content_sid:
        raise HTTPException(status_code=400, detail="Either 'message' or 'content_sid' must be provided")

    try:
        if msg.content_sid:
            content_vars_json = None
            if msg.content_variables:
                content_vars_json = json.dumps(msg.content_variables)
            message = twilio_client.messages.create(
                from_=WHATSAPP_FROM,
                to=to_addr,
                content_sid=msg.content_sid,
                content_variables=content_vars_json,
            )
        else:
            message = twilio_client.messages.create(
                from_=WHATSAPP_FROM,
                to=to_addr,
                body=msg.message,
            )

        return {
            "sid": message.sid,
            "status": getattr(message, "status", "unknown"),
            "to": to_addr,
        }

    except TwilioRestException as e:
        logger.error("Twilio error: code=%s status=%s msg=%s", e.code, e.status, e.msg)
        raise HTTPException(status_code=(e.status or 500), detail=f"Twilio error {e.code}: {e.msg}")
    except Exception as e:
        logger.exception("Unexpected error sending whatsapp")
        raise HTTPException(status_code=500, detail=str(e))