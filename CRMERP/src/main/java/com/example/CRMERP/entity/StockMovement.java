package com.example.CRMERP.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; 

    private Integer quantite;

    private String commentaire;

    private LocalDateTime dateMouvement;

    @ManyToOne
    @JoinColumn(name = "produit_id")
    private Produit produit;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;


    @PrePersist
    public void prePersist() {
        this.dateMouvement = LocalDateTime.now();
    }



    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }

    public void setType(String type) { this.type = type; }

    public Integer getQuantite() { return quantite; }

    public void setQuantite(Integer quantite) { this.quantite = quantite; }

    public String getCommentaire() { return commentaire; }

    public void setCommentaire(String commentaire) { this.commentaire = commentaire; }

    public LocalDateTime getDateMouvement() { return dateMouvement; }

    public void setDateMouvement(LocalDateTime dateMouvement) {
        this.dateMouvement = dateMouvement;
    }

    public Produit getProduit() { return produit; }

    public void setProduit(Produit produit) { this.produit = produit; }

    public User getUser() { return user; }

    public void setUser(User user) { this.user = user; }
}