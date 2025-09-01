from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.db.base import get_db
from app.models.business_rec import BusinessRec
from app.schemas.business_rec import (
    BusinessRecCreate,
    BusinessRecOut,
    BusinessRecUpdate,
    PaginatedBusinessRecOut,
)
from app.models.individual_rec import IndividualRec
from app.schemas.individual_rec import (
    PaginatedIndividualRecOut
)
from app.utils.auth import get_current_user
from app.utils.auth import get_current_user

# router = APIRouter(dependencies=[Depends(get_current_user)])
router = APIRouter()

@router.post("/", response_model=BusinessRecOut)
def create_business_rec(payload: BusinessRecCreate, db: Session = Depends(get_db)):
    # check if REF_PERSONNE exists
    existing = db.query(BusinessRec).filter(BusinessRec.REF_PERSONNE == payload.REF_PERSONNE).first()
    if existing:
        raise HTTPException(status_code=400, detail="Business record already exists")

    business_rec = BusinessRec(
        REF_PERSONNE=payload.REF_PERSONNE,
        RAISON_SOCIALE=payload.RAISON_SOCIALE,
        recommended_products=payload.recommended_products,
        recommendation_count=payload.recommendation_count,
        client_score=payload.client_score,
        client_segment=payload.client_segment,
        risk_profile=payload.risk_profile,
        estimated_budget=payload.estimated_budget,
        SECTEUR_GROUP=payload.SECTEUR_GROUP,
        ACTIVITE_GROUP=payload.ACTIVITE_GROUP,
        BUSINESS_RISK_PROFILE=payload.BUSINESS_RISK_PROFILE,
        total_capital_assured=payload.total_capital_assured,
        total_premiums_paid=payload.total_premiums_paid,
        client_type=payload.client_type,
    )
    db.add(business_rec)
    db.commit()
    db.refresh(business_rec)
    return business_rec


@router.get("/morale", response_model=PaginatedBusinessRecOut)
def list_business_recs(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100),    # limit clamp (adjust max as you want)
    offset: int = Query(0, ge=0),
    include_total: bool = Query(False),
):
    """
    Paginated list: ?limit=10&offset=0
    `include_total=true` will return total count (costly on very large tables).
    """
    query = db.query(BusinessRec).order_by(BusinessRec.REF_PERSONNE)  # stable ordering

    items = query.limit(limit).offset(offset).all()

    # optionally compute total (costly on large tables)
    total: Optional[int] = None
    if include_total:
        total = db.query(func.count(BusinessRec.REF_PERSONNE)).scalar()

    has_more = len(items) == limit and (total is None or (offset + limit) < total)

    return PaginatedBusinessRecOut(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
        has_more=has_more,
    )

@router.get("/physique", response_model=PaginatedIndividualRecOut)
def list_individual_recs(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    include_total: bool = Query(False),
):
    """
    Paginated list of individual recommendations: ?limit=10&offset=0
    `include_total=true` will return total count (may be costly on very large tables).
    """
    query = db.query(IndividualRec).order_by(IndividualRec.REF_PERSONNE)

    items = query.limit(limit).offset(offset).all()

    total: Optional[int] = None
    if include_total:
        total = db.query(func.count(IndividualRec.REF_PERSONNE)).scalar()

    has_more = len(items) == limit and (total is None or (offset + limit) < total)

    return PaginatedIndividualRecOut(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
        has_more=has_more,
    )


@router.get("/{ref_personne}", response_model=BusinessRecOut)
def get_business_rec(ref_personne: int, db: Session = Depends(get_db)):
    business_rec = db.query(BusinessRec).filter(BusinessRec.REF_PERSONNE == ref_personne).first()
    if not business_rec:
        raise HTTPException(status_code=404, detail="Business record not found")
    return business_rec


@router.put("/{ref_personne}", response_model=BusinessRecOut)
def update_business_rec(ref_personne: int, payload: BusinessRecUpdate, db: Session = Depends(get_db)):
    business_rec = db.query(BusinessRec).filter(BusinessRec.REF_PERSONNE == ref_personne).first()
    if not business_rec:
        raise HTTPException(status_code=404, detail="Business record not found")

    # update only provided fields
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(business_rec, key, value)

    db.commit()
    db.refresh(business_rec)
    return business_rec


@router.put("/{ref_personne}/recommendations", response_model=BusinessRecOut)
def update_recommendations(ref_personne: int, payload: BusinessRecUpdate, db: Session = Depends(get_db)):
    business_rec = db.query(BusinessRec).filter(BusinessRec.REF_PERSONNE == ref_personne).first()
    if not business_rec:
        raise HTTPException(status_code=404, detail="Business record not found")

    current = set(business_rec.recommended_products or [])
    new = set(payload.recommended_products or [])
    business_rec.recommended_products = list(current.union(new))

    db.commit()
    db.refresh(business_rec)
    return business_rec
