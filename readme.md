# 📊 ERP System

## 🧠 Description

Ce projet est un système complet de gestion d’entreprise combinant :

* **CRM (Customer Relationship Management)** → gestion des clients et des ventes
* **ERP (Enterprise Resource Planning)** → gestion interne (stock, finance, achats)

---

## ⚙️ Technologies

* Backend : Spring Boot
* Frontend : React
* Base de données : PostgreSQL
* ORM : Hibernate (JPA)

---

## 🔹 Fonctionnalités

### 📌 ERP

* Gestion des produits
* Gestion du stock
* Transactions financières
* Workflow d’achat avec validation

---

## 🔄 Workflow d’achat

1. Demande d’un département (ex : IT demande 5 PC)
2. Validation par Finance
3. Vérification du stock
4. Si insuffisant → demande de devis fournisseurs
5. Choix du fournisseur (Finance)
6. Validation RH
7. Génération du Bon de Commande (BC)
8. Réception et mise à jour du stock

---

## 🔐 Sécurité

* Gestion des rôles (RBAC)
* Isolation par département
* Accès selon rôle :

  * Directeur → accès global
  * Finance → transactions
  * Commercial → CRM
  * RH → accès limité

---

## 🗄️ Structure base de données

### Gestion utilisateurs

* users
* roles
* departments
* user_roles


### ERP

* produits
* commandes
* transactions

### Workflow achat

* demandes_achat
* fournisseurs
* proformas
* bon_commandes

---

# 🚀 Méthodologie Agile (Scrum)

## 🔁 Principe

Le projet est développé en plusieurs **sprints** (cycles courts de 1 à 2 semaines).

Chaque sprint permet de livrer une partie fonctionnelle du système.

---

## 📅 Plan des Sprints

### 🟢 Sprint 1 : Initialisation

* Création projet Spring Boot
* Configuration PostgreSQL
* Connexion base de données
* Structure backend

👉 Résultat : projet prêt

---

### 🟢 Sprint 2 : Authentification

* Création table users
* Login / Register
* Hash password (BCrypt)

👉 Résultat : utilisateur peut se connecter

---

### 🟢 Sprint 3 : Rôles & Sécurité

* Tables roles + user_roles
* Gestion des autorisations
* Sécurisation API

👉 Résultat : accès contrôlé

---

### 🟢 Sprint 4 : Départements

* Table departments
* Liaison user → department
* Filtrage des données

👉 Résultat : isolation des données

---

### 🟢 Sprint 5 : CRM

* CRUD clients
* Interactions
* Opportunités

👉 Résultat : module CRM fonctionnel

---

### 🟢 Sprint 6 : Produits & Stock

* CRUD produits
* Gestion du stock

👉 Résultat : base ERP prête

---

### 🟢 Sprint 7 : Commandes

* Création commandes
* Liaison client

👉 Résultat : ventes opérationnelles

---

### 🟢 Sprint 8 : Finance

* Transactions (entrée / sortie)
* Sécurité finance

👉 Résultat : gestion financière

---

### 🟢 Sprint 9 : Workflow d’achat

* Demande d’achat
* Validation finance
* Proforma fournisseurs
* Bon de commande

👉 Résultat : processus métier complet

---

### 🟢 Sprint 10 : Finalisation

* Tests
* Correction bugs
* Optimisation
* UI/UX

👉 Résultat : projet prêt pour soutenance 🚀

---

## 🧠 Conclusion

Ce système permet :

* Gestion complète des clients (CRM)
* Gestion interne avancée (ERP)
* Sécurité par rôles et départements
* Automatisation des processus métiers

👉 Projet complet de niveau professionnel 💯
