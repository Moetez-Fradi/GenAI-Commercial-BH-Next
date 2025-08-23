# business_client_recommendations.py
from config import logger, MINIMUM_BUSINESS_BUDGET, BUDGET_MULTIPLIER, LARGE_BUSINESS_CAPITAL_THRESHOLD

def recommend_business_insurance(client_row, df_contrats, df_products):
    
    client_id = client_row['REF_PERSONNE']
    logger.debug(f"Generating recommendations for client: {client_id}")
    
    client_contracts = df_contrats[df_contrats['REF_PERSONNE'] == client_id]
    existing_products = set(client_contracts['LIB_PRODUIT'].unique())
    
    # Get client's existing categories
    client_portfolio = client_contracts.merge(df_products, on='LIB_PRODUIT', how='left')
    existing_categories = set(client_portfolio['LIB_SOUS_BRANCHE'].dropna().unique())
    
    # Calculate budget
    total_premiums = client_contracts['somme_quittances'].sum()
    estimated_budget = max(total_premiums * BUDGET_MULTIPLIER, MINIMUM_BUSINESS_BUDGET)
    
    # DETERMINE BUSINESS INSURANCE NEEDS
    priority_categories = []
    
    # Universal business needs
    base_business_needs = ['RESPONSABILITE CIVILE', 'INCENDIE RISQUES SIMPLE', 'VOL TOUTE CATEGORIES']
    priority_categories.extend(base_business_needs)
    
    # Risk-based needs
    risk_profile = client_row.get('RISK_PROFILE', 'MEDIUM_RISK')
    if risk_profile == 'HIGH_RISK':
        priority_categories.extend(['INDIVIDUELLE ACCIDENTS', 'TOUS RISQUES CHANTIER', 'BRIS DE MACHINES'])
    elif risk_profile == 'MEDIUM_RISK':
        priority_categories.extend(['INDIVIDUELLE ACCIDENTS', 'DEGATS DES EAUX'])
    
    # Sector-specific needs
    secteur_group = client_row.get('SECTEUR_GROUP', '')
    activite_group = client_row.get('ACTIVITE_GROUP', '')
    
    if secteur_group == 'TRANSPORTS_ET_LOGISTIQUE':
        priority_categories.extend(['TRANSPORT FACULTE TERRESTRE', 'ASSISTANCE DES VEHICULES'])
    elif secteur_group == 'SANTÉ_ET_SOCIAL':
        priority_categories.extend(['R.C MEDECIN', 'R.C PARAMEDICALE'])
    elif secteur_group == 'COMMERCE_ET_VENTE':
        priority_categories.extend(['VOL AVEC EFFRACTION DES MARCHANDISES', 'DEGATS DES EAUX'])
    elif secteur_group == 'HOTELLERIE_ET_TOURISME':
        priority_categories.extend(['MULTIRISQUE HOTELIER', 'ASSISTANCE EN VOYAGES'])
    elif secteur_group == 'INDUSTRIE_ET_CONSTRUCTION':
        priority_categories.extend(['BRIS DE MACHINES', 'TOUS RISQUES CHANTIER', 'RESPONSABILITE DECENNALE'])
    elif secteur_group == 'AGRICULTURE_ET_RESSOURCES':
        priority_categories.extend(['INCENDIE RISQUES AGRICOLES', 'INDIVIDUELLE ACCIDENTS'])
    
    # Size-based needs
    total_capital = client_row.get('total_capital_assured', 0)
    if total_capital > LARGE_BUSINESS_CAPITAL_THRESHOLD:
        priority_categories.extend(['PERTES D EXPLOITATIONS APRES INCENDIE', 'MULTIRISQUES PROFESSIONNELLES'])
    
    # Remove existing categories
    priority_categories = list(set(priority_categories) - existing_categories)
    
    if not priority_categories:
        logger.debug(f"No new recommendations for client {client_id}")
        return []
    
    # SELECT PRODUCTS FROM PRIORITY CATEGORIES
    recommended_products = []
    
    # Business product priority mapping
    business_product_priority = {
        'RESPONSABILITE CIVILE': ['RC ENTREPRISE DE BATIMENT ET TRAVAUX PUBLIC', 'RC ARTISANTS ET COMMERCANTS', 
                                 'RC HOTELIERS', 'R.C PARTICULIER-CHEF DE FAMILLE- MAITRE DE MAISON'],
        'INCENDIE RISQUES SIMPLE': ['INCENDIE RISQUES SIMPLE', 'INCENDIE RISQUES SIMPLE CENTRALISE'],
        'VOL TOUTE CATEGORIES': ['VOL TOUTE CATEGORIES', 'VOL AVEC EFFRACTION DES MARCHANDISES DE TOUTE NATURE'],
        'INDIVIDUELLE ACCIDENTS': ['INDIVIDUELLE ACCIDENTS', 'INDIVIDUELLE ACCIDENTS ASSOCIE AU CONTRAT AUTO'],
        'TOUS RISQUES CHANTIER': ['TOUS RISQUES CHANTIER'],
        'BRIS DE MACHINES': ['BRIS DE MACHINES'],
        'DEGATS DES EAUX': ['DEGATS DES EAUX'],
        'TRANSPORT FACULTE TERRESTRE': ['POLICE AU VOYAGE(FACULTE TERRESTRE)', 'POLICE ABONNEMENT(FACULTE TERRESTRE)'],
        'ASSISTANCE DES VEHICULES': ['ASSISTANCE DES VEHICULES'],
        'R.C MEDECIN': ['R.C MEDECIN'],
        'R.C PARAMEDICALE': ['R.C PARAMEDICALE'],
        'MULTIRISQUE HOTELIER': ['MULTIRISQUE HOTELIER'],
        'ASSISTANCE EN VOYAGES': ['ASSISTANCES EN VOYAGES - PLAN BUSINESS', 'ASSISTANCES EN VOYAGES - PLAN GOLDEN'],
        'RESPONSABILITE DECENNALE': ['RESPONSABILITE DECENNALE'],
        'INCENDIE RISQUES AGRICOLES': ['INCENDIE RISQUES AGRICOLES'],
        'PERTES D EXPLOITATIONS APRES INCENDIE': ['PERTES D EXPLOITATION APRES INCENDIE'],
        'MULTIRISQUES PROFESSIONNELLES': ['MULTIRISQUES PROFESSIONNELLES', 'MULTIRISQUES PROFESSIONNELLES CENTRALISE']
    }
    
    # Get top 2 priority categories
    top_categories = priority_categories[:2]
    
    for category in top_categories:
        if category in business_product_priority:
            available_products = df_products[df_products['LIB_SOUS_BRANCHE'] == category]['LIB_PRODUIT'].unique()
            
            # Try to get priority products for this category
            for priority_product in business_product_priority[category]:
                if priority_product in available_products and priority_product not in existing_products:
                    recommended_products.append(priority_product)
                    break
            else:
                # If no priority product found, take the first available
                if len(available_products) > 0 and available_products[0] not in existing_products:
                    recommended_products.append(available_products[0])
    
    logger.debug(f"Generated {len(recommended_products)} recommendations for client {client_id}")
    return recommended_products[:2]