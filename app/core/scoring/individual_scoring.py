import pandas as pd
from app.core.config import SCORING_WEIGHTS, SEGMENT_THRESHOLDS, RISK_THRESHOLDS
from app.core.grouping_utils import create_profession_groups, create_sector_groups

def calculate_individual_scores(df_contrats, df_clients):
    """Calculate comprehensive scores for individual clients"""
    
    # First, create profession and sector groups
    df_clients = create_profession_groups(df_clients)
    df_clients = create_sector_groups(df_clients)
    
    # Calculate contract-based metrics
    client_metrics = df_contrats.groupby('REF_PERSONNE').agg(
        total_contracts=('NUM_CONTRAT', 'count'),
        active_contracts=('LIB_ETAT_CONTRAT', lambda x: (x == 'EN COURS').sum()),
        product_variety=('LIB_PRODUIT', 'nunique'),
        branch_variety=('branche', 'nunique'),
        total_premiums_paid=('somme_quittances', 'sum'),
        avg_premium_per_contract=('somme_quittances', 'mean'),
        max_premium=('somme_quittances', 'max'),
        total_capital_assured=('Capital_assure', 'sum'),
        avg_capital_per_contract=('Capital_assure', 'mean'),
        paid_ratio=('statut_paiement', lambda x: (x == 'Payé').mean()),
        total_paid_contracts=('statut_paiement', lambda x: (x == 'Payé').sum()),
        total_unpaid_contracts=('statut_paiement', lambda x: (x == 'Non payé').sum()),
        expired_contracts=('LIB_ETAT_CONTRAT', lambda x: (x == 'EXPIRE').sum()),
        canceled_contracts=('LIB_ETAT_CONTRAT', lambda x: (x == 'RESILIE').sum()),
        active_ratio=('LIB_ETAT_CONTRAT', lambda x: (x == 'EN COURS').mean())
    ).reset_index()

    # Create derived metrics
    client_metrics['premium_per_contract_ratio'] = client_metrics['max_premium'] / client_metrics['avg_premium_per_contract'].clip(lower=1)
    client_metrics['capital_premium_ratio'] = client_metrics['total_capital_assured'] / client_metrics['total_premiums_paid'].clip(lower=1)
    client_metrics['product_density'] = client_metrics['product_variety'] / client_metrics['total_contracts'].clip(lower=1)

    # Calculate component scores
    client_metrics['loyalty_score'] = (
        (client_metrics['total_contracts'] / client_metrics['total_contracts'].max() * 30) +
        (client_metrics['product_variety'] / client_metrics['product_variety'].max() * 25) +
        (client_metrics['branch_variety'] / client_metrics['branch_variety'].max() * 20) +
        (client_metrics['active_contracts'] / client_metrics['total_contracts'].clip(lower=1) * 25)
    )
    
    client_metrics['financial_score'] = (
        (client_metrics['total_premiums_paid'] / client_metrics['total_premiums_paid'].max() * 35) +
        (client_metrics['avg_premium_per_contract'] / client_metrics['avg_premium_per_contract'].max() * 25) +
        (client_metrics['total_capital_assured'] / client_metrics['total_capital_assured'].max() * 20) +
        (1 / client_metrics['premium_per_contract_ratio'] * 20)
    )
    
    client_metrics['payment_score'] = (
        (client_metrics['paid_ratio'] * 40) +
        ((1 - client_metrics['canceled_contracts'] / client_metrics['total_contracts'].clip(lower=1)) * 30) +
        (client_metrics['total_paid_contracts'] / client_metrics['total_contracts'].clip(lower=1) * 30)
    )
    
    # Normalize scores
    for score_col in ['loyalty_score', 'financial_score', 'payment_score']:
        client_metrics[score_col] = (
            (client_metrics[score_col] - client_metrics[score_col].min()) / 
            (client_metrics[score_col].max() - client_metrics[score_col].min()) * 100
        ).fillna(0)
    
    # Merge with client profile data
    df_scored = pd.merge(client_metrics, df_clients, on='REF_PERSONNE', how='right')
    
    # Calculate final score
    weights = SCORING_WEIGHTS['individual']
    df_scored['final_client_score'] = (
        df_scored['loyalty_score'] * weights['loyalty'] +
        df_scored['financial_score'] * weights['financial'] + 
        df_scored['payment_score'] * weights['payment']
    ).fillna(0).clip(0, 100)
    
    # Segment clients
    df_scored['client_segment'] = df_scored['final_client_score'].apply(
        lambda x: segment_clients(x, SEGMENT_THRESHOLDS['individual'])
    )
    
    # Risk assessment
    df_scored['risk_profile'] = df_scored['payment_score'].apply(assess_risk)
    
    # Add client type
    df_scored['client_type'] = 'individual'
    
    return df_scored

def segment_clients(score, thresholds):
    """Segment clients based on score"""
    for segment, threshold in thresholds.items():
        if score >= threshold:
            return segment
    return 'Prospect'

def assess_risk(payment_score):
    """Assess risk based on payment score"""
    for risk_level, threshold in RISK_THRESHOLDS.items():
        if payment_score >= threshold:
            return risk_level
    return 'High Risk'