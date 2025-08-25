from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientOut, RecommendationUpdate

router = APIRouter()

@router.post("/", response_model=ClientOut)
def create_client(payload: ClientCreate, db: Session = Depends(get_db)):
    # check if ref_personne exists
    existing = db.query(Client).filter(Client.ref_personne == payload.ref_personne).first()
    if existing:
        raise HTTPException(400, "Client already exists")
    client = Client(ref_personne=payload.ref_personne, recommended_products=payload.recommended_products)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

@router.get("/", response_model=List[ClientOut])
def list_clients(db: Session = Depends(get_db)):
    return db.query(Client).all()

@router.get("/{ref_personne}", response_model=ClientOut)
def get_client(ref_personne: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.ref_personne == ref_personne).first()
    if not client:
        raise HTTPException(404, "Client not found")
    return client

@router.put("/{ref_personne}/recommendations", response_model=ClientOut)
def update_recommendations(ref_personne: str, payload: RecommendationUpdate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.ref_personne == ref_personne).first()
    if not client:
        raise HTTPException(404, "Client not found")

    current = set(client.recommended_products or [])
    new = set(payload.products)
    client.recommended_products = list(current.union(new))

    db.commit()
    db.refresh(client)
    return client
