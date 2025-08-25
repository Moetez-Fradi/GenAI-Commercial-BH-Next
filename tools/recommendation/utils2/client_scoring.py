# client_scoring.py
import pandas as pd
from config import logger, SCORING_WEIGHTS, SEGMENT_THRESHOLDS, RISK_THRESHOLDS

def create_profession_groups(df):
    logger.info("Creating profession groups...")
    
    def group_profession(profession):
        if pd.isna(profession):
            return 'NON_RENSEIGNE'
        
        prof_str = str(profession).upper()
        
        # Handle non-specific categories first
        if any(word in prof_str for word in ['NON FOURNI', 'NON DEFINIE', 'NON_RENSEIGNE', 'NON RENSEIGNE']):
            return 'NON_RENSEIGNE'
        if 'RETRAITE' in prof_str or 'ANCIEN' in prof_str:
            return 'RETRAITES'
        if any(word in prof_str for word in ['ETUDIANT', 'ELEVE', 'ECOLIER', 'STAGIAIRE']):
            return 'ETUDIANTS'
        if any(word in prof_str for word in ['CHOMAGE', 'SANS EMPLOI', 'AUCUN', 'AUCUNE ACTIVITE']):
            return 'SANS_EMPLOI'
        
        # High-income professionals
        if any(word in prof_str for word in ['CADRE', 'INGENIEUR', 'ARCHITECTE', 'EXPERT', 'CONSULTANT', 
                                           'DIRECTEUR', 'MANAGER', 'CHEF SERVICE', 'RESPONSABLE', 'BANQUIER',
                                           'AVOCAT', 'MEDECIN', 'PHARMACIEN', 'DENTISTE', 'VETERINAIRE',
                                           'JOURNALISTE', 'PROFESSEUR', 'ENSEIGNANT', 'CHERCHEUR', 'MAITRE']):
            return 'CADRES_SUPERIEURS'
        
        # Commercial and sales professions
        if any(word in prof_str for word in ['COMMERCIAL', 'VENDEUR', 'GERANT', 'NEGOCIANT', 'REPRESENTANT',
                                           'DELEGUE', 'COURTIER', 'AGENT COMMERCIAL', 'CONSEILLER COMMERCIAL']):
            return 'COMMERCE_ET_VENTE'
        
        # Technical and engineering professions
        if any(word in prof_str for word in ['TECHNICIEN', 'ELECTRICIEN', 'MECANICIEN', 'PLOMBIER', 'CHAUFFAGISTE',
                                           'SOUDEUR', 'MONTEUR', 'OPERATEUR', 'CONTRÔLEUR', 'MAINTENANCE']):
            return 'TECHNICIENS_ET_ARTISANS'
        
        # Administrative and office workers
        if any(word in prof_str for word in ['ADMINISTRATIF', 'SECRETAIRE', 'COMPTABLE', 'GESTIONNAIRE', 'AGENT',
                                           'EMPLOYE', 'ASSISTANT', 'CAISSIER', 'STANDARDISTE', 'DACTYLO']):
            return 'ADMINISTRATION_ET_BUREAU'
        
        # Healthcare professions
        if any(word in prof_str for word in ['INFIRMIER', 'AIDE SOIGNANT', 'KINESITHERAPEUTE', 'SAGE FEMME',
                                           'MEDICAL', 'PHARMACEUTIQUE', 'BIOLOGISTE', 'RADIOLOGUE']):
            return 'SANTE_ET_MEDICAL'
        
        # Security and defense
        if any(word in prof_str for word in ['POLICE', 'GENDARME', 'MILITAIRE', 'SECURITE', 'SURVEILLANT',
                                           'GARDIEN', 'DOUANE', 'POMPIER', 'AGENT DE SECURITE']):
            return 'SECURITE_ET_DEFENSE'
        
        # Transportation professionals
        if any(word in prof_str for word in ['CHAUFFEUR', 'CONDUCTEUR', 'PILOTE', 'TAXISTE', 'ROUTIER',
                                           'TRANSPORT', 'LIVREUR', 'AMBULANCIER', 'MARIN']):
            return 'TRANSPORTS'
        
        # Education and social services
        if any(word in prof_str for word in ['EDUCATEUR', 'FORMATEUR', 'ANIMATEUR', 'ASSISTANT SOCIAL', 
                                           'MONITEUR', 'PROFESSEUR', 'ENSEIGNANT', 'INSTITUTEUR']):
            return 'EDUCATION_ET_SOCIAL'
        
        # Construction and manual labor
        if any(word in prof_str for word in ['OUVRIER', 'MACON', 'MENUISIER', 'PEINTRE', 'CARRELEUR',
                                           'PLATRIER', 'CHARBENTIER', 'CONSTRUCT', 'BATIMENT', 'CHANTIER']):
            return 'BATIMENT_ET_TRAVAUX'
        
        # Agriculture and fishing
        if any(word in prof_str for word in ['AGRICULTEUR', 'ELEVEUR', 'PECHEUR', 'VITICULTEUR', 'ARBORICULTEUR',
                                           'JARDINIER', 'FORESTIER', 'HORTICULTEUR']):
            return 'AGRICULTURE_ET_PECHE'
        
        # Hospitality and services
        if any(word in prof_str for word in ['HOTESSE', 'SERVEUR', 'CUISINIER', 'RESTAURATION', 'HOTELLERIE',
                                           'COIFFEUR', 'ESTHETICIEN', 'MANUCURE', 'TOURISME']):
            return 'HOTELLERIE_RESTAURATION'
        
        # Arts and entertainment
        if any(word in prof_str for word in ['ARTISTE', 'ACTEUR', 'MUSICIEN', 'PHOTOGRAPHE', 'DESSINATEUR',
                                           'REALISATEUR', 'DECORATEUR', 'STYLISTE']):
            return 'ARTS_ET_SPECTACLE'
        
        # Industrial workers
        if any(word in prof_str for word in ['INDUSTRIE', 'USINE', 'PRODUCTION', 'MANUTENTION', 'MACHINISTE',
                                           'FABRICATION', 'ASSEMBLAGE']):
            return 'INDUSTRIE_ET_PRODUCTION'
        
        return 'AUTRES_PROFESSIONS'

    df['PROFESSION_GROUP'] = df['LIB_PROFESSION'].apply(group_profession)
    return df

