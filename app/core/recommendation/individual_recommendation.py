import pandas as pd
from datetime import datetime
from app.core.config import logger, BUDGET_CONFIG, PREMIUM_PRODUCTS, PRODUCT_SCORING_WEIGHTS, CLAIMS_ANALYSIS_CONFIG, ALERT_CONFIG

def recommend_individual_insurance_enhanced(client_row, df_contrats, df_products, df_sinistres=None):
    """Enhanced recommendation function for individual clients"""
    
    client_id = client_row['REF_PERSONNE']
    logger.debug(f"Generating enhanced recommendations for individual client: {client_id}")
    
    # 1. GET CLIENT'S EXISTING COVERAGE
    client_contracts = df_contrats[df_contrats['REF_PERSONNE'] == client_id]
    existing_products = set(client_contracts['LIB_PRODUIT'].unique())
    
    # Merge with products to get categories
    client_portfolio = client_contracts.merge(df_products, on='LIB_PRODUIT', how='left')                                       
    existing_categories = set(client_portfolio['LIB_SOUS_BRANCHE'].dropna().unique())
    
    # 2. CALCULATE CLIENT'S INSURANCE BUDGET
    config = BUDGET_CONFIG['individual']
    total_premiums = client_row.get('total_premiums_paid', 0)
    avg_premium = client_row.get('avg_premium_per_contract', 0)
    avg_capital = client_row.get('avg_capital_per_contract', 0)
    
    estimated_budget = max(
        total_premiums * config['multiplier'],
        avg_premium * 3,
        avg_capital * config['premium_ratio'],
        config['minimum']
    )
    
    # 3. PRIORITIZE INSURANCE NEEDS BASED ON CLIENT PROFILE
    priority_categories = []
    
    # Base protection everyone needs
    base_needs = ['MALADIE', 'INDIVIDUELLE ACCIDENTS']
    priority_categories.extend(base_needs)
    
    # Family situation-based needs
    family_situation = client_row.get('SITUATION_FAMILIALE', '')
    if family_situation in ['MARIE', 'VEUF(VE)']:
        priority_categories.extend(['DECES'])  # Essential for dependents
    if family_situation == 'MARIE' and client_row.get('AGE', 0) > 30:
        priority_categories.extend(['VIE', 'CAPITALISATION'])  # Family wealth building
    
    # Age-based needs
    age = client_row.get('AGE', 0)
    if age > 50:
        priority_categories.extend(['CAPITALISATION'])  # Retirement focus
    if age < 35:
        priority_categories.extend(['ASSISTANCE EN VOYAGES'])  # Younger, mobile clients
    
    # Profession-based needs
    profession = client_row.get('PROFESSION_GROUP', '')
    if profession in ['TECHNICIENS_ET_ARTISANS', 'BATIMENT_ET_TRAVAUX', 'INDUSTRIE_ET_PRODUCTION']:
        priority_categories.extend(['INDIVIDUELLE ACCIDENTS'])  # High physical risk
    if profession in ['CADRES_SUPERIEURS', 'COMMERCE_ET_VENTE', 'SANTE_ET_MEDICAL']:
        priority_categories.extend(['RESPONSABILITE CIVILE'])  # Professional liability
    
    # Sector-based needs
    secteur = client_row.get('SECTEUR_ACTIVITE_GROUP', '')
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
    
    # 5. ADD CLAIMS-BASED RECOMMENDATIONS
    if df_sinistres is not None:
        claims_recommendations = get_claims_based_recommendations_individual(client_id, df_sinistres, df_contrats, df_products)
        recommended_products.extend(claims_recommendations)
    
    # 6. ADD ALERT-BASED RECOMMENDATIONS
    alerts = generate_individual_alerts(client_id, df_contrats)
    for alert in alerts:
        if 'Recently canceled contract' in str(alert['reasons']):
            # Find alternative products in same branch
            branch_products = df_products[df_products['LIB_BRANCHE'] == alert['branche']]['LIB_PRODUIT'].unique()
            if len(branch_products) > 0:
                recommended_products.append(branch_products[0])
    
    # 7. FILTER BY BUDGET AND SCORE PRODUCTS
    final_recommendations = []
    scored_products = score_individual_products(recommended_products, client_row, df_products)
    
    for product_score in scored_products:
        product = product_score['product']
        # Simple budget check
        product_data = df_products[df_products['LIB_PRODUIT'] == product]
        if not product_data.empty:
            if ('BASIQUE' in product or 'STANDARD' in product or 
                estimated_budget > 1000 or
                len(existing_products) == 0):
                final_recommendations.append({
                    'product': product,
                    'score': product_score['score'],
                    'confidence': product_score['confidence'],
                    'reason': f"Based on client profile and scoring: {product_score['score']}/100"
                })
    
    # Sort by score and take top 3
    final_recommendations.sort(key=lambda x: x['score'], reverse=True)
    
    logger.debug(f"Generated {len(final_recommendations)} enhanced recommendations for client {client_id}")
    return final_recommendations[:3]

