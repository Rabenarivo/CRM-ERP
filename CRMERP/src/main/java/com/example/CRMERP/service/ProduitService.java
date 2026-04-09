package com.example.CRMERP.service;

import com.example.CRMERP.entity.Produit;
import com.example.CRMERP.repository.ProduitRepository;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class ProduitService {
    private final ProduitRepository repo;

    public ProduitService(ProduitRepository repo) {
        this.repo = repo;
    }

    public Produit save(Produit p) {
        return repo.save(p);
    }

    public List<Produit> findAllProduit() {
        return repo.findAll();
    }

    
}
