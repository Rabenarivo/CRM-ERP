package com.example.CRMERP.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.CRMERP.entity.Proforma;
import com.example.CRMERP.entity.WorkflowLog;
import com.example.CRMERP.repository.FournisseurRepository;
import com.example.CRMERP.service.DemandeAchatService;
import com.example.CRMERP.service.ProformaService;
import com.example.CRMERP.service.WorkflowLogService;
import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/proforma")
public class ProformatController {

    private final ProformaService proformaService;
    private final FournisseurRepository fournisseurRepository;
    private final DemandeAchatService demandeAchatService;
    private final WorkflowLogService workflowLogService;

    public ProformatController(
            ProformaService proformaService,
            FournisseurRepository fournisseurRepository,
            DemandeAchatService demandeAchatService,
            WorkflowLogService workflowLogService
    ) {
        this.proformaService = proformaService;
        this.fournisseurRepository = fournisseurRepository;
        this.demandeAchatService = demandeAchatService;
        this.workflowLogService = workflowLogService;
    }

    @PostMapping("/save-proforma")
    @Transactional
    public ResponseEntity<?> save(@RequestBody Map<String, Object> request) {
        Object demandeIdObj = request.get("idDemande");
        Object fournisseurIdObj = request.get("idFournisseur");
        Object prixObj = request.get("prix");
        Object delaiObj = request.get("delai");
        Object statutObj = request.get("statut");

        if (demandeIdObj == null || fournisseurIdObj == null || prixObj == null || delaiObj == null) {
            throw new IllegalArgumentException("idDemande, idFournisseur, prix et delai sont obligatoires.");
        }

        Long demandeId = Long.valueOf(demandeIdObj.toString());
        Long fournisseurId = Long.valueOf(fournisseurIdObj.toString());
        Double prix = Double.valueOf(prixObj.toString());
        Integer delai = Integer.valueOf(delaiObj.toString());

        var demande = demandeAchatService.findById(demandeId);
        if (demande == null) {
            throw new IllegalArgumentException("Demande introuvable: " + demandeId);
        }

        var fournisseur = fournisseurRepository.findById(fournisseurId).orElse(null);
        if (fournisseur == null) {
            throw new IllegalArgumentException("Fournisseur introuvable: " + fournisseurId);
        }

        Proforma p = new Proforma();
        p.setDemande(demande);
        p.setFournisseur(fournisseur);
        p.setPrix(prix);
        p.setDelai(delai);
        if (statutObj != null) {
            p.setStatut(statutObj.toString());
        }

        Proforma savedProforma = proformaService.save(p);

        WorkflowLog log = new WorkflowLog();
        log.setDemande(demande);
        log.setUser(demande.getUser());
        log.setDepartment(demande.getDepartment());
        log.setAction("CREATION_PROFORMA");
        log.setCommentaire("Proforma creee, id=" + savedProforma.getId());

        workflowLogService.save(log);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Proforma creee avec workflow");
        response.put("proforma", savedProforma);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    public List<Proforma> list() {
        return proformaService.getEnAttenteValidation();
    }

    @GetMapping("/all")
    public List<Proforma> all() {
        return proformaService.findAll();
    }

    @GetMapping("/accepte")
    public List<Proforma> getvalide() {
        return proformaService.getAccepteList();
    }

    
    

    @PostMapping("/save-bc")
    @Transactional
    public ResponseEntity<?> saveBc(@RequestBody Map<String, Object> request) {
        Object proformaIdObj = request.get("proformaId");
        Object statutObj = request.get("statut");

        if (proformaIdObj == null || statutObj == null) {
            throw new IllegalArgumentException("proformaId et statut sont obligatoires.");
        }

        Long proformaId = Long.valueOf(proformaIdObj.toString());
        String statut = statutObj.toString();

        var bonCommande = proformaService.saveBonCommandeFromProforma(proformaId, statut);

        Map<String, Object> response = new HashMap<>();
        if (bonCommande == null) {
            response.put("message", "Proforma refusee. Aucun BC cree.");
            response.put("bonCommande", null);
        } else {
            response.put("message", "Proforma acceptee. BC cree et envoye.");
            response.put("bonCommande", bonCommande);
        }

        return ResponseEntity.ok(response);
    }

    
    
}