# app/api/routes/client.py
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
from app.db.base import get_db
from app.models.business_rec import BusinessRec
from app.models.individual_rec import IndividualRec

router = APIRouter()


def _paginate_and_format(
    items: List[Any], limit: int, offset: int, include_total: bool, total_count: Optional[int]
) -> Dict[str, Any]:
    has_more = False
    if include_total:
        total = total_count if total_count is not None else len(items)
        has_more = (offset + limit) < (total or 0)
    else:
        total = None
        # If we fetched exactly `limit` items, allow "has_more" true as conservative.
        has_more = len(items) == limit
    return {"items": items, "total": total, "limit": limit, "offset": offset, "has_more": has_more}


def _row_to_moral_dict(row: BusinessRec) -> Dict[str, Any]:
    return {
        "REF_PERSONNE": getattr(row, "REF_PERSONNE"),
        "ref_personne": getattr(row, "REF_PERSONNE"),
        "raison_sociale": getattr(row, "RAISON_SOCIALE"),
        "RAISON_SOCIALE": getattr(row, "RAISON_SOCIALE"),
        "recommended_products": getattr(row, "recommended_products"),
        "recommendation_count": getattr(row, "recommendation_count"),
        "client_score": float(row.client_score) if row.client_score is not None else None,
        "client_segment": getattr(row, "client_segment"),
        "risk_profile": getattr(row, "risk_profile"),
        "estimated_budget": float(row.estimated_budget) if row.estimated_budget is not None else None,
        "total_capital_assured": float(row.total_capital_assured) if getattr(row, "total_capital_assured", None) is not None else None,
        "total_premiums_paid": float(row.total_premiums_paid) if getattr(row, "total_premiums_paid", None) is not None else None,
        "client_type": getattr(row, "client_type"),
    }


def _row_to_physique_dict(row: IndividualRec) -> Dict[str, Any]:
    return {
        "REF_PERSONNE": getattr(row, "REF_PERSONNE"),
        "ref_personne": getattr(row, "REF_PERSONNE"),
        "NOM_PRENOM": getattr(row, "NOM_PRENOM"),
        "name": getattr(row, "NOM_PRENOM"),
        "recommended_products": getattr(row, "recommended_products"),
        "recommendation_count": getattr(row, "recommendation_count"),
        "client_score": float(row.client_score) if row.client_score is not None else None,
        "client_segment": getattr(row, "client_segment"),
        "risk_profile": getattr(row, "risk_profile"),
        "estimated_budget": float(row.estimated_budget) if row.estimated_budget is not None else None,
        "AGE": float(row.AGE) if getattr(row, "AGE", None) is not None else None,
        "PROFESSION_GROUP": getattr(row, "PROFESSION_GROUP", None),
        "SITUATION_FAMILIALE": getattr(row, "SITUATION_FAMILIALE", None),
        "SECTEUR_ACTIVITE_GROUP": getattr(row, "SECTEUR_ACTIVITE_GROUP", None),
        "client_type": getattr(row, "client_type"),
    }


@router.get("/morale")
def list_morale(
    limit: int = Query(10, gt=0, le=200),
    offset: int = Query(0, ge=0),
    include_total: bool = Query(False),
    sort_by: str = Query("score", regex="^(score|ref)$"),
    sort_dir: str = Query("desc", regex="^(asc|desc)$"),
    segment: Optional[str] = Query(None),
    business_risk: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List corporate clients (business_recommendations).
    - sort_by: 'score' or 'ref'
    - sort_dir: 'asc' or 'desc'
    - segment -> client_segment
    - business_risk -> risk_profile
    """
    query = db.query(BusinessRec)

    if segment:
        query = query.filter(BusinessRec.client_segment == segment)
    if business_risk:
        query = query.filter(BusinessRec.risk_profile == business_risk)

    # Sorting: avoid DB-specific NULLS LAST syntax; use boolean expression to push NULLs last.
    if sort_by == "score":
        # Put non-null rows first by ordering on (client_score IS NULL) ascending (False/0 before True/1),
        # then order by client_score direction.
        if sort_dir == "desc":
            query = query.order_by((BusinessRec.client_score == None).asc(), BusinessRec.client_score.desc())
        else:
            query = query.order_by((BusinessRec.client_score == None).asc(), BusinessRec.client_score.asc())
    else:
        # sort by REF_PERSONNE
        if sort_dir == "desc":
            query = query.order_by(desc(BusinessRec.REF_PERSONNE))
        else:
            query = query.order_by(asc(BusinessRec.REF_PERSONNE))

    total_count = query.count() if include_total else None
    rows = query.offset(offset).limit(limit).all()
    mapped = [_row_to_moral_dict(r) for r in rows]
    return _paginate_and_format(mapped, limit, offset, include_total, total_count)


@router.get("/physique")
def list_physique(
    limit: int = Query(10, gt=0, le=200),
    offset: int = Query(0, ge=0),
    include_total: bool = Query(False),
    sort_by: str = Query("score", regex="^(score|ref)$"),
    sort_dir: str = Query("desc", regex="^(asc|desc)$"),
    client_segment: Optional[str] = Query(None),
    risk_profile: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List individual clients (individual_recommendations).
    - sort_by: 'score' or 'ref'
    - client_segment -> client_segment
    - risk_profile -> risk_profile
    """
    query = db.query(IndividualRec)

    if client_segment:
        query = query.filter(IndividualRec.client_segment == client_segment)
    if risk_profile:
        query = query.filter(IndividualRec.risk_profile == risk_profile)

    # Sorting: portable way to keep NULLs last
    if sort_by == "score":
        if sort_dir == "desc":
            query = query.order_by((IndividualRec.client_score == None).asc(), IndividualRec.client_score.desc())
        else:
            query = query.order_by((IndividualRec.client_score == None).asc(), IndividualRec.client_score.asc())
    else:
        if sort_dir == "desc":
            query = query.order_by(desc(IndividualRec.REF_PERSONNE))
        else:
            query = query.order_by(asc(IndividualRec.REF_PERSONNE))

    total_count = query.count() if include_total else None
    rows = query.offset(offset).limit(limit).all()
    mapped = [_row_to_physique_dict(r) for r in rows]
    return _paginate_and_format(mapped, limit, offset, include_total, total_count)


@router.get("/{ref_personne}")
def get_client(ref_personne: int, db: Session = Depends(get_db)):
    m = db.query(BusinessRec).filter(BusinessRec.REF_PERSONNE == ref_personne).first()
    if m:
        return _row_to_moral_dict(m)
    p = db.query(IndividualRec).filter(IndividualRec.REF_PERSONNE == ref_personne).first()
    if p:
        return _row_to_physique_dict(p)
    raise HTTPException(status_code=404, detail="Client not found")