package com.example.CRMERP.service;
import com.example.CRMERP.entity.Proforma;
import com.example.CRMERP.repository.ProformaRepository;
import com.example.CRMERP.entity.Fournisseur;
import com.example.CRMERP.repository.FournisseurRepository;

import java.util.List;

import org.springframework.stereotype.Service;


@Service
public class ProformaService {
    private final ProformaRepository proformaRepository;
    private final FournisseurRepository fournisseurRepository;

    public ProformaService(ProformaRepository proformaRepository, FournisseurRepository fournisseurRepository) {
        this.proformaRepository = proformaRepository;
        this.fournisseurRepository = fournisseurRepository;
    }

    public List<Proforma> findAll () {
        return proformaRepository.findAll();
    }

    public Proforma save (Proforma p ) {
        return proformaRepository.save(p);
    }

    
}
