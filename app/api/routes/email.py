from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import os
import aiosmtplib
from email.message import EmailMessage

load_dotenv()
router = APIRouter()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

class EmailRequest(BaseModel):
    recipient: EmailStr
    subject: str
    body: str

@router.post("/send_email")
async def send_email(req: EmailRequest):
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
            password=EMAIL_PASSWORD
        )
        return {"status": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
