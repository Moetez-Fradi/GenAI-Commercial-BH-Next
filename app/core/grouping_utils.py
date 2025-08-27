import pandas as pd
from app.core.config import logger

def create_profession_groups(df):
    """Group LIB_PROFESSION column for individual clients"""
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
        if any(word in prof_str for word in ['CHOMAGE', 'SANS EMPLOI', 'AUCUN', 'AUCUNE ACTIVITE','CHÔMEURS N AYANT JAMAIS TRAVAILLÉ']):
            return 'SANS_EMPLOI'
        
        # High-income professionals
        if any(word in prof_str for word in ['CADRE', 'INGENIEUR', 'ARCHITECTE', 'EXPERT', 'CONSULTANT', 
                                           'DIRECTEUR', 'MANAGER', 'CHEF SERVICE', 'RESPONSABLE', 'BANQUIER',
                                           'AVOCAT', 'MEDECIN', 'PHARMACIEN', 'DENTISTE', 'VETERINAIRE',
                                           'JOURNALISTE', 'CHERCHEUR']):
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
                                           'MONITEUR', 'PROFESSEUR', 'ENSEIGNANT', 'INSTITUTEUR', 'MAITRE']):
            return 'EDUCATION_ET_SOCIAL'
        
        # Construction and manual labor
        if any(word in prof_str for word in ['OUVRIER','MAÇON','MACON', 'MENUISIER', 'PEINTRE', 'CARRELEUR',
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
    """Group LIB_SECTEUR_ACTIVITE column for individual clients"""
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

def create_business_groups(df_personne_morale):
    """Group LIB_SECTEUR_ACTIVITE and LIB_ACTIVITE for business clients"""
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