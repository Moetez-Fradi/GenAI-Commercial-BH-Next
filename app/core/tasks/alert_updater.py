# app/tasks/alert_updater.py
import os
import sys
import logging
import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from dateutil import parser as date_parser
from datetime import datetime, timedelta

from app.db.base import SessionLocal
from app.models.contract import Contract
from app.models.alerts import Alert
import asyncio

LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
logging.basicConfig(level=logging.INFO, stream=sys.stdout, format=LOG_FORMAT)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.INFO)
handler.setFormatter(logging.Formatter(LOG_FORMAT))
logger = logging.getLogger("alert_updater")
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(handler)
logger.propagate = False

def parse_date_safe(date_str):
    if not date_str:
        return None
    date_str = str(date_str).strip()
    try:
        return date_parser.parse(date_str)
    except Exception:
        from datetime import datetime as _dt
        for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return _dt.strptime(date_str, fmt)
            except Exception:
                continue
    return None

def run_alert_sync_once_sync(max_scan: int = 1000):
    pid = os.getpid()
    print(f"[alert_updater pid={pid}] (sync) Starting alert sync at {datetime.now().isoformat()}", flush=True)
    logger.info("Starting alert sync (sync) (pid=%d)", pid)

    session: Session = SessionLocal()
    try:
        today = datetime.now().date()
        cutoff_date = today + timedelta(days=15)

        # Query only non-expired contracts
        q = (
            session.query(Contract)
            .filter(Contract.DATE_EXPIRATION != None)
            .filter(Contract.DATE_EXPIRATION > today)
            .order_by(Contract.DATE_EXPIRATION.asc())
        )
        contracts = q.limit(max_scan).all()
        print(f"[alert_updater pid={pid}] Materialized {len(contracts)} contracts (limit={max_scan})", flush=True)

        # Counters
        parsed_count = created = updated = skipped_no_ref = skipped_unparseable = skipped_expired = 0
        parse_fail_samples = []
        close_samples = []

        # Temporary dict to hold best contract per REF_PERSONNE
        best_contracts = {}

        for c in contracts:
            date_exp = c.DATE_EXPIRATION
            exp_dt = parse_date_safe(date_exp)
            if not exp_dt:
                skipped_unparseable += 1
                if len(parse_fail_samples) < 10:
                    parse_fail_samples.append((c.index, c.REF_PERSONNE, date_exp))
                continue

            if exp_dt.date() > cutoff_date:
                print(f"[alert_updater pid={pid}] Reached beyond cutoff ({exp_dt.date()} > {cutoff_date}) — stopping.", flush=True)
                break

            parsed_count += 1
            ref = c.REF_PERSONNE
            num_contrat = c.NUM_CONTRAT
            lib_prod = c.LIB_PRODUIT
            days_until = (exp_dt.date() - today).days

            if ref is None or num_contrat is None:
                skipped_no_ref += 1
                continue

            # Only keep the contract with the closest expiration per REF_PERSONNE
            if ref not in best_contracts or exp_dt < best_contracts[ref]["exp_dt"]:
                best_contracts[ref] = {
                    "num_contrat": num_contrat,
                    "lib_prod": lib_prod,
                    "exp_dt": exp_dt,
                    "days_until": days_until,
                }

        # Now apply inserts/updates per REF_PERSONNE
        for ref, data in best_contracts.items():
            exp_dt = data["exp_dt"]
            days_until = data["days_until"]
            lib_prod = data["lib_prod"]
            num_contrat = data["num_contrat"]

            alert_message = f"Contract {num_contrat} ({lib_prod}) expires in {days_until} day(s)."
            existing_alert = session.query(Alert).get(ref)

            if existing_alert:
                existing_alert.product = lib_prod
                existing_alert.expiration_date = exp_dt
                existing_alert.days_until_expiry = days_until
                existing_alert.alert_message = alert_message
                existing_alert.alert_severity = "High"
                existing_alert.alert_type = "contract_expiry"
                updated += 1
            else:
                new_alert = Alert(
                    REF_PERSONNE=ref,
                    alert_type="contract_expiry",
                    alert_message=alert_message,
                    alert_severity="High",
                    product=lib_prod,
                    expiration_date=exp_dt,
                    days_until_expiry=days_until,
                )
                session.add(new_alert)
                created += 1

            if len(close_samples) < 10:
                close_samples.append((ref, num_contrat, exp_dt, days_until))

        session.commit()

        summary = {
            "materialized": len(contracts),
            "parsed": parsed_count,
            "created": created,
            "updated": updated,
            "skipped_no_ref": skipped_no_ref,
            "skipped_unparseable": skipped_unparseable,
            "skipped_expired": skipped_expired,
        }

        print(f"[alert_updater pid={pid}] FINAL SUMMARY: {summary}", flush=True)
        logger.info("Alert sync summary (sync): %s", summary)

        if parse_fail_samples:
            print(f"[alert_updater pid={pid}] Parse failures (sample): {parse_fail_samples}", flush=True)
        if close_samples:
            print(f"[alert_updater pid={pid}] Close-to-expiry samples: {close_samples[:20]}", flush=True)

    except Exception as e:
        logger.exception("Error running alert sync (sync): %s", e)
        print(f"[alert_updater pid={pid}] ERROR: {e}", flush=True)
        try:
            session.rollback()
        except Exception:
            pass
    finally:
        try:
            session.close()
        except Exception:
            pass
        print(f"[alert_updater pid={pid}] Finished alert sync at {datetime.now().isoformat()}", flush=True)
        logger.info("Alert sync finished (sync) (pid=%d)", pid)


async def run_alert_sync_once():
    pid = os.getpid()
    print(f"[alert_updater pid={pid}] Running alert sync wrapper at {datetime.now().isoformat()}", flush=True)
    logger.info("Running alert sync wrapper (pid=%d)", pid)

    try:
        await asyncio.to_thread(run_alert_sync_once_sync)
    except asyncio.CancelledError:
        logger.info("run_alert_sync_once wrapper cancelled (pid=%d)", pid)
        print(f"[alert_updater pid={pid}] CancelledError caught — exiting wrapper gracefully.", flush=True)
        return
    except Exception:
        logger.exception("Unhandled exception in run_alert_sync_once wrapper")
        print(f"[alert_updater pid={pid}] Unhandled exception — check logs.", flush=True)
        return

    logger.info("run_alert_sync_once wrapper completed (pid=%d)", pid)
    print(f"[alert_updater pid={pid}] Completed alert sync wrapper at {datetime.now().isoformat()}", flush=True)

# --- scheduler ---
scheduler = AsyncIOScheduler()

def start_scheduler():
    scheduler.add_job(
        run_alert_sync_once,
        trigger=IntervalTrigger(hours=24),
        next_run_time=datetime.now(),
        max_instances=1
    )
    scheduler.start()
    logger.info("Alert updater scheduler started (every 24 hours).")
    print("[alert_updater] Scheduler started (every 24 hours).", flush=True)

def stop_scheduler():
    asyncio.create_task(_stop_scheduler_async())

async def _stop_scheduler_async():
    scheduler.shutdown(wait=False)
    logger.info("Alert updater scheduler stopped (forceful).")
    print("[alert_updater] Scheduler stopped (forceful).", flush=True)
