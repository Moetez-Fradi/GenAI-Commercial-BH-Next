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
from app.schemas.individual_rec import PaginatedIndividualRecOut,IndividualRecOut

router = APIRouter()

def mysql_order_with_nulls_last(
    primary_col,
    direction: Optional[str],       
    fallback_ref_col=None
):
    dir_ = (direction or "desc").lower()
    if primary_col is None:
        if fallback_ref_col is None:
            raise ValueError("fallback_ref_col must be provided")
        return [asc(fallback_ref_col) if dir_ == "asc" else desc(fallback_ref_col)]

    nulls_last_clause = primary_col.is_(None).asc()
    main = asc(primary_col) if dir_ == "asc" else desc(primary_col)
    return [nulls_last_clause, main]


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

    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    include_total: bool = Query(False),

    client_segment: Optional[List[Literal["Bronze", "Prospect", "Gold", "Premium", "Silver"]]] = Query(None),
    risk_profile: Optional[List[Literal["High Risk", "Medium Risk", "Low Risk"]]] = Query(None),

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

@router.get("/{ref_personne}")
def get_client_by_ref(ref_personne: int, db: Session = Depends(get_db)):
    # Check both tables and determine which one exists
    business_rec = db.query(BusinessRec).filter(BusinessRec.REF_PERSONNE == ref_personne).first()
    individual_rec = db.query(IndividualRec).filter(IndividualRec.REF_PERSONNE == ref_personne).first()
    
    if business_rec and individual_rec:
        # This shouldn't happen normally, but handle the case where same REF_PERSONNE exists in both tables
        raise HTTPException(status_code=400, detail="Client exists in both moral and physical tables")
    
    if business_rec:
        return {
            "type": "moral",
            "data": {
                "REF_PERSONNE": business_rec.REF_PERSONNE,
                "RAISON_SOCIALE": business_rec.RAISON_SOCIALE,
                "client_segment": business_rec.client_segment,
                "risk_profile": business_rec.risk_profile,
                "client_score": float(business_rec.client_score) if business_rec.client_score is not None else None,
                "estimated_budget": float(business_rec.estimated_budget) if business_rec.estimated_budget is not None else None,
                "recommended_products": business_rec.recommended_products,
                "recommendation_count": business_rec.recommendation_count,
                "SECTEUR_GROUP": business_rec.SECTEUR_GROUP,
                "ACTIVITE_GROUP": business_rec.ACTIVITE_GROUP,
                "BUSINESS_RISK_PROFILE": business_rec.BUSINESS_RISK_PROFILE,
                "total_capital_assured": business_rec.total_capital_assured,
                "total_premiums_paid": business_rec.total_premiums_paid,
                "client_type": business_rec.client_type,
            }
        }
    
    if individual_rec:
        return {
            "type": "physical",
            "data": {
                "REF_PERSONNE": individual_rec.REF_PERSONNE,
                "NOM_PRENOM": individual_rec.NOM_PRENOM,
                "name": individual_rec.NOM_PRENOM,
                "client_segment": individual_rec.client_segment,
                "risk_profile": individual_rec.risk_profile,
                "client_score": float(individual_rec.client_score) if individual_rec.client_score is not None else None,
                "estimated_budget": float(individual_rec.estimated_budget) if individual_rec.estimated_budget is not None else None,
                "AGE": float(individual_rec.AGE) if individual_rec.AGE is not None else None,
                "PROFESSION_GROUP": individual_rec.PROFESSION_GROUP,
                "SITUATION_FAMILIALE": individual_rec.SITUATION_FAMILIALE,
                "SECTEUR_ACTIVITE_GROUP": individual_rec.SECTEUR_ACTIVITE_GROUP,
                "recommended_products": individual_rec.recommended_products,
                "recommendation_count": individual_rec.recommendation_count,
                "client_type": individual_rec.client_type,
            }
        }
    
    raise HTTPException(status_code=404, detail="Client not found")

@router.get("/morale/{ref_personne}", response_model=BusinessRecOut)
def get_business_client(ref_personne: int, db: Session = Depends(get_db)):
    business_rec = db.query(BusinessRec).filter(BusinessRec.REF_PERSONNE == ref_personne).first()
    if not business_rec:
        raise HTTPException(status_code=404, detail="Business client not found")
    return business_rec

@router.get("/physique/{ref_personne}", response_model=IndividualRecOut)
def get_individual_client(ref_personne: int, db: Session = Depends(get_db)):
    individual_rec = db.query(IndividualRec).filter(IndividualRec.REF_PERSONNE == ref_personne).first()
    if not individual_rec:
        raise HTTPException(status_code=404, detail="Individual client not found")
    return individual_rec
