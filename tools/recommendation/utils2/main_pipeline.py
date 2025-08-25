# main_pipeline.py
import pandas as pd
from config import logger
from client_scoring import calculate_client_scores
from client_recommendations import generate_recommendations_for_clients

def client_recommendation_pipeline(df_contrats, df_clients, df_products):
    """
    Main endpoint for client recommendation pipeline.
    
    Args:
        df_contrats: DataFrame containing all insurance contracts
        df_clients: DataFrame containing individual client profiles
        df_products: DataFrame containing product catalog with categories
    
    Returns:
        DataFrame with client scores and recommendations
    """
    logger.info("Starting client recommendation pipeline")
    
    # Step 1: Calculate client scores
    logger.info("Calculating client scores...")
    df_scored_clients = calculate_client_scores(df_contrats, df_clients)
    
    # Step 2: Generate recommendations
    logger.info("Generating client recommendations...")
    df_recommendations = generate_recommendations_for_clients(
        df_scored_clients, df_contrats, df_products, df_scored_clients
    )
    
    # Step 3: Merge scores with recommendations
    final_results = pd.merge(
        df_scored_clients,
        df_recommendations[['REF_PERSONNE', 'recommended_products', 'recommendation_count']],
        on='REF_PERSONNE',
        how='left'
    )
    
    # Fill NaN values
    final_results['recommended_products'] = final_results['recommended_products'].fillna('[]')
    final_results['recommendation_count'] = final_results['recommendation_count'].fillna(0)
    
    # Step 4: Generate summary report
    generate_summary_report(final_results)
    
    logger.info("Client recommendation pipeline completed successfully")
    return final_results

def generate_summary_report(df_results):
    """Generate a comprehensive summary report"""
    logger.info("\n=== CLIENT RECOMMENDATION SUMMARY REPORT ===")
    logger.info(f"Total clients processed: {len(df_results)}")
    logger.info(f"Clients with recommendations: {(df_results['recommendation_count'] > 0).sum()}")
    logger.info(f"Average client score: {df_results['final_client_score'].mean():.2f}")
    
    logger.info("\nClient Segment Distribution:")
    for segment, count in df_results['client_segment'].value_counts().items():
        logger.info(f"  - {segment}: {count} clients")
    
    logger.info("\nRisk Profile Distribution:")
    for risk_profile, count in df_results['risk_profile'].value_counts().items():
        logger.info(f"  - {risk_profile}: {count} clients")
    
    logger.info("\nTop Recommended Product Categories:")
    # Extract all recommendations
    all_recommendations = []
    for products in df_results['recommended_products']:
        if isinstance(products, list):
            all_recommendations.extend(products)
    
    if all_recommendations:
        top_products = pd.Series(all_recommendations).value_counts().head(5)
        for product, count in top_products.items():
            logger.info(f"  - {product}: {count} recommendations")
    
    # Additional insights
    avg_premium = df_results['total_premiums_paid'].mean()
    avg_capital = df_results['total_capital_assured'].mean()
    logger.info("\nAdditional Insights:")
    logger.info(f"  - Average premiums paid: ${avg_premium:,.2f}")
    logger.info(f"  - Average capital assured: ${avg_capital:,.2f}")
    logger.info(f"  - Recommendation rate: {(df_results['recommendation_count'] > 0).mean():.1%}")

# Example usage
if __name__ == "__main__":
    try:
        # Load data (replace with your actual data paths)
        df_contrats = pd.read_pickle('../data/contrats.pkl')
        df_clients = pd.read_pickle('../data/clients_phy.pkl')
        df_products = pd.read_excel('../data/Donn_es_Assurance_S2.1.xlsx', sheet_name='Mapping_Produits')
        
        # Run the pipeline
        results_df = client_recommendation_pipeline(df_contrats, df_clients, df_products)
        
        # Save results
        results_df.to_csv('../data/client_recommendations.csv', index=False)
        logger.info("Recommendations saved to ../data/client_recommendations.csv")
        
    except Exception as e:
        logger.error(f"Error running pipeline: {e}")
        raise