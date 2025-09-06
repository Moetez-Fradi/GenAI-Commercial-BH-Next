# app/schemas/contracts.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContractOut(BaseModel):
    index: int
    REF_PERSONNE: Optional[int]
    NUM_CONTRAT: Optional[int]
    LIB_PRODUIT: Optional[str]
    EFFET_CONTRAT: Optional[str]
    DATE_EXPIRATION: Optional[str]
    PROCHAIN_TERME: Optional[str]
    LIB_ETAT_CONTRAT: Optional[str]
    branche: Optional[str]
    somme_quittances: Optional[float]
    statut_paiement: Optional[str]
    Capital_assure: Optional[float]

    class Config:
        orm_mode = True

class ContractListOut(BaseModel):
    items: list[ContractOut]
    limit: int
    offset: int
    has_more: bool
