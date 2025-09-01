from sqlalchemy import Column, Integer, String, DECIMAL, Text
from sqlalchemy.dialects.mysql import JSON
from app.db.base import Base




class IndividualRec(Base):
    __tablename__ = "individual_recommendations"


    REF_PERSONNE = Column(Integer, primary_key=True, index=True, nullable=False)
    NOM_PRENOM = Column(String(255), nullable=True)
    recommended_products = Column(JSON, nullable=True)
    recommendation_count = Column(Integer, nullable=True)
    client_score = Column(DECIMAL(30, 20), nullable=True)
    client_segment = Column(String(255), nullable=True)
    risk_profile = Column(String(255), nullable=True)
    estimated_budget = Column(DECIMAL(30, 20), nullable=True)
    AGE = Column(DECIMAL(5, 1), nullable=True)
    PROFESSION_GROUP = Column(Text, nullable=True)
    SITUATION_FAMILIALE = Column(Text, nullable=True)
    SECTEUR_ACTIVITE_GROUP = Column(Text, nullable=True)
    client_type = Column(Text, nullable=True)


    def __repr__(self) -> str: # pragma: no cover - small convenience helper
        return f"<IndividualRec REF_PERSONNE={self.REF_PERSONNE} NOM_PRENOM={self.NOM_PRENOM!r}>"