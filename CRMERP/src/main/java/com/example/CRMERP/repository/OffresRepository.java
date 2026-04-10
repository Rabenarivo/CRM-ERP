package com.example.CRMERP.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.CRMERP.entity.Offre;

public interface OffresRepository extends JpaRepository<Offre,Long> {
    List<Offre> findByDemandeId(Long demandeId);
}
