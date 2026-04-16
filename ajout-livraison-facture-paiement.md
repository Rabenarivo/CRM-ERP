# Ajout de tables: Livraison -> Facture -> Paiement

Ce document propose:
- Les tables SQL a ajouter dans ta base actuelle.
- Les entites JPA (Spring Boot) pour ces 3 tables.
- Une structure compatible avec ton schema existant (`commandes`, `clients`, `departments`, `users`).

## 1) SQL - Ajout des tables

```sql
-- =====================================
-- LIVRAISONS
-- =====================================
CREATE TABLE livraisons (
    id SERIAL PRIMARY KEY,
    commande_id INT NOT NULL,
    reference VARCHAR(100) UNIQUE,
    statut VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    date_livraison TIMESTAMP,
    commentaire TEXT,
    user_id INT,
    department_id INT,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (commande_id) REFERENCES commandes(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE INDEX idx_livraisons_commande_id ON livraisons(commande_id);
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
```

## 2) Entites JPA - Livraison, Facture, Paiement

Note:
- Les enums peuvent etre remplaces par `String` si tu veux rester proche de tes entites actuelles.
- Ici, on garde `String` pour coherence avec le projet existant.

### 2.1 Entite Livraison

```java
package com.example.CRMERP.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "livraisons")
public class Livraison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "commande_id", nullable = false)
    private Commande commande;

    private String reference;

    private String statut; // BROUILLON, PRETE, LIVREE, ANNULEE

    private LocalDateTime dateLivraison;

    private String commentaire;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    private LocalDateTime dateCreation;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        if (statut == null) {
            statut = "BROUILLON";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Commande getCommande() { return commande; }
    public void setCommande(Commande commande) { this.commande = commande; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public LocalDateTime getDateLivraison() { return dateLivraison; }
    public void setDateLivraison(LocalDateTime dateLivraison) { this.dateLivraison = dateLivraison; }

    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
```

### 2.2 Entite Facture

```java
package com.example.CRMERP.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "factures")
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "livraison_id", nullable = false)
    private Livraison livraison;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    private String reference;

    private String statut; // BROUILLON, EMISE, PARTIELLEMENT_PAYEE, PAYEE, ANNULEE

    @Column(name = "montant_ht")
    private Double montantHt;

    private Double tva;

    @Column(name = "montant_ttc")
    private Double montantTtc;

    private LocalDateTime dateFacture;

    private LocalDate dateEcheance;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    @PrePersist
    public void prePersist() {
        if (dateFacture == null) {
            dateFacture = LocalDateTime.now();
        }
        if (statut == null) {
            statut = "BROUILLON";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Livraison getLivraison() { return livraison; }
    public void setLivraison(Livraison livraison) { this.livraison = livraison; }

    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public Double getMontantHt() { return montantHt; }
    public void setMontantHt(Double montantHt) { this.montantHt = montantHt; }

    public Double getTva() { return tva; }
    public void setTva(Double tva) { this.tva = tva; }

    public Double getMontantTtc() { return montantTtc; }
    public void setMontantTtc(Double montantTtc) { this.montantTtc = montantTtc; }

    public LocalDateTime getDateFacture() { return dateFacture; }
    public void setDateFacture(LocalDateTime dateFacture) { this.dateFacture = dateFacture; }

    public LocalDate getDateEcheance() { return dateEcheance; }
    public void setDateEcheance(LocalDate dateEcheance) { this.dateEcheance = dateEcheance; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
}
```

### 2.3 Entite Paiement

```java
package com.example.CRMERP.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements")
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "facture_id", nullable = false)
    private Facture facture;

    private String reference;

    private String modePaiement; // ESPECES, VIREMENT, MOBILE_MONEY, CHEQUE

    private String statut; // VALIDE, ANNULE

    private Double montant;

    private LocalDateTime datePaiement;

    private String commentaire;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    @PrePersist
    public void prePersist() {
        if (datePaiement == null) {
            datePaiement = LocalDateTime.now();
        }
        if (statut == null) {
            statut = "VALIDE";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Facture getFacture() { return facture; }
    public void setFacture(Facture facture) { this.facture = facture; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getModePaiement() { return modePaiement; }
    public void setModePaiement(String modePaiement) { this.modePaiement = modePaiement; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public Double getMontant() { return montant; }
    public void setMontant(Double montant) { this.montant = montant; }

    public LocalDateTime getDatePaiement() { return datePaiement; }
    public void setDatePaiement(LocalDateTime datePaiement) { this.datePaiement = datePaiement; }

    public String getCommentaire() { return commentaire; }
    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
}
```

## 3) Regles metier minimales (recommandees)

1. Livraison validee -> creation de mouvement `SORTIE_VENTE` dans `stock_movements`.
2. Facture emise -> creation d'une transaction comptable de vente (entree).
3. Paiement valide -> creation d'une transaction de reglement client.
4. Facture `PAYEE` seulement si somme(paiements valides) >= montantTtc.

## 4) Option utile pour ta traçabilite stock

Si tu veux un niveau ERP plus robuste, ajoute a `stock_movements`:

```sql
ALTER TABLE stock_movements ADD COLUMN source_type VARCHAR(30);
ALTER TABLE stock_movements ADD COLUMN source_id INT;
```

Exemple:
- `source_type = 'LIVRAISON'`
- `source_id = <id livraison>`

Cela permet de savoir exactement quel document a provoque le mouvement de stock.
