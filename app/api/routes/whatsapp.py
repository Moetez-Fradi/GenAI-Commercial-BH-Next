from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from twilio.rest import Client
from dotenv import load_dotenv
import os

load_dotenv()
router = APIRouter()

client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

class MessageRequest(BaseModel):
    phone_number: str
    message: str

@router.post("/send_whatsapp")
async def send_whatsapp(msg: MessageRequest):
    try:
        message = client.messages.create(
            from_=os.getenv("TWILIO_WHATSAPP_NUMBER"),
            body=msg.message,
            to=f"whatsapp:+216{msg.phone_number}"
        )
        return {"sid": message.sid, "status": "sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))