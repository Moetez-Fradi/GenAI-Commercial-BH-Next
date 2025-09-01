# app/schemas/business_rec.py
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Union
from decimal import Decimal


class RecommendedProduct(BaseModel):
    """
    Model for each item in recommended_products stored as JSON.
    Adjust/add fields to exactly match what you store in the DB.
    """
    # common fields inferred from your error messages:
    score: Optional[float] = None
    reason: Optional[str] = None
    confidence: Optional[float] = None

    # optional extra metadata that your JSON might include (ids/labels/etc.)
    product_id: Optional[Union[str, int]] = None
    label: Optional[str] = None
    # allow an arbitrary dict for any other nested info
    metadata: Optional[dict] = None

    # allow ORM attribute access and allow unknown extra keys so validation won't fail
    model_config = ConfigDict(from_attributes=True, extra="allow")


class BusinessRecBase(BaseModel):
    # allow reading from SQLAlchemy ORM objects
    model_config = ConfigDict(from_attributes=True)

    REF_PERSONNE: int
    RAISON_SOCIALE: Optional[str] = None
    # <-- changed: list of RecommendedProduct objects
    recommended_products: Optional[List[RecommendedProduct]] = None
    recommendation_count: Optional[int] = None
    client_score: Optional[Decimal] = None
    client_segment: Optional[str] = None
    risk_profile: Optional[str] = None
    estimated_budget: Optional[Decimal] = None
    SECTEUR_GROUP: Optional[str] = None
    ACTIVITE_GROUP: Optional[str] = None
    BUSINESS_RISK_PROFILE: Optional[str] = None
    total_capital_assured: Optional[Decimal] = None
    total_premiums_paid: Optional[Decimal] = None
    client_type: Optional[str] = None


class BusinessRecCreate(BusinessRecBase):
    pass


class BusinessRecOut(BusinessRecBase):
    pass


class BusinessRecUpdate(BaseModel):
    # update endpoint should accept the same structured recommended_products
    model_config = ConfigDict(from_attributes=True)
    recommended_products: Optional[List[RecommendedProduct]] = None
    recommendation_count: Optional[int] = None
    client_score: Optional[Decimal] = None
    client_segment: Optional[str] = None
    risk_profile: Optional[str] = None
    estimated_budget: Optional[Decimal] = None
    SECTEUR_GROUP: Optional[str] = None
    ACTIVITE_GROUP: Optional[str] = None
    BUSINESS_RISK_PROFILE: Optional[str] = None
    total_capital_assured: Optional[Decimal] = None
    total_premiums_paid: Optional[Decimal] = None
    client_type: Optional[str] = None


class PaginatedBusinessRecOut(BaseModel):
    items: List[BusinessRecOut]
    total: Optional[int] = None
    limit: int
    offset: int
    has_more: bool
