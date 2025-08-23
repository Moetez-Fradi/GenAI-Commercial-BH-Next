import os
import smtplib
from email.message import EmailMessage
from twilio.rest import Client as TwilioClient

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM")

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_SMS_FROM = os.getenv("TWILIO_SMS_FROM")               # e.g. +15005550006 (Twilio trial/test)
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM")     # e.g. whatsapp:+14155238886

def can_send_email() -> bool:
    return all([SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM])

def can_send_twilio() -> bool:
    return all([TWILIO_SID, TWILIO_TOKEN])

def send_email(to_email: str, subject: str, body: str):
    if not can_send_email():
        # simulate
        return {"simulated": True, "detail": f"[SIMULATED EMAIL] to={to_email}, subject={subject}"}

    msg = EmailMessage()
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)
    return {"simulated": False, "detail": "Email sent"}

def send_sms(to_phone: str, body: str):
    if not can_send_twilio() or not TWILIO_SMS_FROM:
        return {"simulated": True, "detail": f"[SIMULATED SMS] to={to_phone}"}
    t = TwilioClient(TWILIO_SID, TWILIO_TOKEN)
    m = t.messages.create(from_=TWILIO_SMS_FROM, to=to_phone, body=body)
    return {"simulated": False, "sid": m.sid}

def send_whatsapp(to_phone: str, body: str):
    if not can_send_twilio() or not TWILIO_WHATSAPP_FROM:
        return {"simulated": True, "detail": f"[SIMULATED WHATSAPP] to={to_phone}"}
    t = TwilioClient(TWILIO_SID, TWILIO_TOKEN)
    m = t.messages.create(from_=TWILIO_WHATSAPP_FROM, to=f"whatsapp:{to_phone}", body=body)
    return {"simulated": False, "sid": m.sid}