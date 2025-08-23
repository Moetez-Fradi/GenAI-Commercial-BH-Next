from sqlalchemy import Column, String, Integer, DateTime, Text, PrimaryKeyConstraint
from sqlalchemy.sql import func
from app.db.base import Base

# channels: "email" | "whatsapp" | "sms"
# status: "not_contacted" | "pending" | "sent" | "accepted" | "refused" | "failed"

class ContactStatus(Base):
    __tablename__ = "contact_status"

    ref_personne = Column(String(64), nullable=False)
    channel = Column(String(16), nullable=False)          # email | whatsapp | sms
    status = Column(String(32), nullable=False, default="not_contacted")
    last_message = Column(Text, nullable=True)
    attempts = Column(Integer, nullable=False, default=0)
    last_sent_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)
    last_error = Column(Text, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("ref_personne", "channel", name="pk_contact_status"),
    )
