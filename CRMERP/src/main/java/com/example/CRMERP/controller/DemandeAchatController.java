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
        try {
            String produit = request.get("produit").toString();
            Integer quantite = Integer.valueOf(request.get("quantite").toString());

            Object userIdRaw = request.get("userId");
            if (userIdRaw == null) {
                return ResponseEntity.badRequest().body("userId is required");
            }

            Long userId = Long.valueOf(userIdRaw.toString());
            User user = userService.findById(userId);
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            Department department = user.getDepartment();

            DemandeAchat demande = new DemandeAchat();
            demande.setProduit(produit);
            demande.setQuantite(quantite);
            demande.setStatut("EN_COURS");
            demande.setUser(user);
            demande.setDepartment(department);

            DemandeAchat saved = service.save(demande);

            WorkflowLog workflowLog = new WorkflowLog();
            workflowLog.setDemande(saved);
            workflowLog.setUser(user);
            workflowLog.setDepartment(department);
            workflowLog.setAction("CREATION_DEMANDE");
            workflowLog.setCommentaire("Creation demande_achat créer par  "+user.getNom() + " du département " + (department != null ? department.getNom() : "N/A") + " avec le produit " + produit + " et la quantité " + quantite);
            workflowLogService.save(workflowLog);

            Map<String, Object> userPayload = new HashMap<>();
            userPayload.put("id", user.getId());
            userPayload.put("nom", user.getNom());

            Map<String, Object> departmentPayload = new HashMap<>();
            departmentPayload.put("id", department != null ? department.getId() : null);
            departmentPayload.put("nom", department != null ? department.getNom() : null);

            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("produit", saved.getProduit());
            response.put("quantite", saved.getQuantite());
            response.put("statut", saved.getStatut());
            response.put("user", userPayload);
            response.put("department", departmentPayload);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    
}
