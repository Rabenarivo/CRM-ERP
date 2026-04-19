package com.example.CRMERP.controller;



import com.example.CRMERP.entity.DemandeAchat;
import com.example.CRMERP.entity.Department;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.entity.WorkflowLog;
import com.example.CRMERP.service.DemandeAchatService;
import com.example.CRMERP.service.UserService;
import com.example.CRMERP.service.WorkflowLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demandes-achat")
public class DemandeAchatController {

    private final DemandeAchatService service;
    private final UserService userService;
    private final WorkflowLogService workflowLogService;
    
    public DemandeAchatController(
            DemandeAchatService service,
            UserService userService,
            WorkflowLogService workflowLogService
    ) {
        this.service = service;
        this.userService = userService;
        this.workflowLogService = workflowLogService;
    }

    @GetMapping
    public List<DemandeAchat> getAll() {
        return service.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> request) {
        Object userIdRaw = request.get("userId");
        if (userIdRaw == null) {
            throw new IllegalArgumentException("userId is required");
        }

        Long userId = Long.valueOf(userIdRaw.toString());
        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        Department department = user.getDepartment();

        List<Map<String, Object>> items = new ArrayList<>();
        Object itemsRaw = request.get("items");

        if (itemsRaw instanceof List<?> list && !list.isEmpty()) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> rawMap) {
                    Map<String, Object> mapped = new HashMap<>();
                    if (rawMap.get("produit") != null) {
                        mapped.put("produit", rawMap.get("produit"));
                    }
                    if (rawMap.get("quantite") != null) {
                        mapped.put("quantite", rawMap.get("quantite"));
                    }
                    items.add(mapped);
                }
            }
        }

        if (items.isEmpty()) {
            if (request.get("produit") == null || request.get("quantite") == null) {
                throw new IllegalArgumentException("produit et quantite sont requis");
            }

            Map<String, Object> singleItem = new HashMap<>();
            singleItem.put("produit", request.get("produit"));
            singleItem.put("quantite", request.get("quantite"));
            items.add(singleItem);
        }

        String batchReference = "DA-" + user.getId() + "-" + System.currentTimeMillis();

        List<Map<String, Object>> savedPayloads = new ArrayList<>();
        for (Map<String, Object> item : items) {
            String produit = String.valueOf(item.get("produit") == null ? "" : item.get("produit")).trim();
            Integer quantite = Integer.valueOf(String.valueOf(item.get("quantite") == null ? "0" : item.get("quantite")));

            if (produit.isBlank()) {
                throw new IllegalArgumentException("produit est requis pour chaque ligne");
            }

            if (quantite <= 0) {
                throw new IllegalArgumentException("quantite doit etre > 0 pour chaque ligne");
            }

            DemandeAchat demande = new DemandeAchat();
            demande.setProduit(produit);
            demande.setQuantite(quantite);
            demande.setBatchReference(batchReference);
            demande.setStatut("EN_COURS");
            demande.setUser(user);
            demande.setDepartment(department);

            DemandeAchat saved = service.save(demande);

            WorkflowLog workflowLog = new WorkflowLog();
            workflowLog.setDemande(saved);
            workflowLog.setUser(user);
            workflowLog.setDepartment(department);
            workflowLog.setAction("CREATION_DEMANDE");
            workflowLog.setCommentaire(
                "Creation demande_achat batch " + batchReference + " par " + user.getNom() +
                " du département " + (department != null ? department.getNom() : "N/A") +
                " avec le produit " + produit + " et la quantité " + quantite
            );
            workflowLogService.save(workflowLog);

            savedPayloads.add(toResponsePayload(saved, user, department));
        }

        if (savedPayloads.size() == 1) {
            return ResponseEntity.ok(savedPayloads.get(0));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("batchReference", batchReference);
        response.put("totalItems", savedPayloads.size());
        response.put("demandes", savedPayloads);
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> toResponsePayload(DemandeAchat saved, User user, Department department) {
        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("id", user.getId());
        userPayload.put("nom", user.getNom());

        Map<String, Object> departmentPayload = new HashMap<>();
        departmentPayload.put("id", department != null ? department.getId() : null);
        departmentPayload.put("nom", department != null ? department.getNom() : null);

        Map<String, Object> response = new HashMap<>();
        response.put("id", saved.getId());
        response.put("batchReference", saved.getBatchReference());
        response.put("produit", saved.getProduit());
        response.put("quantite", saved.getQuantite());
        response.put("statut", saved.getStatut());
        response.put("user", userPayload);
        response.put("department", departmentPayload);
        return response;
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<?> updateStatut(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Object statutRaw = request.get("statut");
        if (statutRaw == null) {
            throw new IllegalArgumentException("statut is required");
        }

        DemandeAchat demande = service.updateStatut(id, statutRaw.toString());
        if (demande == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", demande.getId());
        response.put("statut", demande.getStatut());

        return ResponseEntity.ok(response);
    }
    
    
}
