from pydantic import BaseModel, Field
from typing import Literal, Optional, List

Channel = Literal["email", "whatsapp", "sms"]
Status = Literal["not_contacted", "pending", "sent", "accepted", "refused", "failed"]

class ContactUpsertRequest(BaseModel):
    ref_personne: str
    channel: Channel
    message: str = Field(..., min_length=1)

class ContactManualStatusUpdate(BaseModel):
    status: Status
    note: Optional[str] = None

class ContactStatusOut(BaseModel):
    ref_personne: str
    channel: Channel
    status: Status
    last_message: Optional[str] = None
    attempts: int
    last_sent_at: Optional[str] = None
    last_error: Optional[str] = None

class ContactStatusesResponse(BaseModel):
    ref_personne: str
    statuses: List[ContactStatusOut]
