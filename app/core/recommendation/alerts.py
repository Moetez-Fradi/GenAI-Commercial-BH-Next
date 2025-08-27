import pandas as pd
from datetime import datetime, timedelta
from app.core.config import ALERT_CONFIG

def generate_alerts(df_contrats):
    """Generate alerts for insurance contracts - enhanced version"""
    alerts = []
    
    # Expiration alerts
    expiration_alerts = _generate_expiration_alerts(df_contrats)
    alerts.extend(expiration_alerts)
    
    # Payment alerts
    payment_alerts = _generate_payment_alerts(df_contrats)
    alerts.extend(payment_alerts)
    
    # Cancellation alerts
    cancellation_alerts = _generate_cancellation_alerts(df_contrats)
    alerts.extend(cancellation_alerts)
    
    # Low coverage alerts
    coverage_alerts = _generate_coverage_alerts(df_contrats)
    alerts.extend(coverage_alerts)
    
    return pd.DataFrame(alerts)

def _generate_expiration_alerts(df_contrats):
    """Generate alerts for expiring contracts"""
    alerts = []
    today = datetime.now()
    expiration_threshold = today + timedelta(days=ALERT_CONFIG['expiration_alert_days'])
    
    expiring_contracts = df_contrats[
        (df_contrats['DATE_EXPIRATION'].notna()) &
        (df_contrats['DATE_EXPIRATION'] <= expiration_threshold) &
        (df_contrats['LIB_ETAT_CONTRAT'] == 'EN COURS')
    ]
    
    for _, contract in expiring_contracts.iterrows():
        days_until_expiry = (contract['DATE_EXPIRATION'] - today).days
        alerts.append({
            'REF_PERSONNE': contract['REF_PERSONNE'],
            'alert_type': 'policy_expiring',
            'alert_message': f"Policy {contract['NUM_CONTRAT']} ({contract['LIB_PRODUIT']}) expires in {days_until_expiry} days",
            'alert_severity': 'High' if days_until_expiry < 15 else 'Medium',
            'contract_id': contract['NUM_CONTRAT'],
            'product': contract['LIB_PRODUIT'],
            'expiration_date': contract['DATE_EXPIRATION'],
            'days_until_expiry': days_until_expiry
        })
    
    return alerts

def _generate_payment_alerts(df_contrats):
    """Generate alerts for payment issues"""
    alerts = []
    today = datetime.now()
    
    overdue_contracts = df_contrats[
        (df_contrats['statut_paiement'] == 'Non payé') &
        (df_contrats['LIB_ETAT_CONTRAT'] == 'EN COURS') &
        (df_contrats['PROCHAIN_TERME'].notna())
    ]
    
    for _, contract in overdue_contracts.iterrows():
        next_term = pd.to_datetime(contract['PROCHAIN_TERME'])
        if next_term < today:
            overdue_days = (today - next_term).days
            if overdue_days >= ALERT_CONFIG['payment_overdue_days']:
                alerts.append({
                    'REF_PERSONNE': contract['REF_PERSONNE'],
                    'alert_type': 'payment_overdue',
                    'alert_message': f"Payment overdue for policy {contract['NUM_CONTRAT']} ({contract['LIB_PRODUIT']}) by {overdue_days} days",
                    'alert_severity': 'High',
                    'contract_id': contract['NUM_CONTRAT'],
                    'product': contract['LIB_PRODUIT'],
                    'premium_amount': contract.get('somme_quittances', 0),
                    'overdue_days': overdue_days
                })
    
    return alerts

def _generate_cancellation_alerts(df_contrats):
    """Generate alerts for recent cancellations"""
    alerts = []
    today = datetime.now()
    cancellation_threshold = today - timedelta(days=ALERT_CONFIG['recent_cancellation_days'])
    
    recent_cancellations = df_contrats[
        (df_contrats['LIB_ETAT_CONTRAT'] == 'RESILIE') &
        (df_contrats['DATE_EXPIRATION'] >= cancellation_threshold)
    ]
    
    for _, contract in recent_cancellations.iterrows():
        alerts.append({
            'REF_PERSONNE': contract['REF_PERSONNE'],
            'alert_type': 'recent_cancellation',
            'alert_message': f"Policy {contract['NUM_CONTRAT']} ({contract['LIB_PRODUIT']}) was recently cancelled",
            'alert_severity': 'Medium',
            'contract_id': contract['NUM_CONTRAT'],
            'product': contract['LIB_PRODUIT'],
            'cancellation_date': contract['DATE_EXPIRATION']
        })
    
    return alerts

def _generate_coverage_alerts(df_contrats):
    """Generate alerts for clients with low coverage"""
    alerts = []
    
    # Group by client and count contracts
    client_coverage = df_contrats.groupby('REF_PERSONNE').agg(
        total_contracts=('NUM_CONTRAT', 'count'),
        active_contracts=('LIB_ETAT_CONTRAT', lambda x: (x == 'EN COURS').sum()),
        total_premium=('somme_quittances', 'sum')
    ).reset_index()
    
    # Find clients with low coverage
    low_coverage_clients = client_coverage[
        (client_coverage['active_contracts'] <= 1) &
        (client_coverage['total_premium'] < 1000)  # Low premium indicates basic coverage only
    ]
    
    for _, client in low_coverage_clients.iterrows():
        alerts.append({
            'REF_PERSONNE': client['REF_PERSONNE'],
            'alert_type': 'low_coverage',
            'alert_message': f"Client has only {client['active_contracts']} active policy with low premium coverage",
            'alert_severity': 'Medium',
            'active_contracts': client['active_contracts'],
            'total_premium': client['total_premium']
        })
    
    return alerts