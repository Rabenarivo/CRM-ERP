package com.example.CRMERP.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

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
    @JsonIgnoreProperties({"proformas"})
    private Fournisseur fournisseur;

    @OneToMany(mappedBy = "proforma")
    @JsonIgnore
    private List<Livraison> livraisons;
}