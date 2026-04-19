package com.example.CRMERP.controller;

import com.example.CRMERP.entity.Facture;
import com.example.CRMERP.entity.Livraison;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.service.FactureService;
import com.example.CRMERP.repository.FactureRepository;
import com.example.CRMERP.repository.LivraisonRepository;
import com.example.CRMERP.repository.UserRepository;
import com.example.CRMERP.entity.WorkflowLog;
import com.example.CRMERP.service.WorkflowLogService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/factures")
public class FactureController {
    private final FactureService factureService;
    private final FactureRepository factureRepository;
    private final LivraisonRepository livraisonRepository;
    private final UserRepository userRepository;
    private final WorkflowLogService workflowLogService;

    public FactureController(
        FactureService factureService,
        FactureRepository factureRepository,
        LivraisonRepository livraisonRepository,
        UserRepository userRepository,
        WorkflowLogService workflowLogService
    ) {
        this.factureService = factureService;
        this.factureRepository = factureRepository;
        this.livraisonRepository = livraisonRepository;
        this.userRepository = userRepository;
        this.workflowLogService = workflowLogService;
    }

    @GetMapping("/entreprise")
    public ResponseEntity<?> getEntrepriseFactures(@RequestParam("userId") Long connectedUserId) {
        User user = userRepository.findById(connectedUserId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur connecté introuvable: " + connectedUserId));

        if (user.getEntreprise() == null) {
            throw new IllegalArgumentException("Utilisateur non lié à une entreprise.");
        }

        List<Facture> factures = factureRepository.findByClientIdOrderByDateFactureDesc(user.getEntreprise().getId());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", factures
        ));
    }

    @GetMapping( "/all")
    public ResponseEntity<?> getAllFactures() {
        return ResponseEntity.ok(factureService.findAll());
    }

    @PostMapping("/from-livraison")
    public ResponseEntity<?> createFromLivraison(
        @RequestBody Map<String, Object> request
    ) {
        Long livraisonId = Long.parseLong(request.get("livraisonId").toString());
        Object userIdObj = request.get("userId");
        if (userIdObj == null) {
            throw new IllegalArgumentException("userId est obligatoire.");
        }
        Long connectedUserId = Long.parseLong(userIdObj.toString());
        String reference = request.get("reference") != null ? request.get("reference").toString() : null;
        String echeance = request.get("dateEcheance") != null ? request.get("dateEcheance").toString() : null;

        User user = userRepository.findById(connectedUserId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur connecté introuvable: " + connectedUserId));

        Livraison livraison = livraisonRepository.findById(livraisonId)
            .orElseThrow(() -> new IllegalArgumentException("Livraison introuvable: " + livraisonId));

        if (user.getEntreprise() == null || livraison.getEntreprise() == null) {
            throw new IllegalArgumentException("Entreprise manquante pour la livraison ou l'utilisateur.");
        }

        if (!user.getEntreprise().getId().equals(livraison.getEntreprise().getId())) {
            throw new IllegalArgumentException("Cette livraison appartient à une autre entreprise.");
        }

        if (!"LIVREE".equalsIgnoreCase(String.valueOf(livraison.getStatut()))) {
            throw new IllegalArgumentException("La livraison doit être marquée LIVREE avant la création de facture.");
        }

        Facture facture = new Facture();
        facture.setLivraison(livraison);
        facture.setClient(livraison.getEntreprise());
        facture.setReference(reference != null && !reference.isBlank() ? reference : "FAC-LIV-" + livraison.getId());
        facture.setStatut("EMISE");
        facture.setMontantHt(livraison.getCommande() != null && livraison.getCommande().getMontantTotal() != null ? livraison.getCommande().getMontantTotal() : 0d);
        facture.setTva(0d);
        facture.setMontantTtc(facture.getMontantHt());
        facture.setDateEcheance(echeance != null && !echeance.isBlank() ? LocalDate.parse(echeance) : null);
        facture.setDepartment(user.getDepartment());

        Facture saved = factureService.save(facture);

        WorkflowLog workflowLog = new WorkflowLog();
        workflowLog.setUser(user);
        workflowLog.setDepartment(user.getDepartment());
        workflowLog.setAction("FACTURE_CREEE");
        workflowLog.setCommentaire("Facture creee depuis livraison: " + livraison.getReference());
        workflowLogService.save(workflowLog);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Facture créée avec succès",
            "data", saved
        ));
    }
}
