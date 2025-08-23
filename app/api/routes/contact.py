from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.models.client import Client
from app.models.contact import ContactStatus
from app.schemas.contact import (
    ContactUpsertRequest, ContactManualStatusUpdate,
    ContactStatusOut, ContactStatusesResponse
)
from app.services.notify import send_email, send_sms, send_whatsapp

router = APIRouter()

def get_or_create_status(db: Session, ref_personne: str, channel: str) -> ContactStatus:
    st = db.query(ContactStatus).filter(
        ContactStatus.ref_personne == ref_personne,
        ContactStatus.channel == channel
    ).first()
    if not st:
        st = ContactStatus(ref_personne=ref_personne, channel=channel, status="not_contacted", attempts=0)
        db.add(st)
        db.commit()
        db.refresh(st)
    return st

@router.post("/send", response_model=ContactStatusOut)
def send_contact(req: ContactUpsertRequest, db: Session = Depends(get_db)):
    # Ensure client exists
    client = db.query(Client).filter(Client.ref_personne == req.ref_personne).first()
    if not client:
        raise HTTPException(404, "Client not found")

    st = get_or_create_status(db, req.ref_personne, req.channel)
    st.last_message = req.message
    st.attempts = (st.attempts or 0) + 1
    st.status = "pending"
    db.commit()
    db.refresh(st)

    # Dispatch
    try:
        if req.channel == "email":
            # You must know the client's email – for now we assume message contains it or
            # adapt to your data source. Demo uses a placeholder.
            result = send_email("client@example.com", "Recommandation", req.message)
        elif req.channel == "sms":
            result = send_sms("+21600000000", req.message)
        elif req.channel == "whatsapp":
            result = send_whatsapp("+21600000000", req.message)
        else:
            raise HTTPException(400, "Unknown channel")

        # Update status by result
        st.status = "sent" if not result.get("simulated", False) else "sent"
        st.last_error = None
    except Exception as e:
        st.status = "failed"
        st.last_error = str(e)

    db.commit()
    db.refresh(st)

    return ContactStatusOut(
        ref_personne=st.ref_personne,
        channel=st.channel,
        status=st.status,
        last_message=st.last_message,
        attempts=st.attempts,
        last_sent_at=st.last_sent_at.isoformat() if st.last_sent_at else None,
        last_error=st.last_error,
    )

@router.put("/{ref_personne}/{channel}/status", response_model=ContactStatusOut)
def set_status(ref_personne: str, channel: str, payload: ContactManualStatusUpdate, db: Session = Depends(get_db)):
    st = get_or_create_status(db, ref_personne, channel)
    st.status = payload.status
    if payload.note:
        st.last_message = (st.last_message or "") + f"\n[NOTE] {payload.note}"
    db.commit()
    db.refresh(st)
    return ContactStatusOut(
        ref_personne=st.ref_personne,
        channel=st.channel,
        status=st.status,
        last_message=st.last_message,
        attempts=st.attempts,
        last_sent_at=st.last_sent_at.isoformat() if st.last_sent_at else None,
        last_error=st.last_error,
    )

@router.get("/{ref_personne}", response_model=ContactStatusesResponse)
def get_statuses(ref_personne: str, db: Session = Depends(get_db)):
    sts = db.query(ContactStatus).filter(ContactStatus.ref_personne == ref_personne).all()
    out: List[ContactStatusOut] = []
    for st in sts:
        out.append(ContactStatusOut(
            ref_personne=st.ref_personne,
            channel=st.channel,
            status=st.status,
            last_message=st.last_message,
            attempts=st.attempts,
            last_sent_at=st.last_sent_at.isoformat() if st.last_sent_at else None,
            last_error=st.last_error,
        ))
    return ContactStatusesResponse(ref_personne=ref_personne, statuses=out)