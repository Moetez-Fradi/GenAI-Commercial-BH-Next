from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc
from typing import List, Optional, Literal

from app.db.base import get_db
from app.models.alerts import Alert
from app.schemas.alerts import (
    AlertCreate,
    AlertOut,
    AlertUpdate,
    PaginatedAlertOut
)

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


@router.post("/", response_model=AlertOut)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    existing = db.query(Alert).filter(Alert.REF_PERSONNE == payload.REF_PERSONNE).first()
    if existing:
        raise HTTPException(status_code=400, detail="Alert already exists")

    alert = Alert(
        REF_PERSONNE=payload.REF_PERSONNE,
        alert_type=payload.alert_type,
        alert_message=payload.alert_message,
        alert_severity=payload.alert_severity,
        product=payload.product,
        expiration_date=payload.expiration_date,
        days_until_expiry=payload.days_until_expiry,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/", response_model=PaginatedAlertOut)
def list_alerts(
    db: Session = Depends(get_db),

    # pagination
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    include_total: bool = Query(False),

    # filters
    severity: Optional[List[Literal["High"]]] = Query(None),
    alert_type: Optional[List[str]] = Query(None),
    product: Optional[List[str]] = Query(None),

    # sorting
    sort_by: Optional[Literal["expiry", "ref"]] = Query(None),
    sort_dir: Optional[Literal["asc", "desc"]] = Query("desc"),
):
    q = db.query(Alert)

    # Apply filters
    if severity:
        q = q.filter(Alert.alert_severity.in_(severity))
    if alert_type:
        q = q.filter(Alert.alert_type.in_(alert_type))
    if product:
        q = q.filter(Alert.product.in_(product))

    # Apply sorting
    if sort_by == "expiry":
        order_clauses = mysql_order_with_nulls_last(
            primary_col=Alert.days_until_expiry,
            direction=sort_dir,
            fallback_ref_col=Alert.REF_PERSONNE,
        )
        q = q.order_by(*order_clauses)
    else:
        # Default sort by REF_PERSONNE
        q = q.order_by(asc(Alert.REF_PERSONNE) if sort_dir == "asc" else desc(Alert.REF_PERSONNE))

    items = q.limit(limit).offset(offset).all()

    total: Optional[int] = None
    if include_total:
        cq = db.query(func.count(Alert.REF_PERSONNE))
        if severity:
            cq = cq.filter(Alert.alert_severity.in_(severity))
        if alert_type:
            cq = cq.filter(Alert.alert_type.in_(alert_type))
        if product:
            cq = cq.filter(Alert.product.in_(product))
        total = cq.scalar()

    has_more = len(items) == limit and (total is None or (offset + limit) < total)

    return PaginatedAlertOut(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
        has_more=has_more,
    )


@router.get("/{ref_personne}", response_model=AlertOut)
def get_alert(ref_personne: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.REF_PERSONNE == ref_personne).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.put("/{ref_personne}", response_model=AlertOut)
def update_alert(ref_personne: int, payload: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.REF_PERSONNE == ref_personne).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(alert, k, v)

    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{ref_personne}", response_model=AlertOut)
def delete_alert(ref_personne: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.REF_PERSONNE == ref_personne).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return alert


@router.get("/stats/summary")
def get_alert_stats(db: Session = Depends(get_db)):

    total_count = db.query(func.count(Alert.REF_PERSONNE)).scalar()
    
    return {
        "by_severity": {"High": total_count},
        "total": total_count
    }