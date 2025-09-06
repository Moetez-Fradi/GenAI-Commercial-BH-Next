from sqlalchemy import Column, Integer, String, DateTime
from app.db.base import Base

class Alert(Base):
    __tablename__ = "alerts"
    
    REF_PERSONNE = Column(Integer, primary_key=True, nullable=False)
    alert_type = Column(String(255), nullable=False)
    alert_message = Column(String(500), nullable=False)
    alert_severity = Column(String(50), nullable=False)  
    product = Column(String(500), nullable=True)
    expiration_date = Column(DateTime, nullable=True)
    days_until_expiry = Column(Integer, nullable=True)