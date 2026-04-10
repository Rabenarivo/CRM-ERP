package com.example.CRMERP.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "proformas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Proforma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double prix;

    private Integer delai;

    private String statut;


    @ManyToOne
    @JoinColumn(name = "demande_id")
    private DemandeAchat demande;


    @ManyToOne
    @JoinColumn(name = "fournisseur_id")
    private Fournisseur fournisseur;
}