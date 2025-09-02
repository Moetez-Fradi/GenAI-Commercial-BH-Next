# app/api/client.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc
from typing import List, Optional, Literal

from app.db.base import get_db
from app.models.business_rec import BusinessRec
from app.models.individual_rec import IndividualRec
from app.schemas.business_rec import (
    BusinessRecCreate,
    BusinessRecOut,
    BusinessRecUpdate,
    PaginatedBusinessRecOut,
)
from app.schemas.individual_rec import PaginatedIndividualRecOut

# If you need auth, uncomment the dependency line and its import
# from app.utils.auth import get_current_user
# router = APIRouter(dependencies=[Depends(get_current_user)])
router = APIRouter()


# ---------------------------
# Helpers
# ---------------------------

def order_with_nulls(
    column,
    by: Optional[str],            # "score" | "ref" | None
    direction: Optional[str],     # "asc" | "desc" | None
    default_ref_col=None
):
    """
    Build an ORDER BY with NULLS LAST/ FIRST semantics supported by SQLAlchemy 1.4+.
    Falls back to ref column when by is None.
    """
    dir_ = (direction or "desc").lower()
    if by == "score":
        col = column
    else:
        # fallback to ref/stable ordering
        col = default_ref_col if default_ref_col is not None else column

    if dir_ == "asc":
        try:
            return col.asc().nulls_last()
        except Exception:
            # best-effort fallback if nulls_last() not available
            return asc(col)
    else:
        try:
            return col.desc().nulls_last()
        except Exception:
            return desc(col)


# ---------------------------
# Create / Read / Update for Business (morale)
# ---------------------------

@router.post("/", response_model=BusinessRecOut)
def create_business_rec(payload: BusinessRecCreate, db: Session = Depends(get_db)):
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

    # pagination
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    include_total: bool = Query(False),

    # filters
    business_risk: Optional[List[Literal["HIGH_RISK", "MEDIUM_RISK", "LOW_RISK"]]] = Query(None),
    segment: Optional[List[Literal["Entreprise", "Business", "SME", "Small Business", "Startup"]]] = Query(None),

    # sorting
    sort_by: Optional[Literal["score", "ref"]] = Query(None),
    sort_dir: Optional[Literal["asc", "desc"]] = Query("desc"),
):
    """
    Morale:
      - Filter:
          business_risk -> BUSINESS_RISK_PROFILE in (HIGH_RISK, MEDIUM_RISK, LOW_RISK)
          segment       -> client_segment in (Entreprise, Business, SME, Small Business, Startup)
      - Sort:
          score -> client_score, or ref -> REF_PERSONNE
      - Pagination after filtering/sorting.
    """
    q = db.query(BusinessRec)

    if business_risk:
        q = q.filter(BusinessRec.BUSINESS_RISK_PROFILE.in_(business_risk))
    if segment:
        # If your threshold lives in another column, replace client_segment accordingly.
        q = q.filter(BusinessRec.client_segment.in_(segment))

    # build ordering (NULLS LAST)
    order_col = order_with_nulls(
        column=BusinessRec.client_score,
        by=sort_by,
        direction=sort_dir,
        default_ref_col=BusinessRec.REF_PERSONNE,
    )
    q = q.order_by(order_col)

    # apply pagination AFTER filters and sorting
    items = q.limit(limit).offset(offset).all()

    total: Optional[int] = None
    if include_total:
        cq = db.query(func.count(BusinessRec.REF_PERSONNE))
        if business_risk:
            cq = cq.filter(BusinessRec.BUSINESS_RISK_PROFILE.in_(business_risk))
        if segment:
            cq = cq.filter(BusinessRec.client_segment.in_(segment))
        total = cq.scalar()

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

    # pagination
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    include_total: bool = Query(False),

    # filters
    client_segment: Optional[List[Literal["Bronze", "Prospect", "Gold", "Premium", "Silver"]]] = Query(None),
    risk_profile: Optional[List[Literal["High Risk", "Medium Risk", "Low Risk"]]] = Query(None),

    # sorting
    sort_by: Optional[Literal["score", "ref"]] = Query(None),
    sort_dir: Optional[Literal["asc", "desc"]] = Query("desc"),
):
    """
    Physique:
      - Filter:
          client_segment -> client_segment in (Bronze, Prospect, Gold, Premium, Silver)
          risk_profile   -> risk_profile in ("High Risk", "Medium Risk", "Low Risk")
      - Sort:
          score -> client_score, or ref -> REF_PERSONNE
      - Pagination after filtering/sorting.
    """
    q = db.query(IndividualRec)

    if client_segment:
        q = q.filter(IndividualRec.client_segment.in_(client_segment))
    if risk_profile:
        q = q.filter(IndividualRec.risk_profile.in_(risk_profile))

    # build ordering (NULLS LAST)
    order_col = order_with_nulls(
        column=IndividualRec.client_score,
        by=sort_by,
        direction=sort_dir,
        default_ref_col=IndividualRec.REF_PERSONNE,
    )
    q = q.order_by(order_col)

    items = q.limit(limit).offset(offset).all()

    total: Optional[int] = None
    if include_total:
        cq = db.query(func.count(IndividualRec.REF_PERSONNE))
        if client_segment:
            cq = cq.filter(IndividualRec.client_segment.in_(client_segment))
        if risk_profile:
            cq = cq.filter(IndividualRec.risk_profile.in_(risk_profile))
        total = cq.scalar()

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

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(business_rec, k, v)

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
