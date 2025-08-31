from sqlalchemy import Column, Integer, String, DECIMAL
from sqlalchemy.dialects.mysql import JSON
from app.db.base import Base

class BusinessRec(Base):
    __tablename__ = "business_recommendations"

    REF_PERSONNE = Column(Integer, primary_key=True, index=True, nullable=False)
    RAISON_SOCIALE = Column(String(255), nullable=True)
    recommended_products = Column(JSON, nullable=True)
    recommendation_count = Column(Integer, nullable=True)
    client_score = Column(DECIMAL(30, 20), nullable=True)
    client_segment = Column(String(255), nullable=True)
    risk_profile = Column(String(255), nullable=True)
    estimated_budget = Column(DECIMAL(30, 20), nullable=True)
    SECTEUR_GROUP = Column(String(255), nullable=True)
    ACTIVITE_GROUP = Column(String(255), nullable=True)
    BUSINESS_RISK_PROFILE = Column(String(255), nullable=True)
    total_capital_assured = Column(DECIMAL(30, 20), nullable=True)
    total_premiums_paid = Column(DECIMAL(30, 20), nullable=True)
    client_type = Column(String(255), nullable=True)
