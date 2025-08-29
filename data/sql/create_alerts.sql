CREATE TABLE alerts (
    REF_PERSONNE DECIMAL(15, 2),
    alert_type VARCHAR(28),
    alert_message VARCHAR(177),
    alert_severity VARCHAR(9),
    contract_id DECIMAL(15, 2),
    product VARCHAR(108),
    expiration_date DATETIME,
    days_until_expiry DECIMAL(15, 2),
    cancellation_date DATETIME,
    active_contracts DECIMAL(15, 2),
    total_premium DECIMAL(15, 2)
);