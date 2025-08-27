import pandas as pd
from app.core.config import SCORING_WEIGHTS, SEGMENT_THRESHOLDS, RISK_THRESHOLDS, BUSINESS_RISK_PROFILES
from app.core.grouping_utils import create_business_groups

def calculate_business_scores(df_contrats, df_personne_morale):
    """Calculate comprehensive scores for business clients"""
    
    # First, group the business sectors and activities
    df_personne_morale = create_business_groups(df_personne_morale)
    
    # Calculate contract-based metrics
    client_metrics = df_contrats.groupby('REF_PERSONNE').agg(
        total_contracts=('NUM_CONTRAT', 'count'),
        active_contracts=('LIB_ETAT_CONTRAT', lambda x: (x == 'EN COURS').sum()),
        product_variety=('LIB_PRODUIT', 'nunique'),
        branch_variety=('branche', 'nunique'),
        total_premiums_paid=('somme_quittances', 'sum'),
        avg_premium_per_contract=('somme_quittances', 'mean'),
        total_capital_assured=('Capital_assure', 'sum'),
        paid_ratio=('statut_paiement', lambda x: (x == 'Payé').mean()),
        total_paid_contracts=('statut_paiement', lambda x: (x == 'Payé').sum()),
        canceled_contracts=('LIB_ETAT_CONTRAT', lambda x: (x == 'RESILIE').sum()),
    ).reset_index()

    # Calculate component scores
    client_metrics['loyalty_score'] = calculate_business_loyalty_score(client_metrics)
    client_metrics['financial_score'] = calculate_business_financial_score(client_metrics)
    client_metrics['payment_score'] = calculate_business_payment_score(client_metrics)
    
    # Normalize scores
    for score_col in ['loyalty_score', 'financial_score', 'payment_score']:
        client_metrics[score_col] = normalize_score(client_metrics[score_col])
    
    # Merge with business data
    df_scored = pd.merge(df_personne_morale, client_metrics, on='REF_PERSONNE', how='left')
    
    # Calculate final score with business adjustments
    weights = SCORING_WEIGHTS['business']
    df_scored['final_client_score'] = (
        df_scored['loyalty_score'] * weights['loyalty'] +
        df_scored['financial_score'] * weights['financial'] + 
        df_scored['payment_score'] * weights['payment']
    ).fillna(0).clip(0, 100)
    
    # Apply business-specific adjustments
    df_scored = apply_business_adjustments(df_scored)
    
    # Segment businesses
    df_scored['client_segment'] = df_scored['final_client_score'].apply(
        lambda x: segment_clients(x, SEGMENT_THRESHOLDS['business'])
    )
    
    # Risk assessment
    df_scored['risk_profile'] = df_scored['payment_score'].apply(assess_risk)
    
    # Add client type
    df_scored['client_type'] = 'business'
    
    return df_scored

def calculate_business_loyalty_score(metrics):
    """Calculate business loyalty score"""
    return (
        (metrics['total_contracts'] / metrics['total_contracts'].max() * 25) +
        (metrics['product_variety'] / metrics['product_variety'].max() * 20) +
        (metrics['branch_variety'] / metrics['branch_variety'].max() * 15) +
        (metrics['active_contracts'] / metrics['total_contracts'].clip(lower=1) * 20)
    )

def calculate_business_financial_score(metrics):
    """Calculate business financial score"""
    return (
        (metrics['total_premiums_paid'] / metrics['total_premiums_paid'].max() * 40) +
        (metrics['avg_premium_per_contract'] / metrics['avg_premium_per_contract'].max() * 30) +
        (metrics['total_capital_assured'] / metrics['total_capital_assured'].max() * 30)
    )

def calculate_business_payment_score(metrics):
    """Calculate business payment score"""
    return (
        (metrics['paid_ratio'] * 50) +
        ((1 - metrics['canceled_contracts'] / metrics['total_contracts'].clip(lower=1)) * 25) +
        (metrics['total_paid_contracts'] / metrics['total_contracts'].clip(lower=1) * 25)
    )

def apply_business_adjustments(df_scored):
    """Apply business-specific score adjustments"""
    # Size-based adjustment
    df_scored['size_adjustment'] = 1.0
    df_scored.loc[df_scored['total_capital_assured'] > 1000000, 'size_adjustment'] = 1.2
    df_scored.loc[df_scored['total_capital_assured'] > 100000, 'size_adjustment'] = 1.1
    
    # Risk profile adjustment
    df_scored['risk_adjustment'] = df_scored['RISK_PROFILE'].map(BUSINESS_RISK_PROFILES).fillna(1.0)
    
    # Apply adjustments
    df_scored['final_client_score'] = df_scored['final_client_score'] * df_scored['size_adjustment'] * df_scored['risk_adjustment']
    df_scored['final_client_score'] = df_scored['final_client_score'].clip(0, 100)
    
    return df_scored

def normalize_score(series):
    """Normalize score to 0-100 scale"""
    return ((series - series.min()) / (series.max() - series.min()) * 100).fillna(0)

def segment_clients(score, thresholds):
    """Segment clients based on score"""
    for segment, threshold in thresholds.items():
        if score >= threshold:
            return segment
    return 'Startup'

def assess_risk(payment_score):
    """Assess risk based on payment score"""
    for risk_level, threshold in RISK_THRESHOLDS.items():
        if payment_score >= threshold:
            return risk_level
    return 'High Risk'