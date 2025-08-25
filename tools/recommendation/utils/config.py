## This File handles configuration,constants and logging setup.

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("business_recommendations.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("business_recommendation_engine")

# Business-specific constants
BUSINESS_RISK_PROFILES = {
    'HIGH_RISK': 0.9,
    'MEDIUM_RISK':1.0,
    'LOW_RISK':1.1
}

BUSINESS_SEGMENT_THRESHOLDS = {
    'Enterprise': 85,
    'Business': 70,
    'SME': 50,
    'Small Business': 30,
    'Startup': 0
}

# Minimum premium for business recommendations
MINIMUM_BUSINESS_BUDGET = 1000
BUDGET_MULTIPLIER = 1.5
LARGE_BUSINESS_CAPITAL_THRESHOLD = 500000