import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from app.core.config import logger, CLAIMS_ANALYSIS_CONFIG

def analyze_claims_for_client(client_id, df_sinistres):
    """Analyze claims for a specific client"""
    if df_sinistres is None:
        return {}
    
    client_claims = df_sinistres[df_sinistres['REF_PERSONNE'] == client_id]
    
    if client_claims.empty:
        return {
            'total_claims': 0,
            'claims_risk_score': 0,
            'claims_trend': 'none'
        }
    
    # Calculate basic metrics
    total_claims = len(client_claims)
    total_claim_amount = client_claims['MONTANT_ENCAISSE'].sum()
    avg_claim_amount = client_claims['MONTANT_ENCAISSE'].mean()
    
    # Calculate recent claims
    today = datetime.now()
    recent_days = timedelta(days=CLAIMS_ANALYSIS_CONFIG['recent_claims_days'])
    recent_claims = client_claims[client_claims['DATE_SURVENANCE'] >= (today - recent_days)]
    
    # Calculate high-risk claims
    high_risk_claims = client_claims[
        client_claims['TAUX_RESPONSABILITE'] >= CLAIMS_ANALYSIS_CONFIG['high_risk_responsibility_rate']
    ]
    
    # Calculate risk score
    risk_score = _calculate_claims_risk_score(
        total_claims, 
        len(recent_claims),
        len(high_risk_claims),
        avg_claim_amount
    )
    
    # Determine trend
    trend = _determine_claims_trend(client_claims)
    
    return {
        'total_claims': total_claims,
        'total_claim_amount': total_claim_amount,
        'avg_claim_amount': avg_claim_amount,
        'recent_claims': len(recent_claims),
        'high_risk_claims': len(high_risk_claims),
        'claims_risk_score': risk_score,
        'claims_trend': trend
    }

def _calculate_claims_risk_score(total_claims, recent_claims, high_risk_claims, avg_claim_amount):
    """Calculate a risk score based on claims history"""
    risk_score = 0
    
    # Base risk from total claims
    if total_claims > CLAIMS_ANALYSIS_CONFIG['multiple_claims_threshold']:
        risk_score += 30
    
    # Risk from recent claims
    risk_score += min(recent_claims * 15, 30)
    
    # Risk from high-responsibility claims
    risk_score += min(high_risk_claims * 20, 30)
    
    # Risk from large claims
    if avg_claim_amount > CLAIMS_ANALYSIS_CONFIG['large_claim_threshold']:
        risk_score += 10
    
    return min(risk_score, 100)

def _determine_claims_trend(client_claims):
    """Determine the trend of claims over time"""
    if len(client_claims) < 2:
        return 'stable'
    
    # Sort by date and check if claims are increasing
    sorted_claims = client_claims.sort_values('DATE_SURVENANCE')
    recent_half = sorted_claims.tail(len(sorted_claims) // 2)
    older_half = sorted_claims.head(len(sorted_claims) // 2)
    
    recent_count = len(recent_half)
    older_count = len(older_half)
    
    if recent_count > older_count * 1.5:
        return 'increasing'
    elif recent_count < older_count * 0.7:
        return 'decreasing'
    else:
        return 'stable'