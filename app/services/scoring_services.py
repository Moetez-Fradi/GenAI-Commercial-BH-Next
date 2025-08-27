import pandas as pd
import numpy as np
from app.core.config import logger, SCORING_WEIGHTS, SEGMENT_THRESHOLDS, RISK_THRESHOLDS
from app.core.scoring.individual_scoring import calculate_individual_scores
from app.core.scoring.business_scoring import calculate_business_scores

class ScoringService:
    
    def __init__(self):
        self.scored_clients = pd.DataFrame()
        self.scored_businesses = pd.DataFrame()
        self.df_contrats = None  
        self.df_products = None   
    
    def score_all_clients(self, df_contrats, df_clients, df_personne_morale):
        """Score both individual and business clients"""
        logger.info("Starting client scoring process...")
        
        # Filter contracts for each client type
        individual_client_ids = df_clients['REF_PERSONNE'].unique()
        business_client_ids = df_personne_morale['REF_PERSONNE'].unique()
        
        df_individual_contrats = df_contrats[df_contrats['REF_PERSONNE'].isin(individual_client_ids)]
        df_business_contrats = df_contrats[df_contrats['REF_PERSONNE'].isin(business_client_ids)]
        
        # Score individual clients
        logger.info("Scoring individual clients...")
        self.scored_clients = calculate_individual_scores(df_individual_contrats, df_clients)
        
        # Score business clients
        logger.info("Scoring business clients...")
        self.scored_businesses = calculate_business_scores(df_business_contrats, df_personne_morale)
        
        logger.info(f"Scored {len(self.scored_clients)} individual clients")
        logger.info(f"Scored {len(self.scored_businesses)} business clients")
        
        return self.scored_clients, self.scored_businesses
    
    def get_scored_clients(self, client_type='all'):
        """Get scored clients by type"""
        if client_type == 'individual':
            return self.scored_clients
        elif client_type == 'business':
            return self.scored_businesses
        else:
            return pd.concat([self.scored_clients, self.scored_businesses], ignore_index=True)
    
    def save_scores(self, filepath):
        """Save all scores to file"""
        all_scores = pd.concat([self.scored_clients, self.scored_businesses], ignore_index=True)
        all_scores.to_parquet(filepath, index=False)
        logger.info(f"Scores saved to {filepath}")
    
    def load_scores(self, filepath):
        """Load scores from file"""
        all_scores = pd.read_parquet(filepath)
        self.scored_clients = all_scores[all_scores['client_type'] == 'individual']
        self.scored_businesses = all_scores[all_scores['client_type'] == 'business']
        logger.info(f"Scores loaded from {filepath}")

# Global scoring service instance
scoring_service = ScoringService()