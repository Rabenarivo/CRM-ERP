package com.example.CRMERP.controller;

import com.example.CRMERP.entity.Offre;
import com.example.CRMERP.service.OffreService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/offres")
@CrossOrigin
public class OffreController {

    private final OffreService offreService;

    public OffreController(OffreService offreService) {
        this.offreService = offreService;
    }

    @PostMapping
    public Offre creerOffre(
            @RequestParam Long demandeId,
            @RequestParam Long fournisseurId,
            @RequestBody Offre offre
    ) {
        return offreService.creerOffre(demandeId, fournisseurId, offre);
    }


    @GetMapping("/demande/{demandeId}")
    public List<Offre> getOffresByDemande(@PathVariable Long demandeId) {
        return offreService.getOffresByDemande(demandeId);
    }

}