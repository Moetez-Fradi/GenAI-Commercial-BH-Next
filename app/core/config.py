import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("insurance_recommendation.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("insurance_recommendation")

# Client scoring weights
SCORING_WEIGHTS = {
    'individual': {
        'loyalty': 0.35,
        'financial': 0.40,
        'payment': 0.25
    },
    'business': {
        'loyalty': 0.30,
        'financial': 0.45,
        'payment': 0.25
    }
}

# Segment thresholds
SEGMENT_THRESHOLDS = {
    'individual': {
        'Premium': 85,
        'Gold': 70,
        'Silver': 50,
        'Bronze': 30,
        'Prospect': 0
    },
    'business': {
        'Enterprise': 85,
        'Business': 70,
        'SME': 50,
        'Small Business': 30,
        'Startup': 0
    }
}

# Risk profile thresholds
RISK_THRESHOLDS = {
    'Low Risk': 80,
    'Medium Risk': 50,
    'High Risk': 0
}

# Budget configuration
BUDGET_CONFIG = {
    'individual': {
        'minimum': 500,
        'multiplier': 1.5,
        'premium_ratio': 0.02
    },
    'business': {
        'minimum': 1000,
        'multiplier': 1.5,
        'premium_ratio': 0.015
    }
}

# Business risk profiles
BUSINESS_RISK_PROFILES = {
    'HIGH_RISK': 0.9,
    'MEDIUM_RISK': 1.0,
    'LOW_RISK': 1.1
}

# Large business threshold
LARGE_BUSINESS_CAPITAL_THRESHOLD = 500000

# Claims analysis configuration
CLAIMS_ANALYSIS_CONFIG = {
    'multiple_claims_threshold': 2,
    'high_risk_responsibility_rate': 100,
    'recent_claims_days': 365,
    'large_claim_threshold': 5000
}

# Alert configuration
ALERT_CONFIG = {
    'expiration_alert_days': 30,
    'recent_cancellation_days': 90,
    'payment_overdue_days': 7,
    'batch_size': 1000
}

# Product scoring weights
PRODUCT_SCORING_WEIGHTS = {
    'product_client_fit': 0.30,
    'client_value': 0.25,
    'profitability': 0.25,
    'urgency': 0.20
}

# Premium products
PREMIUM_PRODUCTS = [
    'ASSURANCE VIE COMPLEMENT RETRAITE - HORIZON+',
    'MULTIRISQUES PROFESSIONNELLES',
    'ASSURANCES EN VOYAGES - PLAN GOLDEN',
    'TOUS RISQUES CHANTIER',
    'ASSURANCE DECES VIE ENTIERE'
]

# Current date for consistent processing
CURRENT_DATE = datetime.now()