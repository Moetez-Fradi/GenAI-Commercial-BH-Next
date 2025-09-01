from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.schemas.business_rec import RecommendedProduct
from decimal import Decimal

model_config = ConfigDict(from_attributes=True, extra="allow")

class IndividualRecBase(BaseModel):
# allow reading from SQLAlchemy ORM objects
    model_config = ConfigDict(from_attributes=True)


    REF_PERSONNE: int
    NOM_PRENOM: Optional[str] = None


    # JSON column -> list of structured recommended products
    recommended_products: Optional[List[RecommendedProduct]] = None


    recommendation_count: Optional[int] = None
    client_score: Optional[Decimal] = None
    client_segment: Optional[str] = None
    risk_profile: Optional[str] = None
    estimated_budget: Optional[Decimal] = None


    # AGE stored as DECIMAL(5,1) in DB -> Decimal is safest in pydantic
    AGE: Optional[Decimal] = None


    PROFESSION_GROUP: Optional[str] = None
    SITUATION_FAMILIALE: Optional[str] = None
    SECTEUR_ACTIVITE_GROUP: Optional[str] = None
    client_type: Optional[str] = None




class IndividualRecCreate(IndividualRecBase):
    pass




class IndividualRecOut(IndividualRecBase):
    pass




class IndividualRecUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)


    NOM_PRENOM: Optional[str] = None
    recommended_products: Optional[List[RecommendedProduct]] = None
    recommendation_count: Optional[int] = None
    client_score: Optional[Decimal] = None
    client_segment: Optional[str] = None
    risk_profile: Optional[str] = None
    estimated_budget: Optional[Decimal] = None
    AGE: Optional[Decimal] = None
    PROFESSION_GROUP: Optional[str] = None
    SITUATION_FAMILIALE: Optional[str] = None
    SECTEUR_ACTIVITE_GROUP: Optional[str] = None
    client_type: Optional[str] = None




class PaginatedIndividualRecOut(BaseModel):
    items: List[IndividualRecOut]
    total: Optional[int] = None
    limit: int
    offset: int
    has_more: bool