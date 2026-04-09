package com.example.CRMERP.repository;

import com.example.CRMERP.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
public interface StockMouvementRepository extends JpaRepository<StockMovement, Long> {
    
}
