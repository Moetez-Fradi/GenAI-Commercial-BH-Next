# app/schemas/history.py
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from enum import Enum


class ContactMethod(str, Enum):
    whatsapp = "whatsapp"
    email = "email"
    phone = "phone"


class ClientStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    refused = "refused"
    not_contacted = "not_contacted"


model_config = ConfigDict(from_attributes=True)


class HistoryMessageCreate(BaseModel):
    # input when adding a message
    id: Optional[str] = None
    channel: ContactMethod
    content: str
    sentAt: datetime

    model_config = ConfigDict()


class HistoryMessageOut(HistoryMessageCreate):
    # output; id will be preserved if present
    model_config = model_config


class RecommendationItem(BaseModel):
    product: str
    label: Optional[str] = None
    status: Optional[ClientStatus] = ClientStatus.pending
    contacts: Optional[List[ContactMethod]] = []
    messages: Optional[List[HistoryMessageOut]] = []

    model_config = model_config


class HistoryBase(BaseModel):
    ref_personne: str
    name: Optional[str] = None
    rank: Optional[int] = None
    recommendations: Optional[List[RecommendationItem]] = []

    model_config = model_config


class HistoryCreate(HistoryBase):
    pass


class HistoryUpdate(BaseModel):
    recommendations: Optional[List[RecommendationItem]] = None
    model_config = model_config


class HistoryOut(HistoryBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = model_config


class PaginatedHistoryOut(BaseModel):
    items: List[HistoryOut]
    total: Optional[int] = None
    limit: int
    offset: int
    has_more: bool
    model_config = model_config