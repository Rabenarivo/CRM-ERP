package com.example.CRMERP.repository;

import com.example.CRMERP.entity.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {
}
