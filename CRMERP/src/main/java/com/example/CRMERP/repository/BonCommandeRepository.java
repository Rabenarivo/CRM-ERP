package com.example.CRMERP.repository;

import com.example.CRMERP.entity.BonCommande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BonCommandeRepository extends JpaRepository<BonCommande, Long> {
	Optional<BonCommande> findFirstByProformaIdOrderByDateDesc(Long proformaId);

}