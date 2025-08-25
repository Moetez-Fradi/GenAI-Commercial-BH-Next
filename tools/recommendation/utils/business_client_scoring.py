# business_client_scoring.py
import pandas as pd
from config import logger, BUSINESS_SEGMENT_THRESHOLDS, BUSINESS_RISK_PROFILES

def create_business_groups(df_personne_morale):
    logger.info("Creating business groups and risk profiles")
    df = df_personne_morale.copy()
    
    def group_secteur(secteur):
        secteur = str(secteur).upper()
        if any(word in secteur for word in ['CONSTRUCTION', 'INDUSTRIE', 'METALLURGIE', 'EXTRACTION']):
            return 'INDUSTRIE_ET_CONSTRUCTION'
        elif any(word in secteur for word in ['TRANSPORT', 'LOGISTIQUE']):
            return 'TRANSPORTS_ET_LOGISTIQUE'
        elif any(word in secteur for word in ['COMMERCE', 'VENTE']):
            return 'COMMERCE_ET_VENTE'
        elif any(word in secteur for word in ['SERVICES', 'CONSEIL', 'INFORMATIQUE']):
            return 'SERVICES_ET_CONSEIL'
        elif any(word in secteur for word in ['SANTÉ', 'MÉDICAL']):
            return 'SANTÉ_ET_SOCIAL'
        elif any(word in secteur for word in ['HÔTEL', 'RESTAURANT']):
            return 'HOTELLERIE_ET_TOURISME'
        elif any(word in secteur for word in ['AGRICULTURE', 'PÊCHE']):
            return 'AGRICULTURE_ET_RESSOURCES'
        else:
            return 'AUTRES_SECTEURS'
    
    def group_activite(activite):
        activite = str(activite).upper()
        if any(word in activite for word in ['FABRICATION', 'PRODUCTION']):
            return 'PRODUCTION_ET_FABRICATION'
        elif any(word in activite for word in ['CONSTRUCTION', 'BÂTIMENT']):
            return 'CONSTRUCTION_ET_BTP'
        elif any(word in activite for word in ['COMMERCE', 'VENTE']):
            return 'COMMERCE_ET_DISTRIBUTION'
        elif any(word in activite for word in ['SERVICE', 'CONSEIL']):
            return 'SERVICES_ET_CONSEIL'
        elif any(word in activite for word in ['TRANSPORT']):
            return 'TRANSPORTS_ET_LOGISTIQUE'
        else:
            return 'AUTRES_ACTIVITES'
    
    df['SECTEUR_GROUP'] = df['LIB_SECTEUR_ACTIVITE'].apply(group_secteur)
    df['ACTIVITE_GROUP'] = df['LIB_ACTIVITE'].apply(group_activite)
    
    def get_risk_profile(secteur_group, activite_group):
        high_risk = ['INDUSTRIE_ET_CONSTRUCTION', 'CONSTRUCTION_ET_BTP', 'TRANSPORTS_ET_LOGISTIQUE']
        if secteur_group in high_risk or activite_group in high_risk:
            return 'HIGH_RISK'
        elif secteur_group in ['COMMERCE_ET_VENTE', 'AGRICULTURE_ET_RESSOURCES']:
            return 'MEDIUM_RISK'
        else:
            return 'LOW_RISK'
    
    df['RISK_PROFILE'] = df.apply(lambda x: get_risk_profile(x['SECTEUR_GROUP'], x['ACTIVITE_GROUP']), axis=1)
    
    return df

def calculate_business_client_scores(df_contrats, df_personne_morale):
    """Calculate comprehensive scores for business clients"""
    logger.info("Calculating business client scores")
    
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
    client_metrics['loyalty_score'] = (
        (client_metrics['total_contracts'] / client_metrics['total_contracts'].max() * 30) +
        (client_metrics['product_variety'] / client_metrics['product_variety'].max() * 25) +
        (client_metrics['branch_variety'] / client_metrics['branch_variety'].max() * 20) +
        (client_metrics['active_contracts'] / client_metrics['total_contracts'].clip(lower=1) * 25)
    )
    
    client_metrics['financial_score'] = (
        (client_metrics['total_premiums_paid'] / client_metrics['total_premiums_paid'].max() * 45) +
        (client_metrics['avg_premium_per_contract'] / client_metrics['avg_premium_per_contract'].max() * 30) +
        (client_metrics['total_capital_assured'] / client_metrics['total_capital_assured'].max() * 25) 
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
    
    # Merge with business profile data
    df_scored_business = pd.merge(client_metrics, df_personne_morale, on='REF_PERSONNE', how='left')
    
    # Adjust scores based on business characteristics
    def adjust_business_scores(row):
        base_score = (
            row['loyalty_score'] * 0.35 +
            row['financial_score'] * 0.40 +
            row['payment_score'] * 0.25
        )
        
        # Business size adjustment
        size_adjustment = 1.0
        if row['total_capital_assured'] > 1000000:
            size_adjustment = 1.2
        elif row['total_capital_assured'] > 100000:
            size_adjustment = 1.1
        
        # Risk profile adjustment
        risk_adjustment = BUSINESS_RISK_PROFILES.get(row.get('RISK_PROFILE', 'MEDIUM_RISK'), 1.0)
        
        return base_score * size_adjustment * risk_adjustment
    
    df_scored_business['final_client_score'] = df_scored_business.apply(adjust_business_scores, axis=1).clip(0, 100)
    
    # Segment business clients
    def segment_business_clients(score):
        for segment, threshold in BUSINESS_SEGMENT_THRESHOLDS.items():
            if score >= threshold:
                return segment
        return 'Startup'
    
    df_scored_business['client_segment'] = df_scored_business['final_client_score'].apply(segment_business_clients)
    
    logger.info(f"Successfully scored {len(df_scored_business)} business clients")
    return df_scored_business