package com.example.CRMERP.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.CRMERP.entity.BonCommande;
import com.example.CRMERP.service.BonCommandeService;

@RestController
@RequestMapping("/api/bon-commandes")
public class BonCommandeController {

    private final BonCommandeService bonCommandeService;

    public BonCommandeController(BonCommandeService bonCommandeService) {
        this.bonCommandeService = bonCommandeService;
    }

    @GetMapping
    public List<BonCommande> getAll() {
        return bonCommandeService.findAll();
    }
}
