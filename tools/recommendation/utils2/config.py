# config.py
import logging
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("client_recommendations.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("client_recommendation_engine")

# Client scoring weights
SCORING_WEIGHTS = {
    'loyalty': 0.35,
    'financial': 0.40,
    'payment': 0.25
}

# Segment thresholds
SEGMENT_THRESHOLDS = {
    'Premium': 85,
    'Gold': 70,
    'Silver': 50,
    'Bronze': 30,
    'Prospect': 0
}

# Risk profile thresholds
RISK_THRESHOLDS = {
    'Low Risk': 80,
    'Medium Risk': 50,
    'High Risk': 0
}

# Minimum budget for recommendations
MINIMUM_BUDGET = 500
BUDGET_MULTIPLIER = 1.5