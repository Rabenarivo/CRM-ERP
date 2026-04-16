package com.example.CRMERP.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "commandes")
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(name = "date_commande")
    private LocalDateTime dateCommande;

    @Column(name = "montant_total")
    private Double montantTotal;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    @PrePersist
    public void prePersist() {
        if (dateCommande == null) {
            dateCommande = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public Client getClient() { return client; }

    public void setClient(Client client) { this.client = client; }

    public LocalDateTime getDateCommande() { return dateCommande; }

    public void setDateCommande(LocalDateTime dateCommande) { this.dateCommande = dateCommande; }

    public Double getMontantTotal() { return montantTotal; }

    public void setMontantTotal(Double montantTotal) { this.montantTotal = montantTotal; }

    public Department getDepartment() { return department; }

    public void setDepartment(Department department) { this.department = department; }
}