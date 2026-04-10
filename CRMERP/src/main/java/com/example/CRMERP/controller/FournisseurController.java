package com.example.CRMERP.controller;

import com.example.CRMERP.entity.Fournisseur;
import com.example.CRMERP.repository.FournisseurRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fournisseurs")
@CrossOrigin
public class FournisseurController {

    private final FournisseurRepository fournisseurRepository;

    public FournisseurController(FournisseurRepository fournisseurRepository) {
        this.fournisseurRepository = fournisseurRepository;
    }


    @GetMapping
    public List<Fournisseur> getAll() {
        return fournisseurRepository.findAll();
    }

    @GetMapping("/{id}")
    public Fournisseur getById(@PathVariable Long id) {
        return fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fournisseur introuvable"));
    }

}