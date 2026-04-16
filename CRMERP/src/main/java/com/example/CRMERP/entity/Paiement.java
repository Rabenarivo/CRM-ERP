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