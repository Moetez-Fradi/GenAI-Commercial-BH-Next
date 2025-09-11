# client_recommendations.py
import pandas as pd
from config import logger, MINIMUM_BUDGET, BUDGET_MULTIPLIER

def recommend_insurance_products(client_row, df_contrats, df_products, client_scoring_data=None):
    
    client_id = client_row['REF_PERSONNE']
    logger.debug(f"Generating recommendations for client: {client_id}")
    
    # 1. GET CLIENT'S EXISTING COVERAGE
    client_contracts = df_contrats[df_contrats['REF_PERSONNE'] == client_id]
    existing_products = set(client_contracts['LIB_PRODUIT'].unique())
    
    # Merge with products to get categories
    client_portfolio = client_contracts.merge(df_products, on='LIB_PRODUIT', how='left')
    existing_categories = set(client_portfolio['LIB_SOUS_BRANCHE'].dropna().unique())
    
    # 2. CALCULATE CLIENT'S INSURANCE BUDGET
    if client_scoring_data is not None and client_id in client_scoring_data['REF_PERSONNE'].values:
        # Use scoring data if available
        client_score = client_scoring_data[client_scoring_data['REF_PERSONNE'] == client_id].iloc[0]
        estimated_budget = max(client_score['total_premiums_paid'] * BUDGET_MULTIPLIER, 
                              client_score['avg_premium_per_contract'] * 3, 
                              MINIMUM_BUDGET)
    else:
        # Fallback estimation
        total_premiums = client_contracts['somme_quittances'].sum()
        avg_capital = client_contracts['Capital_assure'].mean()
        estimated_budget = max(total_premiums * BUDGET_MULTIPLIER, avg_capital * 0.02, MINIMUM_BUDGET)
    
    # 3. PRIORITIZE INSURANCE NEEDS BASED ON CLIENT PROFILE
    priority_categories = []
    
    # Base protection everyone needs
    base_needs = ['MALADIE', 'INDIVIDUELLE ACCIDENTS']
    priority_categories.extend(base_needs)
    
    # Family situation-based needs
    family_situation = client_row['SITUATION_FAMILIALE']
    if family_situation in ['Marie', 'Veuf(ve)']:
        priority_categories.extend(['DECES'])  # Essential for dependents
    if family_situation == 'Marie' and client_row['AGE'] > 30:
        priority_categories.extend(['VIE', 'CAPITALISATION'])  # Family wealth building
    
    # Age-based needs
    age = client_row['AGE']
    if age > 50:
        priority_categories.extend(['CAPITALISATION'])  # Retirement focus
    if age < 35:
        priority_categories.extend(['ASSISTANCE EN VOYAGES'])  # Younger, mobile clients
    
    # Profession-based needs
    profession = client_row['PROFESSION_GROUP']
    if profession in ['TECHNICIENS_ET_ARTISANS', 'BATIMENT_ET_TRAVAUX', 'INDUSTRIE_ET_PRODUCTION']:
        priority_categories.extend(['INDIVIDUELLE ACCIDENTS'])  # High physical risk
    if profession in ['CADRES_SUPERIEURS', 'COMMERCE_ET_VENTE', 'SANTE_ET_MEDICAL']:
        priority_categories.extend(['RESPONSABILITE CIVILE'])  # Professional liability
    
    # Sector-based needs
    secteur = client_row['SECTEUR_ACTIVITE_GROUP']
    if secteur in ['TRANSPORTS', 'INDUSTRIE_ET_CONSTRUCTION']:
        priority_categories.extend(['INDIVIDUELLE ACCIDENTS'])
    if secteur in ['COMMERCE_ET_VENTE', 'SERVICES']:
        priority_categories.extend(['RESPONSABILITE CIVILE', 'VOL'])
    
    # Remove duplicates and categories client already has
    priority_categories = list(set(priority_categories) - existing_categories)
    
    # If client has comprehensive coverage, return empty
    if not priority_categories:
        return []
    
    # 4. SELECT PRODUCTS FROM PRIORITY CATEGORIES
    recommended_products = []
    
    # Define product priority within each category
    category_priority = {
        'DECES': ['ASSURANCE DECES VIE ENTIERE', 'TEMPORAIRE DECES'],
        'MALADIE': ['SANTE ET PREVOYANCE'],
        'INDIVIDUELLE ACCIDENTS': ['INDIVIDUELLE ACCIDENTS'],
        'VIE': ['ASSURANCE MIXTE VIE', 'MIXTE REVALORISABLE (AS)'],
        'CAPITALISATION': ['ASSURANCE VIE COMPLEMENT RETRAITE - HORIZON', 'ASSURANCE VIE COMPLEMENT RETRAITE - HORIZON+'],
        'RESPONSABILITE CIVILE': ['R.C PARTICULIER-CHEF DE FAMILLE- MAITRE DE MAISON', 'RC PROFESSION CULINAIRE'],
        'ASSISTANCE EN VOYAGES': ['ASSISTANCES EN VOYAGES - PLAN BASIQUE', 'ASSISTANCES EN VOYAGES - PLAN BUSINESS'],
        'VOL': ['VOL AVEC EFFRACTION MOBILIER D HABITATION', 'VOL TOUTE CATEGORIES'],
        'AUTOMOBILE': ['AUTOMOBILE', 'PACK TOUS RISQUES AVEC FRANCHISE']
    }
    
    # Get top 2 priority categories
    top_categories = priority_categories[:2]
    
    for category in top_categories:
        if category in category_priority:
            # Get available products in this category
            available_products = df_products[df_products['LIB_SOUS_BRANCHE'] == category]['LIB_PRODUIT'].unique()
            
            # Try to get priority products, otherwise get any product from the category
            for priority_product in category_priority[category]:
                if priority_product in available_products and priority_product not in existing_products:
                    recommended_products.append(priority_product)
                    break
            else:
                # If no priority product found, take the first available
                if len(available_products) > 0 and available_products[0] not in existing_products:
                    recommended_products.append(available_products[0])
    
    # 5. FILTER BY BUDGET AND RETURN MAX 2 RECOMMENDATIONS
    final_recommendations = []
    
    for product in recommended_products[:2]:
        # Simple budget check
        product_data = df_products[df_products['LIB_PRODUIT'] == product]
        if not product_data.empty:
            if ('BASIQUE' in product or 'STANDARD' in product or 
                estimated_budget > 1000 or
                len(existing_products) == 0):
                final_recommendations.append(product)
    
    logger.debug(f"Generated {len(final_recommendations)} recommendations for client {client_id}")
    return final_recommendations[:2]

def generate_recommendations_for_clients(df_clients, df_contrats, df_products, client_scoring_data=None):
    logger.info("Generating recommendations for all clients...")
    
    recommendations = []
    
    for _, client_row in df_clients.iterrows():
        client_id = client_row['REF_PERSONNE']
        
        recommended_products = recommend_insurance_products(
            client_row, df_contrats, df_products, client_scoring_data
        )
        
        recommendations.append({
            'REF_PERSONNE': client_id,
            'recommended_products': recommended_products,
            'recommendation_count': len(recommended_products),
            'AGE': client_row['AGE'],
            'PROFESSION_GROUP': client_row['PROFESSION_GROUP'],
            'SITUATION_FAMILIALE': client_row['SITUATION_FAMILIALE'],
            'SECTEUR_ACTIVITE_GROUP': client_row['SECTEUR_ACTIVITE_GROUP']
        })
    
    return pd.DataFrame(recommendations)