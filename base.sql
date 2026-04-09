SET session_replication_role = replica;

-- =========================
-- DROP TABLES (ordre important)
-- =========================
DROP TABLE IF EXISTS workflow_logs CASCADE;
DROP TABLE IF EXISTS department_access CASCADE;
DROP TABLE IF EXISTS bon_commandes CASCADE;
DROP TABLE IF EXISTS proformas CASCADE;
DROP TABLE IF EXISTS fournisseurs CASCADE;
DROP TABLE IF EXISTS demandes_achat CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS commandes CASCADE;
DROP TABLE IF EXISTS produits CASCADE;
DROP TABLE IF EXISTS opportunites CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- =========================
-- Réactiver contraintes
-- =========================
SET session_replication_role = DEFAULT;





-- =========================
-- DATABASE : CRM + ERP
-- =========================

-- =========================
-- TABLE : departments
-- =========================
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE
);

-- =========================
-- TABLE : roles
-- =========================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE
);

-- =========================
-- TABLE : users
-- =========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    password VARCHAR(255),
    enabled BOOLEAN DEFAULT TRUE,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- =========================
-- TABLE : user_roles
-- =========================
CREATE TABLE user_roles (
    user_id INT,
    role_id INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- =========================
-- CRM TABLES
-- =========================

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    email VARCHAR(150),
    telephone VARCHAR(50),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    client_id INT,
    type VARCHAR(50),
    date TIMESTAMP,
    description TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE opportunites (
    id SERIAL PRIMARY KEY,
    client_id INT,
    montant NUMERIC(10,2),
    statut VARCHAR(50),
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- =========================
-- ERP TABLES
-- =========================

CREATE TABLE produits (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    prix NUMERIC(10,2),
    stock INT,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE commandes (
    id SERIAL PRIMARY KEY,
    client_id INT,
    date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    montant_total NUMERIC(10,2),
    department_id INT,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20),
    montant NUMERIC(10,2),
    description TEXT,
    date_transaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- =========================
-- WORKFLOW ACHAT
-- =========================

CREATE TABLE demandes_achat (
    id SERIAL PRIMARY KEY,
    produit VARCHAR(100),
    quantite INT,
    department_id INT,
    statut VARCHAR(50),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE fournisseurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    contact VARCHAR(100)
);

CREATE TABLE proformas (
    id SERIAL PRIMARY KEY,
    demande_id INT,
    fournisseur_id INT,
    prix NUMERIC(10,2),
    delai INT,
    statut VARCHAR(50),
    FOREIGN KEY (demande_id) REFERENCES demandes_achat(id),
    FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id)
);

CREATE TABLE bon_commandes (
    id SERIAL PRIMARY KEY,
    proforma_id INT,
    date TIMESTAMP,
    statut VARCHAR(50),
    FOREIGN KEY (proforma_id) REFERENCES proformas(id)
);




-- =========================
-- SEED DATA REALISTE
-- =========================



-- Roles


-- Users
INSERT INTO users (nom, email, password, enabled, department_id) VALUES
('Jean Directeur', 'directeur@company.com', '1234', TRUE, 1),
('Paul Finance', 'finance@company.com', '1234', TRUE, 2),
('Marie RH', 'rh@company.com', '1234', TRUE, 3),
('Lucas Commercial', 'commercial@company.com', '1234', TRUE, 4),
('Kevin IT', 'it@company.com', '1234', TRUE, 5),
('Tojo Magasiner', 'magasiner@company.com', '1234', TRUE, 6);

-- User Roles
INSERT INTO user_roles VALUES
(1,1),
(2,2),
(3,3),
(4,4),
(5,4),
(6,4);

-- Clients
INSERT INTO clients (nom, email, telephone, department_id) VALUES
('Entreprise Alpha', 'alpha@mail.com', '0340000001', 4),
('Entreprise Beta', 'beta@mail.com', '0340000002', 4);

-- Produits
INSERT INTO produits (nom, prix, stock, department_id) VALUES
('Ordinateur HP', 1500000, 10, 5),
('Imprimante Canon', 500000, 5, 5);

-- Commandes
INSERT INTO commandes (client_id, montant_total, department_id) VALUES
(1, 3000000, 4),
(2, 500000, 4);

-- Transactions
INSERT INTO transactions (type, montant, description, department_id) VALUES
('ENTREE', 3000000, 'Vente ordinateurs', 2),
('SORTIE', 500000, 'Achat imprimante', 2);

-- Fournisseurs
INSERT INTO fournisseurs (nom, contact) VALUES
('Tech Supplier', 'contact@tech.com'),
('Global IT', 'contact@globalit.com');

-- Demande achat
INSERT INTO demandes_achat (produit, quantite, department_id, statut) VALUES
('Ordinateur', 5, 5, 'EN_ATTENTE');

-- Proforma
INSERT INTO proformas (demande_id, fournisseur_id, prix, delai, statut) VALUES
(1, 1, 7000000, 7, 'EN_ATTENTE'),
(1, 2, 6800000, 10, 'EN_ATTENTE');







-- 👑 Direction peut tout voir
INSERT INTO department_access (department_id, can_view_department_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5);

-- 💰 Finance peut voir Finance + IT + Commercial
INSERT INTO department_access (department_id, can_view_department_id) VALUES
(2, 2),
(2, 3),
(2, 4);

-- 💻 IT peut voir seulement IT
INSERT INTO department_access (department_id, can_view_department_id) VALUES
(3, 3);

-- 📊 Commercial peut voir seulement Commercial
INSERT INTO department_access (department_id, can_view_department_id) VALUES
(4, 4);

-- 👥 RH peut voir RH + Finance
INSERT INTO department_access (department_id, can_view_department_id) VALUES
(5, 5),
(5, 2);

CREATE TABLE workflow_logs (
    id SERIAL PRIMARY KEY,
    demande_id INT,
    action VARCHAR(100),
    user_id INT,
    department_id INT,
    commentaire TEXT,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (demande_id) REFERENCES demandes_achat(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);


ALTER TABLE demandes_achat
ADD COLUMN user_id INT;

ALTER TABLE demandes_achat
ADD CONSTRAINT fk_demande_user
FOREIGN KEY (user_id)
REFERENCES users(id);



alter table departments add column scores int;

INSERT INTO departments (nom, scores) VALUES
('Direction', 100),
('Finance', 80),
('RH', 70),
('Commercial', 90),
('IT', 50),
('Magasiner', 10);


CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    produit_id INT,
    type VARCHAR(20), -- ENTREE / SORTIE
    quantite INT,
    date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    commentaire TEXT,

    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);


-- SELECT d.nom,d.id
-- FROM department_access da
-- JOIN departments d ON d.id = da.can_view_department_id
-- WHERE da.department_id = 2;