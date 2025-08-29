import pandas as pd
from app.core.config import logger
from app.core.grouping_utils import create_profession_groups, create_sector_groups, create_business_groups

def clean_contrats_data(df_contrats):
    """Clean and preprocess contracts data"""
    logger.info("Cleaning contracts data...")
    
    df = df_contrats.copy()
    
    # Handle missing values
    df['somme_quittances'] = df['somme_quittances'].fillna(0)
    df['Capital_assure'] = df['Capital_assure'].fillna(0)
    df['statut_paiement'] = df['statut_paiement'].fillna('Non payé')
    df['LIB_ETAT_CONTRAT'] = df['LIB_ETAT_CONTRAT'].fillna('UNKNOWN')
    
    # Clean date columns with proper error handling
    date_columns = ['EFFET_CONTRAT', 'DATE_EXPIRATION', 'PROCHAIN_TERME']
    for col in date_columns:
        df[col] = pd.to_datetime(df[col], errors='coerce', format='%Y-%m-%d %H:%M:%S.%f')
        # Fill invalid dates with reasonable defaults
        if col == 'EFFET_CONTRAT':
            df[col] = df[col].fillna(pd.Timestamp('2000-01-01'))
        else:
            df[col] = df[col].fillna(pd.NaT)
    
    # Clean text columns
    text_columns = ['LIB_PRODUIT', 'LIB_ETAT_CONTRAT', 'statut_paiement', 'branche']
    for col in text_columns:
        df[col] = df[col].astype(str).str.strip().str.upper()
        df[col] = df[col].replace({'NAN': 'UNKNOWN', 'NONE': 'UNKNOWN'})
    
    # Validate contract dates
    df = validate_contract_dates(df)
    
    logger.info(f"Cleaned {len(df)} contracts")
    return df

def clean_sinistres_data(df_sinistres):
    """Clean and preprocess claims data"""
    logger.info("Cleaning claims data...")
    
    df = df_sinistres.copy()
    
    # Handle missing values
    df['MONTANT_ENCAISSE'] = df['MONTANT_ENCAISSE'].fillna(0)
    df['MONTANT_A_ENCAISSER'] = df['MONTANT_A_ENCAISSER'].fillna(0)
    df['TAUX_RESPONSABILITE'] = df['TAUX_RESPONSABILITE'].fillna(0)
    
    # Clean date columns
    date_columns = ['DATE_SURVENANCE', 'DATE_DECLARATION', 'DATE_OUVERTURE']
    for col in date_columns:
        df[col] = pd.to_datetime(df[col], errors='coerce', format='%Y-%m-%d %H:%M:%S.%f')
        df[col] = df[col].fillna(pd.Timestamp('2000-01-01'))
    
    # Clean text columns
    text_columns = ['LIB_BRANCHE', 'LIB_SOUS_BRANCHE', 'LIB_PRODUIT', 
                   'NATURE_SINISTRE', 'LIB_TYPE_SINISTRE', 'LIB_ETAT_SINISTRE',
                   'LIEU_ACCIDENT', 'MOTIF_REOUVERTURE', 'OBSERVATION_SINISTRE']
    
    for col in text_columns:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().str.upper()
            df[col] = df[col].replace({'NAN': 'UNKNOWN', 'NONE': 'UNKNOWN', '': 'UNKNOWN'})
    
    # Validate claim amounts
    df['MONTANT_ENCAISSE'] = df['MONTANT_ENCAISSE'].clip(lower=0)
    df['MONTANT_A_ENCAISSER'] = df['MONTANT_A_ENCAISSER'].clip(lower=0)
    df['TAUX_RESPONSABILITE'] = df['TAUX_RESPONSABILITE'].clip(lower=0, upper=100)
    
    # Remove duplicate claims
    df = df.drop_duplicates(subset=['NUM_SINISTRE'], keep='first')
    
    logger.info(f"Cleaned {len(df)} claims")
    return df

def clean_clients_data(df_clients):
    """Clean individual clients data"""
    logger.info("Cleaning individual clients data...")
    
    df = df_clients.copy()
    
    # Handle missing values
    df['AGE'] = df['AGE'].fillna(df['AGE'].median()).astype(int)
    df['SITUATION_FAMILIALE'] = df['SITUATION_FAMILIALE'].fillna('UNKNOWN')
    
    # Clean text columns
    text_columns = ['NOM_PRENOM', 'LIEU_NAISSANCE', 'CODE_SEXE', 'SITUATION_FAMILIALE',
                   'NUM_PIECE_IDENTITE', 'LIB_SECTEUR_ACTIVITE', 'LIB_PROFESSION',
                   'VILLE', 'LIB_GOUVERNORAT', 'VILLE_GOUVERNORAT']
    
    for col in text_columns:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().str.upper()
            df[col] = df[col].fillna('UNKNOWN')
    
    # Apply grouping functions
    df = create_profession_groups(df)
    df = create_sector_groups(df)
    
    logger.info(f"Cleaned {len(df)} individual clients")
    return df

def clean_business_data(df_personne_morale):
    """Clean business clients data"""
    logger.info("Cleaning business clients data...")
    
    df = df_personne_morale.copy()
    
    # Handle missing values
    text_columns = ['RAISON_SOCIALE', 'MATRICULE_FISCALE', 'LIB_SECTEUR_ACTIVITE', 
                   'LIB_ACTIVITE', 'VILLE', 'LIB_GOUVERNORAT', 'VILLE_GOUVERNORAT']
    
    for col in text_columns:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().str.upper()
            df[col] = df[col].fillna('UNKNOWN')
    
    # Apply business grouping
    df = create_business_groups(df)
    
    logger.info(f"Cleaned {len(df)} business clients")
    return df

def clean_products_data(df_products):
    """Clean products data"""
    logger.info("Cleaning products data...")
    
    df = df_products.copy()
    
    # Standardize text columns
    text_cols = ['LIB_BRANCHE', 'LIB_SOUS_BRANCHE', 'LIB_PRODUIT']
    for col in text_cols:
        df[col] = df[col].astype(str).str.strip().str.upper()
        df[col] = df[col].fillna('UNKNOWN')
    
    # Remove duplicates
    df = df.drop_duplicates(subset=['LIB_PRODUIT'], keep='first')
    
    logger.info(f"Cleaned {len(df)} products")
    return df

def validate_contract_dates(df_contrats):
    """Validate and correct contract dates"""
    df = df_contrats.copy()
    
    # Ensure EFFET_CONTRAT is before DATE_EXPIRATION
    mask = (df['EFFET_CONTRAT'] > df['DATE_EXPIRATION']) & df['DATE_EXPIRATION'].notna()
    df.loc[mask, 'DATE_EXPIRATION'] = df.loc[mask, 'EFFET_CONTRAT'] + pd.DateOffset(years=1)
    
    # Ensure PROCHAIN_TERME is reasonable
    mask = (df['PROCHAIN_TERME'] < df['EFFET_CONTRAT']) & df['PROCHAIN_TERME'].notna()
    df.loc[mask, 'PROCHAIN_TERME'] = df.loc[mask, 'EFFET_CONTRAT'] + pd.DateOffset(months=1)
    
    return df