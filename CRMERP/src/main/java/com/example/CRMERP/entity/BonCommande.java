package com.example.CRMERP.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bon_commandes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BonCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime date;

    private String statut;

    @ManyToOne
    @JoinColumn(name = "proforma_id")
    private Proforma proforma;
}