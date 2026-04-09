package com.example.CRMERP.service;

import com.example.CRMERP.entity.StockMovement;
import com.example.CRMERP.repository.StockMouvementRepository;
import org.springframework.stereotype.Service;

@Service
public class StockMouvementService {
    private final StockMouvementRepository repo;

    public StockMouvementService(StockMouvementRepository repo) {
        this.repo = repo;
    }

    public StockMovement save(StockMovement sm) {
        return repo.save(sm);
    }
}
