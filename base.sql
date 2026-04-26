-- =====================================
-- RESET
-- =====================================
SET session_replication_role = replica;

DROP TABLE IF EXISTS workflow_logs CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS offres CASCADE;
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
DROP TABLE IF EXISTS livraisons CASCADE;
DROP TABLE IF EXISTS factures CASCADE;
DROP TABLE IF EXISTS paiements CASCADE;

SET session_replication_role = DEFAULT;

-- =====================================
-- TABLES PRINCIPALES
-- =====================================

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    scores INT
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE fournisseurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    contact VARCHAR(100)
);

-- =====================================
-- TABLES AVEC FK
-- =====================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    password VARCHAR(255),
    enabled BOOLEAN DEFAULT TRUE,
    entreprise_id INT,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    email VARCHAR(150),
    telephone VARCHAR(50),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

ALTER TABLE users
ADD CONSTRAINT fk_users_entreprise
FOREIGN KEY (entreprise_id) REFERENCES clients(id);

CREATE TABLE produits (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    prix NUMERIC(10,2),
    stock INT,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- =====================================
-- TABLES DE LIAISON
-- =====================================

CREATE TABLE user_roles (
    user_id INT,
    role_id INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE department_access (
    department_id INT,
    can_view_department_id INT,
    PRIMARY KEY (department_id, can_view_department_id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (can_view_department_id) REFERENCES departments(id)
);

-- =====================================
-- CRM
-- =====================================

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

-- =====================================
-- ERP
-- =====================================

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

-- =====================================
-- WORKFLOW ACHAT
-- =====================================

CREATE TABLE demandes_achat (
    id SERIAL PRIMARY KEY,
    produit VARCHAR(100),
    quantite INT,
    department_id INT,
    statut VARCHAR(50),
    user_id INT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
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

-- =====================================
-- AUTRES TABLES
-- =====================================

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

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    produit_id INT,
    type VARCHAR(20),
    quantite INT,
    date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    commentaire TEXT,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE offres (
    id SERIAL PRIMARY KEY,
    demande_id INT NOT NULL,
    fournisseur_id INT NOT NULL,
    reference VARCHAR(100),
    delai_livraison INT,
    validite DATE,
    description TEXT,
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (demande_id) REFERENCES demandes_achat(id),
    FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id)
);

-- =====================================
-- SEEDS
-- =====================================

-- Departments
INSERT INTO departments (nom, scores) VALUES
('Direction', 100),
('Finance', 80),
('RH', 70),
('Commercial', 90),
('IT', 50),
('Magasiner', 10),
('Livreur', 60);

INSERT INTO departments (nom, scores) VALUES
('Admin', 120);




INSERT INTO users (nom, email, password, enabled, department_id) VALUES
('Admin Directeur', 'admin@company.com', '1234', TRUE, 8);

-- Roles
INSERT INTO roles (nom) VALUES
('ADMIN'),
('FINANCE'),
('RH'),
('USER'),
('LIVREUR');

-- Users
INSERT INTO users (nom, email, password, enabled, department_id) VALUES
('Jean Directeur', 'directeur@company.com', '1234', TRUE, 1),
('Paul Finance', 'finance@company.com', '1234', TRUE, 2),
('Marie RH', 'rh@company.com', '1234', TRUE, 3),
('Lucas Commercial', 'commercial@company.com', '1234', TRUE, 4),
('Kevin IT', 'it@company.com', '1234', TRUE, 5),
('Tojo Magasiner', 'magasiner@company.com', '1234', TRUE, 6),
('David Livreur', 'livreur@company.com', '1234', TRUE, 7);


INSERT INTO users (nom, email, password, enabled,entreprise_id, department_id) VALUES
('Livreur 2', 'livreur2@company.com', '1234', TRUE,2, 7);
INSERT INTO users (nom, email, password, enabled,entreprise_id, department_id) VALUES
('Livreur 3', 'livreur3@company.com', '1234', TRUE,1, 7);

-- User Roles
INSERT INTO user_roles VALUES
(1,1),(2,2),(3,3),(4,4),(5,4),(6,4);

-- Clients
INSERT INTO clients (nom, email, telephone, department_id) VALUES
('Entreprise Alpha', 'alpha@mail.com', '0340000001', 4),
('Entreprise Beta', 'beta@mail.com', '0340000002', 4);

UPDATE users SET entreprise_id = 1 WHERE id IN (1,2,3,4,5,6,7);


-- Produits
INSERT INTO produits (nom, prix, stock, department_id) VALUES
('Ordinateur HP', 1500000, 10, NULL),
('Imprimante Canon', 500000, 5, NULL);

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

-- Demandes achat
INSERT INTO demandes_achat (produit, quantite, department_id, statut, user_id) VALUES
('Ordinateur', 5, 5, 'EN_ATTENTE', 5);

-- Proformas
INSERT INTO proformas (demande_id, fournisseur_id, prix, delai, statut) VALUES
(1, 1, 7000000, 7, 'EN_ATTENTE'),
(1, 2, 6800000, 10, 'EN_ATTENTE');

-- Department access
INSERT INTO department_access VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),
(2,2),(2,3),(2,4),
(3,3),
(4,4),
(5,5),(5,2);



ALTER TABLE produits ADD COLUMN stock_disponible INT NOT NULL DEFAULT 0;
ALTER TABLE produits ADD COLUMN stock_reserve INT NOT NULL DEFAULT 0;
ALTER TABLE produits ADD COLUMN stock_min INT NOT NULL DEFAULT 0;


UPDATE produits
SET stock_disponible = COALESCE(stock, 0),
stock_reserve = 0,
stock_min = 0;


-- =====================================
-- LIVRAISONS
-- =====================================
CREATE TABLE livraisons (
    id SERIAL PRIMARY KEY,
    commande_id INT NOT NULL,
    entreprise_id INT NOT NULL,
    reference VARCHAR(100) UNIQUE,
    statut VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    date_livraison TIMESTAMP,
    commentaire TEXT,
    user_id INT,
    department_id INT,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (commande_id) REFERENCES commandes(id),
    FOREIGN KEY (entreprise_id) REFERENCES clients(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE INDEX idx_livraisons_commande_id ON livraisons(commande_id);
CREATE INDEX idx_livraisons_entreprise_id ON livraisons(entreprise_id);
CREATE INDEX idx_livraisons_statut ON livraisons(statut);


-- =====================================
-- FACTURES
-- =====================================
CREATE TABLE factures (
    id SERIAL PRIMARY KEY,
    livraison_id INT NOT NULL,
    client_id INT NOT NULL,
    reference VARCHAR(100) UNIQUE,
    statut VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    montant_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
    tva NUMERIC(12,2) NOT NULL DEFAULT 0,
    montant_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
    date_facture TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_echeance DATE,
    department_id INT,

    FOREIGN KEY (livraison_id) REFERENCES livraisons(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE INDEX idx_factures_livraison_id ON factures(livraison_id);
CREATE INDEX idx_factures_client_id ON factures(client_id);
CREATE INDEX idx_factures_statut ON factures(statut);


-- =====================================
-- PAIEMENTS
-- =====================================
CREATE TABLE paiements (
    id SERIAL PRIMARY KEY,
    facture_id INT NOT NULL,
    reference VARCHAR(100) UNIQUE,
    mode_paiement VARCHAR(30) NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'VALIDE',
    montant NUMERIC(12,2) NOT NULL,
    date_paiement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    commentaire TEXT,
    user_id INT,
    department_id INT,

    FOREIGN KEY (facture_id) REFERENCES factures(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE INDEX idx_paiements_facture_id ON paiements(facture_id);
CREATE INDEX idx_paiements_statut ON paiements(statut);





-- =====================================
-- LOTS 
-- =====================================
CREATE TABLE livraison_lots (
id SERIAL PRIMARY KEY,
livraison_id INT NOT NULL,
produit_id INT NOT NULL,
lot_reference VARCHAR(120) NOT NULL,
quantite_livree INT NOT NULL CHECK (quantite_livree > 0),
quantite_retournee INT NOT NULL DEFAULT 0 CHECK (quantite_retournee >= 0),
statut_qualite VARCHAR(20) NOT NULL DEFAULT 'CONFORME'
CHECK (statut_qualite IN ('CONFORME', 'DEFECTUEUX', 'HS')),
date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (livraison_id) REFERENCES livraisons(id) ON DELETE CASCADE,
FOREIGN KEY (produit_id) REFERENCES produits(id),
UNIQUE (livraison_id, produit_id, lot_reference)

);


CREATE INDEX idx_livraison_lots_livraison_id ON livraison_lots(livraison_id);
CREATE INDEX idx_livraison_lots_produit_id ON livraison_lots(produit_id);
CREATE INDEX idx_livraison_lots_statut_qualite ON livraison_lots(statut_qualite);




CREATE TABLE retours_livraison (
id SERIAL PRIMARY KEY,
livraison_id INT NOT NULL,
reference VARCHAR(100) UNIQUE,
statut VARCHAR(30) NOT NULL DEFAULT 'BROUILLON'
CHECK (statut IN ('BROUILLON', 'DEMANDE', 'VALIDE', 'REFUSE', 'CLOTURE')),
motif_global VARCHAR(30),
commentaire TEXT,
date_retour TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
user_id INT,
department_id INT,


FOREIGN KEY (livraison_id) REFERENCES livraisons(id),
FOREIGN KEY (user_id) REFERENCES users(id),
FOREIGN KEY (department_id) REFERENCES departments(id)
);


CREATE INDEX idx_retours_livraison_livraison_id ON retours_livraison(livraison_id);
CREATE INDEX idx_retours_livraison_statut ON retours_livraison(statut);



CREATE TABLE retour_livraison_lignes (
id SERIAL PRIMARY KEY,
retour_id INT NOT NULL,
livraison_lot_id INT NOT NULL,
produit_id INT NOT NULL,
motif VARCHAR(30) NOT NULL
CHECK (motif IN ('DEFECTUEUX', 'HS', 'ERREUR_LIVRAISON', 'AUTRE')),
quantite_retour INT NOT NULL CHECK (quantite_retour > 0),
decision_stock VARCHAR(30) NOT NULL DEFAULT 'QUARANTAINE'
CHECK (decision_stock IN ('REINTEGRATION', 'QUARANTAINE', 'HS', 'RETOUR_FOURNISSEUR')),
commentaire TEXT,


FOREIGN KEY (retour_id) REFERENCES retours_livraison(id) ON DELETE CASCADE,
FOREIGN KEY (livraison_lot_id) REFERENCES livraison_lots(id),
FOREIGN KEY (produit_id) REFERENCES produits(id),
UNIQUE (retour_id, livraison_lot_id)
);


CREATE INDEX idx_retour_lignes_retour_id ON retour_livraison_lignes(retour_id);
CREATE INDEX idx_retour_lignes_lot_id ON retour_livraison_lignes(livraison_lot_id);
CREATE INDEX idx_retour_lignes_produit_id ON retour_livraison_lignes(produit_id);



ALTER TABLE stock_movements ADD COLUMN source_type VARCHAR(30);
ALTER TABLE stock_movements ADD COLUMN source_id INT;
ALTER TABLE stock_movements ADD COLUMN etat_produit VARCHAR(20)
CHECK (etat_produit IN ('CONFORME', 'DEFECTUEUX', 'HS'));

CREATE INDEX idx_stock_movements_source ON stock_movements(source_type, source_id);



-- SELECT d.nom,d.id
-- FROM department_access da
-- JOIN departments d ON d.id = da.can_view_department_id
-- WHERE da.department_id = 2;






SELECT 
    o.id,
    o.demande_id,
    o.fournisseur_id,
    o.reference,
    o.delai_livraison,
    o.validite,
    o.description,
    o.statut,
    o.date_creation
FROM offres o
WHERE NOT EXISTS (
    SELECT 1
    FROM proformas p
    WHERE p.demande_id = o.demande_id
      AND p.fournisseur_id = o.fournisseur_id);