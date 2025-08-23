from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.mysql import JSON
from app.db.base import Base

class Client(Base):
    __tablename__ = "clients"

    ref_personne = Column(String(64), primary_key=True, index=True)
    recommended_products = Column(JSON, nullable=True)
