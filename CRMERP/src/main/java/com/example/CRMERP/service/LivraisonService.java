package com.example.CRMERP.service;

import com.example.CRMERP.repository.LivraisonRepository;
import com.example.CRMERP.repository.ProformaRepository;
import com.example.CRMERP.entity.Livraison;
import com.example.CRMERP.entity.Proforma;
import org.springframework.stereotype.Service;

@Service
public class LivraisonService {
    private final LivraisonRepository livraisonRepository;
    private final ProformaRepository proformaRepository;


    public LivraisonService(LivraisonRepository livraisonRepository, ProformaRepository proformaRepository) {
        this.livraisonRepository = livraisonRepository;
        this.proformaRepository = proformaRepository;
    }

    public Livraison save (Livraison l){
        return livraisonRepository.save(l);
    }


    
}
