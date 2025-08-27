from app.core.config import logger, BUDGET_CONFIG, PREMIUM_PRODUCTS, PRODUCT_SCORING_WEIGHTS, CLAIMS_ANALYSIS_CONFIG, ALERT_CONFIG, LARGE_BUSINESS_CAPITAL_THRESHOLD

def recommend_business_insurance_enhanced(client_row, df_contrats, df_products, df_sinistres=None):
    """Enhanced recommendation function for business clients"""
    
    client_id = client_row['REF_PERSONNE']
    logger.debug(f"Generating enhanced recommendations for business client: {client_id}")
    
    client_contracts = df_contrats[df_contrats['REF_PERSONNE'] == client_id]
    existing_products = set(client_contracts['LIB_PRODUIT'].unique())
    
    # Get client's existing categories
    client_portfolio = client_contracts.merge(df_products, on='LIB_PRODUIT', how='left')
    existing_categories = set(client_portfolio['LIB_SOUS_BRANCHE'].dropna().unique())
    
    # Calculate budget
    config = BUDGET_CONFIG['business']
    total_premiums = client_row.get('total_premiums_paid', 0)
    total_capital = client_row.get('total_capital_assured', 0)
    
    estimated_budget = max(
        total_premiums * config['multiplier'],
        total_capital * config['premium_ratio'],
        config['minimum']
    )
    
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
        logger.debug(f"No new recommendations for business client {client_id}")
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
    
    # ADD CLAIMS-BASED RECOMMENDATIONS
    if df_sinistres is not None:
        claims_recommendations = get_claims_based_recommendations_business(client_id, df_sinistres, df_contrats, df_products)
        recommended_products.extend(claims_recommendations)
    
    # SCORE AND FILTER PRODUCTS
    final_recommendations = []
    scored_products = score_business_products(recommended_products, client_row, df_products)
    
    for product_score in scored_products:
        product = product_score['product']
        final_recommendations.append({
            'product': product,
            'score': product_score['score'],
            'confidence': product_score['confidence'],
            'reason': f"Based on business profile and scoring: {product_score['score']}/100"
        })
    
    # Sort by score and take top 3
    final_recommendations.sort(key=lambda x: x['score'], reverse=True)
    
    logger.debug(f"Generated {len(final_recommendations)} enhanced recommendations for business client {client_id}")
    return final_recommendations[:3]

def analyze_claims_for_business(client_id, df_sinistres, df_contrats):
    """Analyze claims for business clients"""
    client_contracts = df_contrats[df_contrats['REF_PERSONNE'] == client_id]['NUM_CONTRAT'].unique()
    client_claims = df_sinistres[df_sinistres['NUM_CONTRAT'].isin(client_contracts)]
    
    if client_claims.empty:
        return {}
    
    return {
        'total_claims': len(client_claims),
        'claim_categories': client_claims['LIB_SOUS_BRANCHE'].value_counts().to_dict(),
        'high_risk_claims': len(client_claims[client_claims['TAUX_RESPONSABILITE'] == 100]),
        'total_claim_amount': client_claims['MONTANT_ENCAISSE'].sum(),
        'business_impact_claims': len(client_claims[client_claims['LIB_SOUS_BRANCHE'].isin(
            ['RESPONSABILITE CIVILE', 'INCENDIE', 'BRIS DE MACHINES']
        )])
    }

def get_claims_based_recommendations_business(client_id, df_sinistres, df_contrats, df_products):
    """Get claims-based recommendations for business clients"""
    recommendations = []
    claims_analysis = analyze_claims_for_business(client_id, df_sinistres, df_contrats)
    
    if not claims_analysis:
        return recommendations
    
    # Business-specific claim patterns
    for category, count in claims_analysis['claim_categories'].items():
        if count >= CLAIMS_ANALYSIS_CONFIG['multiple_claims_threshold']:
            if category == 'RESPONSABILITE CIVILE':
                recommendations.extend(['RC ENTREPRISE DE BATIMENT ET TRAVAUX PUBLIC', 'RC ARTISANTS ET COMMERCANTS'])
            elif category == 'INCENDIE':
                recommendations.extend(['INCENDIE RISQUES SIMPLE', 'MULTIRISQUES PROFESSIONNELLES'])
            elif category == 'BRIS DE MACHINES':
                recommendations.extend(['BRIS DE MACHINES', 'TOUS RISQUES CHANTIER'])
    
    # High impact business claims
    if claims_analysis['business_impact_claims'] >= 2:
        recommendations.append('PERTES D EXPLOITATIONS APRES INCENDIE')
    
    return list(set(recommendations))

def score_business_products(recommendations, client_row, df_products):
    """Score recommended products for business clients"""
    scored_products = []
    
    for product in recommendations:
        score = calculate_product_score_business(product, client_row, df_products)
        scored_products.append({
            'product': product,
            'score': score,
            'confidence': min(score / 100, 1.0)
        })
    
    # Sort by score descending
    scored_products.sort(key=lambda x: x['score'], reverse=True)
    return scored_products

def calculate_product_score_business(product, client_row, df_products):
    """Calculate product score for business clients"""
    score = 50  # Base score
    
    # Product-business fit
    product_info = df_products[df_products['LIB_PRODUIT'] == product]
    if not product_info.empty:
        product_category = product_info['LIB_SOUS_BRANCHE'].iloc[0]
        
        # Sector-based scoring
        secteur = client_row.get('SECTEUR_GROUP', '')
        if secteur == 'INDUSTRIE_ET_CONSTRUCTION' and product_category in ['BRIS DE MACHINES', 'TOUS RISQUES CHANTIER']:
            score += 25
        elif secteur == 'TRANSPORTS_ET_LOGISTIQUE' and product_category in ['TRANSPORT FACULTE TERRESTRE', 'ASSISTANCE DES VEHICULES']:
            score += 25
        
        # Risk profile scoring
        risk_profile = client_row.get('RISK_PROFILE', 'MEDIUM_RISK')
        if risk_profile == 'HIGH_RISK' and product_category in ['RESPONSABILITE CIVILE', 'INDIVIDUELLE ACCIDENTS']:
            score += 20
    
    # Business size scoring
    total_capital = client_row.get('total_capital_assured', 0)
    if total_capital > 1000000 and product in PREMIUM_PRODUCTS:
        score += 20
    
    # Client value scoring
    client_score = client_row.get('final_client_score', 0)
    score += (client_score / 100) * PRODUCT_SCORING_WEIGHTS['product_client_fit'] * 100
    
    # Profitability scoring
    if product in PREMIUM_PRODUCTS:
        score += PRODUCT_SCORING_WEIGHTS['profitability'] * 100
    
    # Urgency scoring
    risk_profile = client_row.get('RISK_PROFILE', 'MEDIUM_RISK')
    if risk_profile == 'HIGH_RISK':
        score += PRODUCT_SCORING_WEIGHTS['urgency'] * 100
    
    return min(score, 100)