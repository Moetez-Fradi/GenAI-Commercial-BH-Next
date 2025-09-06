# app/routers/contracts.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db.base import get_db
from app.models.contract import Contract
from app.schemas.contract import ContractOut, ContractListOut

router = APIRouter(prefix="/contracts", tags=["contracts"])


@router.get("/", response_model=ContractListOut)
def list_contracts(
    db: Session = Depends(get_db),
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    ref_personne: Optional[int] = Query(None),
):
    q = db.query(Contract)
    if ref_personne is not None:
        q = q.filter(Contract.REF_PERSONNE == ref_personne)

    items = q.limit(limit).offset(offset).all()
    has_more = len(items) == limit
    return ContractListOut(items=items, limit=limit, offset=offset, has_more=has_more)


@router.get("/{index}", response_model=ContractOut)
def get_contract(index: int, db: Session = Depends(get_db)):
    c = db.query(Contract).filter(Contract.index == index).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
    return c
