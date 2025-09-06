from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    REF_PERSONNE: int
    alert_type: str
    alert_message: str
    alert_severity: str
    product: Optional[str] = None
    expiration_date: Optional[datetime] = None
    days_until_expiry: Optional[int] = None

class AlertCreate(AlertBase):
    pass

class AlertOut(AlertBase):
    pass

class AlertUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    alert_type: Optional[str] = None
    alert_message: Optional[str] = None
    alert_severity: Optional[str] = None
    product: Optional[str] = None
    expiration_date: Optional[datetime] = None
    days_until_expiry: Optional[int] = None

class PaginatedAlertOut(BaseModel):
    items: list[AlertOut]
    total: Optional[int] = None
    limit: int
    offset: int
    has_more: bool