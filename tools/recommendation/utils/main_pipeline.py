# main_pipeline.py
import pandas as pd 
from config import logger
from business_client_scoring import calculate_business_client_scores
from business_client_recommendations import recommend_business_insurance

def business_recommendation_pipeline(df_contrats, df_personne_morale, df_products):
    
    logger.info("Starting business recommendation pipeline")
    
    # Filter contracts for business clients only
    business_client_ids = df_personne_morale['REF_PERSONNE'].unique()
    df_business_contrats = df_contrats[df_contrats['REF_PERSONNE'].isin(business_client_ids)]
    
    # Step 1: Calculate business client scores
    logger.info("Calculating business client scores...")
    df_scored_business = calculate_business_client_scores(df_business_contrats, df_personne_morale)
    
    # Step 2: Generate recommendations
    logger.info("Generating business recommendations...")
    recommendations = []
    
    for _, client_row in df_scored_business.iterrows():
        client_recommendations = recommend_business_insurance(client_row, df_contrats, df_products)
        
        recommendations.append({
            'REF_PERSONNE': client_row['REF_PERSONNE'],
            'RAISON_SOCIALE': client_row.get('RAISON_SOCIALE', ''),
            'SECTEUR_GROUP': client_row.get('SECTEUR_GROUP', ''),
            'ACTIVITE_GROUP': client_row.get('ACTIVITE_GROUP', ''),
            'RISK_PROFILE': client_row.get('RISK_PROFILE', ''),
            'recommended_products': client_recommendations,
            'recommendation_count': len(client_recommendations),
            'client_score': client_row.get('final_client_score', 0),
            'client_segment': client_row.get('client_segment', ''),
            'total_premiums_paid': client_row.get('total_premiums_paid', 0),
            'total_capital_assured': client_row.get('total_capital_assured', 0),
            'estimated_budget': max(client_row.get('total_premiums_paid', 0) * 1.5, 1000)
        })
    
    df_recommendations = pd.DataFrame(recommendations)
    
    # Step 3: Generate summary report
    generate_summary_report(df_recommendations)
    
    logger.info("Business recommendation pipeline completed successfully")
    return df_recommendations

def generate_summary_report(df_recommendations):
    """Generate a comprehensive summary report of recommendations"""
    logger.info("\n=== BUSINESS RECOMMENDATION SUMMARY REPORT ===")
    logger.info(f"Total businesses processed: {len(df_recommendations)}")
    logger.info(f"Businesses with recommendations: {(df_recommendations['recommendation_count'] > 0).sum()}")
    logger.info(f"Average business score: {df_recommendations['client_score'].mean():.2f}")
    
    logger.info("\nBusiness Segment Distribution:")
    for segment, count in df_recommendations['client_segment'].value_counts().items():
        logger.info(f"  - {segment}: {count} clients")
    
    logger.info("\nRisk Profile Distribution:")
    for risk_profile, count in df_recommendations['RISK_PROFILE'].value_counts().items():
        logger.info(f"  - {risk_profile}: {count} clients")
    
    logger.info("\nTop Recommended Products:")
    all_recommendations = df_recommendations.explode('recommended_products')
    top_products = all_recommendations['recommended_products'].value_counts().head(5)
    for product, count in top_products.items():
        logger.info(f"  - {product}: {count} recommendations")
    
    # Additional insights
    avg_premium = df_recommendations['total_premiums_paid'].mean()
    avg_capital = df_recommendations['total_capital_assured'].mean()
    logger.info("\nAdditional Insights:")
    logger.info(f"  - Average premiums paid: ${avg_premium:,.2f}")
    logger.info(f"  - Average capital assured: ${avg_capital:,.2f}")
    logger.info(f"  - Recommendation rate: {(df_recommendations['recommendation_count'] > 0).mean():.1%}")

# Example usage 
if __name__ == "__main__":   
     
    # Load your data (this would be replaced by database calls in production)
    df_contrats = pd.read_pickle('../data/contrats.pkl')
    df_personne_morale = pd.read_pickle('../data/clients_morales.pkl')
    df_products = pd.read_excel('../data/Donn_es_Assurance_S2.1.xlsx',sheet_name='Mapping_Produits')
    # Run the pipeline
    recommendations_df = business_recommendation_pipeline(df_contrats, df_personne_morale, df_products)
    
    # Save results
    recommendations_df.to_csv('../data/business_recommendations.csv', index=False)
    logger.info("Recommendations saved to data/business_recommendations.csv")