def analyze_claims_for_individual(client_id, df_sinistres, df_contrats):
    """Analyze claims for individual clients"""
    client_contracts = df_contrats[df_contrats['REF_PERSONNE'] == client_id]['NUM_CONTRAT'].unique()
    client_claims = df_sinistres[df_sinistres['NUM_CONTRAT'].isin(client_contracts)]
    
    if client_claims.empty:
        return {}
    
    return {
        'total_claims': len(client_claims),
        'claim_categories': client_claims['LIB_SOUS_BRANCHE'].value_counts().to_dict(),
        'high_risk_claims': len(client_claims[client_claims['TAUX_RESPONSABILITE'] == 100]),
        'recent_claims': len(client_claims[pd.to_datetime(client_claims['DATE_SURVENANCE']) > 
                                         datetime.now() - pd.Timedelta(days=CLAIMS_ANALYSIS_CONFIG['recent_claims_days'])]),
        'total_claim_amount': client_claims['MONTANT_ENCAISSE'].sum()
    }

def generate_individual_alerts(client_id, df_contrats):
    """Generate alerts for individual clients"""
    alerts = []
    client_contracts = df_contrats[df_contrats['REF_PERSONNE'] == client_id]
    current_date = datetime.now()
    
    for _, contract in client_contracts.iterrows():
        alert_reasons = []
        
        # Expiration alerts
        if pd.notna(contract['DATE_EXPIRATION']):
            exp_date = pd.to_datetime(contract['DATE_EXPIRATION'])
            days_until_expiry = (exp_date - current_date).days
            if 0 <= days_until_expiry <= ALERT_CONFIG['expiration_alert_days']:
                alert_reasons.append(f'Contract expires in {days_until_expiry} days')
        
        # Cancellation alerts
        if contract['LIB_ETAT_CONTRAT'] == 'RESILIE':
            if pd.notna(contract['EFFET_CONTRAT']):
                eff_date = pd.to_datetime(contract['EFFET_CONTRAT'])
                days_since_cancel = (current_date - eff_date).days
                if days_since_cancel <= ALERT_CONFIG['recent_cancellation_days']:
                    alert_reasons.append('Recently canceled contract')
        
        # Payment alerts
        if contract['statut_paiement'] == 'Non payé' and pd.notna(contract['PROCHAIN_TERME']):
            next_term = pd.to_datetime(contract['PROCHAIN_TERME'])
            if next_term < current_date:
                overdue_days = (current_date - next_term).days
                if overdue_days >= ALERT_CONFIG['payment_overdue_days']:
                    alert_reasons.append(f'Payment overdue by {overdue_days} days')
        
        if alert_reasons:
            alerts.append({
                'NUM_CONTRAT': contract['NUM_CONTRAT'],
                'LIB_PRODUIT': contract['LIB_PRODUIT'],
                'branche': contract['branche'],
                'reasons': alert_reasons,
                'alert_level': 'HIGH' if 'Payment overdue' in str(alert_reasons) else 'MEDIUM'
            })
    
    return alerts

def get_claims_based_recommendations_individual(client_id, df_sinistres, df_contrats, df_products):
    """Get claims-based recommendations for individual clients"""
    recommendations = []
    claims_analysis = analyze_claims_for_individual(client_id, df_sinistres, df_contrats)
    
    if not claims_analysis:
        return recommendations
    
    # Analyze claims patterns
    for category, count in claims_analysis['claim_categories'].items():
        if count >= CLAIMS_ANALYSIS_CONFIG['multiple_claims_threshold']:
            if category == 'AUTOMOBILE':
                recommendations.extend(['AUTOMOBILE', 'ASSISTANCE DES VEHICULES'])
            elif category == 'INCENDIE':
                recommendations.extend(['INCENDIE RISQUES SIMPLE', 'MULTIRISQUES HABITATIONS'])
            elif category == 'VOL':
                recommendations.extend(['VOL TOUTE CATEGORIES', 'ASSISTANCE PROTECTION JURIDIQUE'])
    
    # High responsibility claims
    if claims_analysis['high_risk_claims'] >= 1:
        recommendations.append('RESPONSABILITE CIVILE')
    
    return list(set(recommendations))

def score_individual_products(recommendations, client_row, df_products):
    """Score recommended products for individual clients"""
    scored_products = []
    
    for product in recommendations:
        score = calculate_product_score_individual(product, client_row, df_products)
        scored_products.append({
            'product': product,
            'score': score,
            'confidence': min(score / 100, 1.0)
        })
    
    # Sort by score descending
    scored_products.sort(key=lambda x: x['score'], reverse=True)
    return scored_products

def calculate_product_score_individual(product, client_row, df_products):
    """Calculate product score for individual clients"""
    score = 50  # Base score
    
    # Product-client fit
    product_info = df_products[df_products['LIB_PRODUIT'] == product]
    if not product_info.empty:
        product_category = product_info['LIB_SOUS_BRANCHE'].iloc[0]
        
        # Age-based scoring
        age = client_row.get('AGE', 40)
        if product_category == 'CAPITALISATION' and age > 50:
            score += 20
        elif product_category == 'ASSISTANCE EN VOYAGES' and age < 35:
            score += 15
        
        # Family situation scoring
        if client_row.get('SITUATION_FAMILIALE', '') in ['MARIE', 'VEUF(VE)'] and product_category == 'DECES':
            score += 15
    
    # Client value scoring
    client_score = client_row.get('final_client_score', 0)
    score += (client_score / 100) * PRODUCT_SCORING_WEIGHTS['product_client_fit'] * 100
    
    # Profitability scoring
    if product in PREMIUM_PRODUCTS:
        score += PRODUCT_SCORING_WEIGHTS['profitability'] * 100
    
    # Urgency scoring (based on client segment)
    client_segment = client_row.get('client_segment', '')
    if client_segment in ['Premium', 'Gold']:
        score += PRODUCT_SCORING_WEIGHTS['urgency'] * 100
    
    return min(score, 100)