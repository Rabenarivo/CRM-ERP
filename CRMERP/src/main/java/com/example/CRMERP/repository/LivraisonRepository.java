package com.example.CRMERP.repository;

import com.example.CRMERP.entity.Livraison;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LivraisonRepository extends JpaRepository<Livraison, Long> {
}
