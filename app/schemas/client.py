from pydantic import BaseModel
from typing import List, Optional

class ClientBase(BaseModel):
    ref_personne: str
    recommended_products: Optional[List[str]] = []

class ClientCreate(ClientBase):
    pass

class ClientOut(ClientBase):
    id: int
    class Config:
        from_attributes = True

class RecommendationUpdate(BaseModel):
    products: List[str]