def create_sector_groups(df):
    logger.info("Creating sector activity groups...")
    
    sector_mapping = {
        # High-income professionals
        'CADRES ET PROFESSIONS INTELLECTUELLES SUPÉRIEURES': 'CADRES_SUPERIEURS',
        'INGENIEUR': 'CADRES_SUPERIEURS',
        'RECHERCHE ET DÉVELOPPEMENT': 'CADRES_SUPERIEURS',
        
        # Commercial and business activities
        'COMMERCIAL': 'COMMERCE_ET_VENTE',
        'COMMERCE DE GROS ET INTERMÉDIAIRES DU COMMERCE': 'COMMERCE_ET_VENTE',
        'COMMERCE ET RÉPARATION AUTOMOBILE': 'COMMERCE_ET_VENTE',
        'COMMERCE DE DÉTAIL ET RÉPARATION D ARTICLES DOMESTIQUES': 'COMMERCE_ET_VENTE',
        'ARTISANS, COMMERÇANTS ET CHEFS D ENTREPRISE': 'COMMERCE_ET_VENTE',
        
        # Services sector
        'SERVICES PERSONNELS': 'SERVICES',
        'STATION DE SERVICE': 'SERVICES',
        'ACTIVITE SPORTIVE': 'SERVICES',
        'SERVICES': 'SERVICES',
        
        # Industrial and manual labor
        'OUVRIERS': 'INDUSTRIE_ET_CONSTRUCTION',
        'INDUSTRIE': 'INDUSTRIE_ET_CONSTRUCTION',
        'INDUSTRIES ALIMENTAIRES': 'INDUSTRIE_ET_CONSTRUCTION',
        'EXTRACTION DE MINERAIS MÉTALLIQUES': 'INDUSTRIE_ET_CONSTRUCTION',
        'COKÉFACTION, RAFFINAGE, INDUSTRIES NUCLÉAIRES': 'INDUSTRIE_ET_CONSTRUCTION',
        
        # Agriculture and fishing
        'AGRICULTURE, CHASSE, SERVICES ANNEXES': 'AGRICULTURE_ET_PECHE',
        'PÊCHE, AQUACULTURE': 'AGRICULTURE_ET_PECHE',
        
        # Public sector and administration
        'ADMINISTRATION PUBLIQUE': 'ADMINISTRATION_PUBLIQUE',
        'POSTES ET TÉLÉCOMMUNICATIONS': 'ADMINISTRATION_PUBLIQUE',
        'EMPLOYÉS': 'ADMINISTRATION_PUBLIQUE',
        
        # Education and healthcare
        'ÉDUCATION': 'EDUCATION_ET_SANTE',
        'SANTÉ ET ACTION SOCIALE': 'EDUCATION_ET_SANTE',
        'PROFESSIONS INTERMÉDIAIRES': 'EDUCATION_ET_SANTE',
        
        # Insurance and finance
        'ASSURANCE': 'FINANCE_ET_ASSURANCE',
        'ACTIVITES IARD TARIFIABLES': 'FINANCE_ET_ASSURANCE',
        
        # Transportation
        'TRANSPORTS AÉRIENS': 'TRANSPORTS',
        'TRANSPORTS': 'TRANSPORTS',
        
        # Special categories
        'RETRAITÉS': 'RETRAITES',
        'AUCUN': 'SANS_EMPLOI',
        'AUTRES PERSONNES SANS ACTIVITÉ PROFESSIONNELLE': 'SANS_EMPLOI',
        'NON_RENSEIGNE': 'NON_RENSEIGNE'
    }

    df['SECTEUR_ACTIVITE_GROUP'] = df['LIB_SECTEUR_ACTIVITE'].map(sector_mapping)
    df['SECTEUR_ACTIVITE_GROUP'] = df['SECTEUR_ACTIVITE_GROUP'].fillna('AUTRES_SECTEURS')
    
    return df

