import pandas as pd
import numpy as np
from app.core.config import logger, BUDGET_CONFIG, PREMIUM_PRODUCTS
from app.core.recommendation.individual_recommendation import recommend_individual_insurance_enhanced
from app.core.recommendation.business_recommendation import recommend_business_insurance_enhanced
from app.core.recommendation.alerts import generate_alerts
from app.services.batch_processor import batch_processor

class RecommendationService:
    def __init__(self):
        self.individual_recommendations = pd.DataFrame()
        self.business_recommendations = pd.DataFrame()
        self.alerts = pd.DataFrame()
    
    def generate_recommendations(self, df_scored, df_contrats, df_products, df_sinistres=None):
        logger.info("Starting recommendation generation...")
        
        individual_clients = df_scored[df_scored['client_type'] == 'individual']
        business_clients = df_scored[df_scored['client_type'] == 'business']
        
        individual_recs = batch_processor.process_in_batches(
            individual_clients, self._process_individual_batch, 
            df_contrats, df_products, df_sinistres
        )
        
        business_recs = batch_processor.process_in_batches(
            business_clients, self._process_business_batch,
            df_contrats, df_products, df_sinistres
        )
        
        self.individual_recommendations = pd.DataFrame(individual_recs)
        self.business_recommendations = pd.DataFrame(business_recs)
        
        self.alerts = generate_alerts(df_contrats)
        
        logger.info(f"Generated {len(self.individual_recommendations)} individual recommendations")
        logger.info(f"Generated {len(self.business_recommendations)} business recommendations")
        logger.info(f"Generated {len(self.alerts)} alerts")
        
        return self.individual_recommendations, self.business_recommendations, self.alerts
    
    def _process_individual_batch(self, batch, df_contrats, df_products, df_sinistres):
        results = []
        
        for _, client_row in batch.iterrows():
            recommendations = recommend_individual_insurance_enhanced(
                client_row, df_contrats, df_products, df_sinistres
            )
            
            budget = self._calculate_budget(client_row, 'individual')
            
            results.append({
                'REF_PERSONNE': client_row['REF_PERSONNE'],
                'NOM_PRENOM': client_row.get('NOM_PRENOM', ''),
                'recommended_products': recommendations,
                'recommendation_count': len(recommendations),
                'client_score': client_row['final_client_score'],
                'client_segment': client_row['client_segment'],
                'risk_profile': client_row['risk_profile'],
                'estimated_budget': budget,
                'AGE': client_row.get('AGE', 0),
                'PROFESSION_GROUP': client_row.get('PROFESSION_GROUP', ''),
                'SITUATION_FAMILIALE': client_row.get('SITUATION_FAMILIALE', ''),
                'SECTEUR_ACTIVITE_GROUP': client_row.get('SECTEUR_ACTIVITE_GROUP', ''),
                'client_type': 'individual'
            })
        
        return results
    
    def _process_business_batch(self, batch, df_contrats, df_products, df_sinistres):
        results = []
        
        for _, client_row in batch.iterrows():
            recommendations = recommend_business_insurance_enhanced(
                client_row, df_contrats, df_products, df_sinistres
            )
            
            budget = self._calculate_budget(client_row, 'business')
            
            results.append({
                'REF_PERSONNE': client_row['REF_PERSONNE'],
                'RAISON_SOCIALE': client_row.get('RAISON_SOCIALE', ''),
                'recommended_products': recommendations,
                'recommendation_count': len(recommendations),
                'client_score': client_row['final_client_score'],
                'client_segment': client_row['client_segment'],
                'risk_profile': client_row['risk_profile'],
                'estimated_budget': budget,
                'SECTEUR_GROUP': client_row.get('SECTEUR_GROUP', ''),
                'ACTIVITE_GROUP': client_row.get('ACTIVITE_GROUP', ''),
                'BUSINESS_RISK_PROFILE': client_row.get('RISK_PROFILE', ''),
                'total_capital_assured': client_row.get('total_capital_assured', 0),
                'total_premiums_paid': client_row.get('total_premiums_paid', 0),
                'client_type': 'business'
            })
        
        return results
    
    def _calculate_budget(self, client_row, client_type):
        config = BUDGET_CONFIG[client_type]
        
        if client_type == 'individual':
            total_premiums = client_row.get('total_premiums_paid', 0)
            avg_premium = client_row.get('avg_premium_per_contract', 0)
            return max(
                total_premiums * config['multiplier'],
                avg_premium * 3,
                config['minimum']
            )
        else:
            total_premiums = client_row.get('total_premiums_paid', 0)
            total_capital = client_row.get('total_capital_assured', 0)
            return max(
                total_premiums * config['multiplier'],
                total_capital * config['premium_ratio'],
                config['minimum']
            )
    
    def get_recommendations(self, client_type='all'):
        if client_type == 'individual':
            return self.individual_recommendations
        elif client_type == 'business':
            return self.business_recommendations
        else:
            return pd.concat([self.individual_recommendations, self.business_recommendations], ignore_index=True)
    
    def save_recommendations(self, individual_path, business_path):
        if not self.individual_recommendations.empty:
            self.individual_recommendations.to_parquet(individual_path, index=False)
            logger.info(f"Individual recommendations saved to {individual_path}")
        
        if not self.business_recommendations.empty:
            self.business_recommendations.to_parquet(business_path, index=False)
            logger.info(f"Business recommendations saved to {business_path}")
    
    def save_alerts(self, filepath):
        if not self.alerts.empty:
            self.alerts.to_parquet(filepath, index=False)
            logger.info(f"Alerts saved to {filepath}")

recommendation_service = RecommendationService()
