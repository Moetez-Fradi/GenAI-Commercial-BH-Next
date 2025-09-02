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

# If you need auth, re-enable:
# from app.utils.auth import get_current_user
# router = APIRouter(dependencies=[Depends(get_current_user)])
router = APIRouter()


# ---------------------------
# Helpers (MySQL-safe NULLS LAST)
# ---------------------------

def mysql_order_with_nulls_last(
    primary_col,
    direction: Optional[str],         # "asc" | "desc" | None
    fallback_ref_col=None
):
    """
    Emulate NULLS LAST for MySQL:
      ORDER BY (col IS NULL) ASC, col ASC|DESC
    (Non-null rows (0) first, NULL rows (1) last)

    For REF/stable ordering, just order by ref asc/desc without null handling.
    """
    dir_ = (direction or "desc").lower()
    if primary_col is None:
        # fallback on ref only
        if fallback_ref_col is None:
            raise ValueError("fallback_ref_col must be provided")
        return [asc(fallback_ref_col) if dir_ == "asc" else desc(fallback_ref_col)]

    nulls_last_clause = primary_col.is_(None).asc()  # 0 (not null) first, 1 (null) last
    main = asc(primary_col) if dir_ == "asc" else desc(primary_col)
    return [nulls_last_clause, main]


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
          score -> client_score (NULLS LAST via MySQL emulation), or
          ref   -> REF_PERSONNE
      - Pagination after filtering/sorting.
    """
    q = db.query(BusinessRec)

    if business_risk:
        q = q.filter(BusinessRec.BUSINESS_RISK_PROFILE.in_(business_risk))
    if segment:
        q = q.filter(BusinessRec.client_segment.in_(segment))

    if sort_by == "score":
        order_clauses = mysql_order_with_nulls_last(
            primary_col=BusinessRec.client_score,
            direction=sort_dir,
            fallback_ref_col=BusinessRec.REF_PERSONNE,
        )
        q = q.order_by(*order_clauses)
    else:
        # stable ref ordering
        q = q.order_by(asc(BusinessRec.REF_PERSONNE) if sort_dir == "asc" else desc(BusinessRec.REF_PERSONNE))

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
          score -> client_score (NULLS LAST via MySQL emulation), or
          ref   -> REF_PERSONNE
      - Pagination after filtering/sorting.
    """
    q = db.query(IndividualRec)

    if client_segment:
        q = q.filter(IndividualRec.client_segment.in_(client_segment))
    if risk_profile:
        q = q.filter(IndividualRec.risk_profile.in_(risk_profile))

    if sort_by == "score":
        order_clauses = mysql_order_with_nulls_last(
            primary_col=IndividualRec.client_score,
            direction=sort_dir,
            fallback_ref_col=IndividualRec.REF_PERSONNE,
        )
        q = q.order_by(*order_clauses)
    else:
        q = q.order_by(asc(IndividualRec.REF_PERSONNE) if sort_dir == "asc" else desc(IndividualRec.REF_PERSONNE))

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
