package com.example.CRMERP.controller;

import com.example.CRMERP.entity.Produit;
import com.example.CRMERP.service.ProduitService;
import  com.example.CRMERP.service.DemandeAchatService;

import  com.example.CRMERP.repository.ProduitRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;



@RestController
@RequestMapping("/api/produits")
public class ProduitController {
    private final ProduitRepository produitRepository;
    private final  ProduitService service;
    private final DemandeAchatService demandeAchatService;

    public ProduitController(ProduitService service, DemandeAchatService demandeAchatService, ProduitRepository produitRepository) {
        this.service = service;
        this.demandeAchatService = demandeAchatService;
        this.produitRepository = produitRepository;
    }

    @GetMapping("/demandes")
    public String getDemandes() {
        return demandeAchatService.findAll().toString();
    }

    @GetMapping("/filtre")
    public String getByNom(@RequestParam String param) {
        return produitRepository.searchByName(param).toString();
    }
    


    
}
