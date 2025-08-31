from pydantic import BaseModel
from typing import List, Optional


class BusinessRecBase(BaseModel):
    REF_PERSONNE: int
    RAISON_SOCIALE: Optional[str] = None
    recommended_products: Optional[List[str]] = []
    recommendation_count: Optional[int] = None
    client_score: Optional[float] = None
    client_segment: Optional[str] = None
    risk_profile: Optional[str] = None
    estimated_budget: Optional[float] = None
    SECTEUR_GROUP: Optional[str] = None
    ACTIVITE_GROUP: Optional[str] = None
    BUSINESS_RISK_PROFILE: Optional[str] = None
    total_capital_assured: Optional[float] = None
    total_premiums_paid: Optional[float] = None
    client_type: Optional[str] = None


class BusinessRecCreate(BusinessRecBase):
    pass


class BusinessRecOut(BusinessRecBase):
    id: int

    class Config:
        from_attributes = True


class BusinessRecUpdate(BaseModel):
    recommended_products: Optional[List[str]] = None
    recommendation_count: Optional[int] = None
    client_score: Optional[float] = None
    client_segment: Optional[str] = None
    risk_profile: Optional[str] = None
    estimated_budget: Optional[float] = None
    SECTEUR_GROUP: Optional[str] = None
    ACTIVITE_GROUP: Optional[str] = None
    BUSINESS_RISK_PROFILE: Optional[str] = None
    total_capital_assured: Optional[float] = None
    total_premiums_paid: Optional[float] = None
    client_type: Optional[str] = None
