package com.example.CRMERP.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.CRMERP.entity.Offre;

public interface OffresRepository extends JpaRepository<Offre,Long> {
    List<Offre> findByDemandeId(Long demandeId);

//     @Query 
//     ("""
//             SELECT 
//     o.id,
//     o.demande_id,
//     o.fournisseur_id,
//     o.reference,
//     o.delai_livraison,
//     o.validite,
//     o.description,
//     o.statut,
//     o.date_creation
// FROM offres o
// WHERE NOT EXISTS (
//     SELECT 1
//     FROM proformas p
//     WHERE p.demande_id = o.demande_id
//       AND p.fournisseur_id = o.fournisseur_id);
//             """)
//         List<Offre> getAllOffre();


    @Query("""
        SELECT o
        FROM Offre o
        WHERE NOT EXISTS (
        SELECT 1
        FROM Proforma p
        WHERE p.demande = o.demande
        AND p.fournisseur = o.fournisseur
        )
        """)
        List<Offre> getAllOffres();
}
