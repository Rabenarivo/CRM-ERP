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