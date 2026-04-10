package com.example.CRMERP.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "fournisseurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Fournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;

    private String contact;

    // Relation avec Proforma
    @OneToMany(mappedBy = "fournisseur")
    private List<Proforma> proformas;
}