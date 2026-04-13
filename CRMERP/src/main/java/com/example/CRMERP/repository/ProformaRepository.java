package com.example.CRMERP.repository;

import com.example.CRMERP.entity.Proforma;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProformaRepository extends JpaRepository<Proforma, Long> {
    List<Proforma> findByStatut(String statut);
    
}
