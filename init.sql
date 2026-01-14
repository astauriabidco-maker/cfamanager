-- Init.sql for Cfamanager V5

-- 1. Create Tables

-- Tenants
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL, 
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

-- Candidats
CREATE TABLE candidats (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(50), 
    statut VARCHAR(50) DEFAULT 'NOUVEAU', 
    cv_filename VARCHAR(255),
    cv_raw_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entreprises
CREATE TABLE entreprises (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    raison_sociale VARCHAR(255) NOT NULL,
    siret VARCHAR(50),
    adresse TEXT,
    code_idcc VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL, 
    date_debut DATE,
    date_fin DATE,
    formation_rncp_id VARCHAR(50), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Days
CREATE TABLE session_days (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_morning BOOLEAN DEFAULT TRUE,
    is_afternoon BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_date_per_session UNIQUE (session_id, date)
);

-- Contrats Dossier
CREATE TABLE contrats_dossier (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    candidat_id INTEGER NOT NULL REFERENCES candidats(id) ON DELETE CASCADE,
    entreprise_id INTEGER REFERENCES entreprises(id) ON DELETE SET NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contrats Versions (Updated with Finance fields)
CREATE TABLE contrats_versions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, 
    contrat_dossier_id INTEGER NOT NULL REFERENCES contrats_dossier(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL, 
    version_number INTEGER NOT NULL,
    salaire DECIMAL(10, 2),
    cout_npec DECIMAL(10, 2), -- NEW
    heures_formation INTEGER, -- NEW
    intitule_poste VARCHAR(255), 
    date_debut DATE,
    date_fin DATE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_version_per_dossier UNIQUE (contrat_dossier_id, version_number)
);

-- Attendance (NEW)
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_day_id INTEGER NOT NULL REFERENCES session_days(id) ON DELETE CASCADE,
    contrat_version_id INTEGER NOT NULL REFERENCES contrats_versions(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- PRESENT, ABSENT_JUSTIFIE, ABSENT_INJUSTIFIE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_attendance_per_student_day UNIQUE (contrat_version_id, session_day_id)
);

-- Invoices (NEW)
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contrat_dossier_id INTEGER NOT NULL REFERENCES contrats_dossier(id) ON DELETE CASCADE,
    numero_facture VARCHAR(50) NOT NULL,
    montant_ht DECIMAL(10, 2) NOT NULL,
    statut VARCHAR(50) DEFAULT 'BROUILLON', -- BROUILLON, EMISE, PAYEE
    date_emission DATE,
    periode_debut DATE,
    periode_fin DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Indexes

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_candidats_tenant_id ON candidats(tenant_id);
CREATE INDEX idx_entreprises_tenant_id ON entreprises(tenant_id);
CREATE INDEX idx_sessions_tenant_id ON sessions(tenant_id);
CREATE INDEX idx_session_days_session_id ON session_days(session_id);
CREATE INDEX idx_contrats_dossier_tenant_id ON contrats_dossier(tenant_id);
CREATE INDEX idx_contrats_versions_tenant_id ON contrats_versions(tenant_id);
CREATE INDEX idx_contrats_versions_dossier_id ON contrats_versions(contrat_dossier_id);
CREATE INDEX idx_contrats_versions_session_id ON contrats_versions(session_id);
CREATE INDEX idx_attendance_tenant_id ON attendance(tenant_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);


-- 3. Seed Data

INSERT INTO tenants (name, slug) VALUES 
('CFA Excellence Lyon', 'cfa-lyon'),
('CFA Excellence Paris', 'cfa-paris');

INSERT INTO users (tenant_id, email, password_hash, role) VALUES 
(1, 'admin@lyon.cfa.com', 'secret_lyon', 'admin'),
(2, 'admin@paris.cfa.com', 'secret_paris', 'admin');

INSERT INTO candidats (tenant_id, first_name, last_name, email) VALUES
(1, 'Jean', 'Dupont', 'jean.dupont@email.com');

INSERT INTO entreprises (tenant_id, raison_sociale, siret) VALUES
(1, 'Lyon Tech SAS', '12345678900001');

INSERT INTO sessions (tenant_id, nom, date_debut, date_fin) VALUES
(1, 'Promo Dev 2024', '2024-09-01', '2025-06-30');

WITH new_dossier AS (
    INSERT INTO contrats_dossier (tenant_id, candidat_id, entreprise_id) VALUES (1, 1, 1) RETURNING id
)
INSERT INTO contrats_versions (tenant_id, contrat_dossier_id, session_id, version_number, salaire, cout_npec, heures_formation, date_debut, date_fin, is_active)
SELECT 1, id, 1, 1, 1200.00, 5000.00, 500, '2024-09-01', '2026-08-31', TRUE FROM new_dossier;
