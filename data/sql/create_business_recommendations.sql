CREATE TABLE business_recommendations (
    REF_PERSONNE INT PRIMARY KEY,
    RAISON_SOCIALE VARCHAR(255),
    recommended_products JSON,
    recommendation_count INT,
    client_score DECIMAL(30, 20),
    client_segment VARCHAR(255),
    risk_profile VARCHAR(255),
    estimated_budget DECIMAL(30, 20),
    SECTEUR_GROUP VARCHAR(255),
    ACTIVITE_GROUP VARCHAR(255),
    BUSINESS_RISK_PROFILE VARCHAR(255),
    total_capital_assured DECIMAL(30, 20),
    total_premiums_paid DECIMAL(30, 20),
    client_type VARCHAR(255)
);