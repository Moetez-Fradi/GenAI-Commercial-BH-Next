CREATE TABLE history (
    ref_personne VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rank INT NOT NULL,
    recommendations JSON NOT NULL, -- [{"product": "Auto", "status": "accepted", "contact_method": "email"}]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE history_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref_personne VARCHAR(50),
    channel VARCHAR(50) NOT NULL,     -- whatsapp, email, sms...
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ref_personne) REFERENCES history(ref_personne) ON DELETE CASCADE
);