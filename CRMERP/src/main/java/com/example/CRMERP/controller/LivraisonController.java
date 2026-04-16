package com.example.CRMERP.controller;

import com.example.CRMERP.service.LivraisonService;
import com.example.CRMERP.entity.Livraison;
import com.example.CRMERP.entity.Commande;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.entity.Department;
import com.example.CRMERP.repository.CommandeRepository;
import com.example.CRMERP.repository.UserRepository;
import com.example.CRMERP.repository.DepartmentRepository;
import com.example.CRMERP.service.WorkflowLogService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController
@RequestMapping("/api/livraisons")
public class LivraisonController {
    private final LivraisonService livraisonService;
    private final WorkflowLogService workflowLogService;
    private final CommandeRepository commandeRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public LivraisonController(LivraisonService livraisonService,
        WorkflowLogService workflowLogService,
        CommandeRepository commandeRepository,
        UserRepository userRepository,
        DepartmentRepository departmentRepository) 
        {
        this.livraisonService = livraisonService;
        this.workflowLogService = workflowLogService;
        this.commandeRepository = commandeRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        }

        @PostMapping("/save_livraison")
        public ResponseEntity<?> save(@RequestBody Map<String, Object> request) {
            try {
                // Extract request parameters
                Long commandeId = Long.parseLong(request.get("idCommande").toString());
                String reference = (String) request.get("reference");
                String date_livraison = (String) request.get("date_livraison");
                String commentaire = (String) request.get("commentaire");
                Long userId = Long.parseLong(request.get("user_id").toString());
                Long departementId = Long.parseLong(request.get("departement_id").toString());

                // Get entities
                Commande commande = commandeRepository.findById(commandeId)
                    .orElseThrow(() -> new IllegalArgumentException("Commande introuvable: " + commandeId));

                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable: " + userId));

                Department department = departmentRepository.findById(departementId)
                    .orElseThrow(() -> new IllegalArgumentException("Département introuvable: " + departementId));

                // Create livraison with statut EN_COURS
                Livraison livraison = new Livraison();
                livraison.setCommande(commande);
                livraison.setReference(reference);
                livraison.setStatut("EN_COURS");  // Statut par défaut
                livraison.setDateLivraison(LocalDateTime.parse(date_livraison));
                livraison.setCommentaire(commentaire);
                livraison.setUser(user);
                livraison.setDepartment(department);

                // Save livraison
                Livraison saved = livraisonService.save(livraison);

                // Log workflow
                workflowLogService.logAction(userId, "LIVRAISON_CREEE", 
                    "Livraison créée avec statut EN_COURS - Ref: " + reference);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Livraison créée avec succès",
                    "data", saved,
                    "statut", "EN_COURS"
                ));
                
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
                ));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur serveur: " + e.getMessage()
                ));
            }
        }
        

}
