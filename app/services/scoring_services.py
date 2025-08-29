import pandas as pd
import numpy as np
from app.core.config import logger, SCORING_WEIGHTS, SEGMENT_THRESHOLDS, RISK_THRESHOLDS
from app.core.scoring.individual_scoring import calculate_individual_scores
from app.core.scoring.business_scoring import calculate_business_scores

class ScoringService:
    def __init__(self):
        self.scored_individuals = pd.DataFrame()
        self.scored_businesses = pd.DataFrame()
        self.df_contrats = None
        self.df_products = None
    
    def score_all_clients(self, df_contrats, df_clients, df_personne_morale):
        """Score both individual and business clients separately"""
        logger.info("Starting client scoring process...")
        
        # Filter contracts for each client type
        individual_client_ids = df_clients['REF_PERSONNE'].unique()
        business_client_ids = df_personne_morale['REF_PERSONNE'].unique()
        
        df_individual_contrats = df_contrats[df_contrats['REF_PERSONNE'].isin(individual_client_ids)]
        df_business_contrats = df_contrats[df_contrats['REF_PERSONNE'].isin(business_client_ids)]
        
        # Score individual clients
        logger.info("Scoring individual clients...")
        self.scored_individuals = calculate_individual_scores(df_individual_contrats, df_clients)
        
        # Score business clients
        logger.info("Scoring business clients...")
        self.scored_businesses = calculate_business_scores(df_business_contrats, df_personne_morale)
        
        logger.info(f"Scored {len(self.scored_individuals)} individual clients")
        logger.info(f"Scored {len(self.scored_businesses)} business clients")
        
        return self.scored_individuals, self.scored_businesses
    
    def get_scored_clients(self, client_type='all'):
        """Get scored clients by type"""
        if client_type == 'individual':
            return self.scored_individuals
        elif client_type == 'business':
            return self.scored_businesses
        else:
            return pd.concat([self.scored_individuals, self.scored_businesses], ignore_index=True)
    
    def save_scores(self, individual_path="data/processed/individual_scores.parquet", 
                   business_path="data/processed/business_scores.parquet"):
        """Save scores to separate files"""
        if not self.scored_individuals.empty:
            self.scored_individuals.to_parquet(individual_path, index=False)
            logger.info(f"Individual scores saved to {individual_path}")
        
        if not self.scored_businesses.empty:
            self.scored_businesses.to_parquet(business_path, index=False)
            logger.info(f"Business scores saved to {business_path}")
    
    def load_scores(self, individual_path="data/processed/individual_scores.parquet",
                   business_path="data/processed/business_scores.parquet"):
        """Load scores from separate files"""
        if os.path.exists(individual_path):
            self.scored_individuals = pd.read_parquet(individual_path)
            logger.info(f"Individual scores loaded from {individual_path}")
        
        if os.path.exists(business_path):
            self.scored_businesses = pd.read_parquet(business_path)
            logger.info(f"Business scores loaded from {business_path}")

# Global scoring service instance
scoring_service = ScoringService()