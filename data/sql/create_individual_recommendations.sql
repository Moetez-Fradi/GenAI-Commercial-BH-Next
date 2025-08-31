CREATE TABLE individual_recommendations (
    REF_PERSONNE INT PRIMARY KEY,
    NOM_PRENOM VARCHAR(255),
    recommended_products JSON,
    recommendation_count INT,
    client_score DECIMAL(30, 20),
    client_segment VARCHAR(255),
    risk_profile VARCHAR(255),
    estimated_budget DECIMAL(30, 20),
    AGE DECIMAL(5, 1),
    PROFESSION_GROUP text,
    SITUATION_FAMILIALE text,
    SECTEUR_ACTIVITE_GROUP text,
    client_type text
);