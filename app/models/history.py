from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class History(Base):
    __tablename__ = "history"

    ref_personne = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    rank = Column(Integer, nullable=False)
    recommendations = Column(JSON, nullable=False)  # list of recommendations with status + contact method
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    messages = relationship("HistoryMessage", back_populates="history", cascade="all, delete-orphan")

class HistoryMessage(Base):
    __tablename__ = "history_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ref_personne = Column(String(50), ForeignKey("history.ref_personne", ondelete="CASCADE"))
    channel = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    sent_at = Column(TIMESTAMP, server_default=func.now())

    history = relationship("History", back_populates="messages")