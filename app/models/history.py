# app/models/history.py
from sqlalchemy import Column, String, Integer, DateTime, func
from sqlalchemy.dialects.mysql import JSON
from app.db.base import Base


class History(Base):
    __tablename__ = "history"

    # client ref is the PK (no surrogate id)
    ref_personne = Column(String(50), primary_key=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    rank = Column(Integer, nullable=True)

    # JSON column (MySQL JSON) storing list of recommendation objects
    recommendations = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<History ref_personne={self.ref_personne}>"