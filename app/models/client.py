# from sqlalchemy import Column, Integer, String
# from sqlalchemy.dialects.mysql import JSON
# from app.db.base import Base

# class Client(Base):
#     __tablename__ = "clients"

#     id = Column(Integer, primary_key=True, index=True, autoincrement=True)
#     ref_personne = Column(String(64), unique=True, nullable=False, index=True)
#     recommended_products = Column(JSON, nullable=True)
