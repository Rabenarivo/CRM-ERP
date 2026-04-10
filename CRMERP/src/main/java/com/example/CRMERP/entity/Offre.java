package com.example.CRMERP.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "offres")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Offre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String reference;

    private Integer delaiLivraison;

    private String statut;

    private String description;

    private LocalDate validite;

    private LocalDateTime dateCreation;

    @ManyToOne
    @JoinColumn(name = "demande_id")
    private DemandeAchat demande;

    @ManyToOne
    @JoinColumn(name = "fournisseur_id")
    @JsonIgnoreProperties({"proformas"})
    private Fournisseur fournisseur;
}