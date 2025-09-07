# app/schemas/history.py
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime

# --- Enums as Literals ---
ClientStatus = Literal["pending", "accepted", "refused", "not_contacted"]
ContactMethod = Literal["whatsapp", "email", "phone"]

# --- Messages ---
class HistoryMessageBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    channel: ContactMethod
    content: str
    sent_at: Optional[datetime] = None

class HistoryMessageCreate(HistoryMessageBase):
    id: Optional[str] = None

class HistoryMessageOut(HistoryMessageBase):
    id: int

# --- Recommendations ---
class RecommendationItem(BaseModel):
    product: str
    status: ClientStatus
    contact_method: ContactMethod
    messages: Optional[List[HistoryMessageOut]] = None

# --- History rows ---
class HistoryBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ref_personne: str
    name: Optional[str] = None
    rank: Optional[int] = None
    recommendations: List[RecommendationItem] = []

class HistoryCreate(HistoryBase):
    pass

class HistoryOut(HistoryBase):
    created_at: datetime
    updated_at: datetime