package com.example.CRMERP.service;

import com.example.CRMERP.repository.PaiementRepository;
import org.springframework.stereotype.Service;

@Service
public class PaiementService {
    private final PaiementRepository paiementRepository;

    public PaiementService(PaiementRepository paiementRepository) {
        this.paiementRepository = paiementRepository;
    }
}
