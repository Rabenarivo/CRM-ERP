package com.example.CRMERP.service;

import com.example.CRMERP.entity.BonCommande;
import com.example.CRMERP.entity.Proforma;
import com.example.CRMERP.repository.BonCommandeRepository;
import com.example.CRMERP.repository.ProformaRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BonCommandeService {

    private final BonCommandeRepository bonCommandeRepository;
    private final ProformaRepository proformaRepository;


    public BonCommandeService(BonCommandeRepository bonCommandeRepository,
                              ProformaRepository proformaRepository) {
        this.bonCommandeRepository = bonCommandeRepository;
        this.proformaRepository = proformaRepository;
    }

    
}