def calculate_client_scores(df_contrats, df_clients):
    logger.info("Calculating client scores...")
    
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
    df_scored_clients = pd.merge(client_metrics, df_clients, on='REF_PERSONNE', how='right')
    
    # Calculate weighted final score
    df_scored_clients['final_client_score'] = (
        df_scored_clients['loyalty_score'] * SCORING_WEIGHTS['loyalty'] +
        df_scored_clients['financial_score'] * SCORING_WEIGHTS['financial'] + 
        df_scored_clients['payment_score'] * SCORING_WEIGHTS['payment']
    ).fillna(0)
    
    # Ensure score is between 0-100
    df_scored_clients['final_client_score'] = df_scored_clients['final_client_score'].clip(0, 100)
    
    # Create client segments
    def segment_clients(score):
        for segment, threshold in SEGMENT_THRESHOLDS.items():
            if score >= threshold:
                return segment
        return 'Prospect'
    
    df_scored_clients['client_segment'] = df_scored_clients['final_client_score'].apply(segment_clients)
    
    # Create risk assessment
    def assess_risk(payment_score):
        for risk_level, threshold in RISK_THRESHOLDS.items():
            if payment_score >= threshold:
                return risk_level
        return 'High Risk'
    
    df_scored_clients['risk_profile'] = df_scored_clients['payment_score'].apply(assess_risk)
    
    logger.info(f"Successfully scored {len(df_scored_clients)} clients")
    return df_scored_clients