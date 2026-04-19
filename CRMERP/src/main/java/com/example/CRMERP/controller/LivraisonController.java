package com.example.CRMERP.controller;

import com.example.CRMERP.service.LivraisonService;
import com.example.CRMERP.entity.Livraison;
import com.example.CRMERP.entity.Produit;
import com.example.CRMERP.entity.StockMovement;
import com.example.CRMERP.entity.BonCommande;
import com.example.CRMERP.entity.Commande;
import com.example.CRMERP.entity.Proforma;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.entity.WorkflowLog;
import com.example.CRMERP.repository.BonCommandeRepository;
import com.example.CRMERP.repository.CommandeRepository;
import com.example.CRMERP.repository.LivraisonRepository;
import com.example.CRMERP.repository.ProduitRepository;
import com.example.CRMERP.repository.ProformaRepository;
import com.example.CRMERP.repository.UserRepository;
import com.example.CRMERP.service.StockMouvementService;
import com.example.CRMERP.service.WorkflowLogService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;



@RestController
@RequestMapping("/api/livraisons")
public class LivraisonController {
    private final LivraisonService livraisonService;
    private final WorkflowLogService workflowLogService;
    private final CommandeRepository commandeRepository;
    private final ProformaRepository proformaRepository;
    private final BonCommandeRepository bonCommandeRepository;
    private final LivraisonRepository livraisonRepository;
    private final ProduitRepository produitRepository;
    private final UserRepository userRepository;
    private final StockMouvementService stockMouvementService;

    public LivraisonController(LivraisonService livraisonService,
        WorkflowLogService workflowLogService,
        CommandeRepository commandeRepository,
        ProformaRepository proformaRepository,
        BonCommandeRepository bonCommandeRepository,
        LivraisonRepository livraisonRepository,
        ProduitRepository produitRepository,
        UserRepository userRepository,
        StockMouvementService stockMouvementService) 
        {
        this.livraisonService = livraisonService;
        this.workflowLogService = workflowLogService;
        this.commandeRepository = commandeRepository;
        this.proformaRepository = proformaRepository;
        this.bonCommandeRepository = bonCommandeRepository;
        this.livraisonRepository = livraisonRepository;
        this.produitRepository = produitRepository;
        this.userRepository = userRepository;
        this.stockMouvementService = stockMouvementService;
        }

        @GetMapping("/entreprise")
        public ResponseEntity<?> getEntrepriseLivraisons(@RequestParam("userId") Long connectedUserId) {
            User user = userRepository.findById(connectedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur connecté introuvable: " + connectedUserId));

            if (user.getEntreprise() == null) {
                throw new IllegalArgumentException("Utilisateur non lié à une entreprise.");
            }

            List<Livraison> livraisons = livraisonRepository
                .findByEntrepriseIdOrderByDateCreationDesc(user.getEntreprise().getId());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "enterprise", user.getEntreprise(),
                "data", livraisons
            ));
        }

        @PostMapping("/save_livraison")
        public ResponseEntity<?> save(@RequestBody Map<String, Object> request) {
            Object commandeIdObj = request.get("idCommande");
            Object proformaIdObj = request.get("idProforma");
            Object userIdObj = request.get("userId");
            String reference = (String) request.get("reference");
            String date_livraison = (String) request.get("date_livraison");
            String commentaire = (String) request.get("commentaire");

            if (commandeIdObj == null && proformaIdObj == null) {
                throw new IllegalArgumentException("idCommande ou idProforma est obligatoire.");
            }

            if (userIdObj == null) {
                throw new IllegalArgumentException("userId est obligatoire.");
            }

            Long connectedUserId = Long.parseLong(userIdObj.toString());

            User user = userRepository.findById(connectedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur connecté introuvable: " + connectedUserId));

            if (user.getEntreprise() == null) {
                throw new IllegalArgumentException("Utilisateur non lié à une entreprise.");
            }

            Commande commande;
            Proforma linkedProforma = null;

            if (commandeIdObj != null) {
                Long commandeId = Long.parseLong(commandeIdObj.toString());
                commande = commandeRepository.findById(commandeId)
                    .orElseThrow(() -> new IllegalArgumentException("Commande introuvable: " + commandeId));
            } else {
                Long proformaId = Long.parseLong(proformaIdObj.toString());
                Proforma proforma = proformaRepository.findById(proformaId)
                    .orElseThrow(() -> new IllegalArgumentException("Proforma introuvable: " + proformaId));
                linkedProforma = proforma;

                if (!"ACCEPTEE".equalsIgnoreCase(String.valueOf(proforma.getStatut()))) {
                    throw new IllegalArgumentException("La proforma doit être ACCEPTEE.");
                }

                BonCommande bonCommande = bonCommandeRepository
                    .findFirstByProformaIdOrderByDateDesc(proformaId)
                    .orElseThrow(() -> new IllegalArgumentException("Pas de bon de commande pour cette proforma."));

                commande = new Commande();
                commande.setClient(user.getEntreprise());
                commande.setMontantTotal(proforma.getPrix());
                commande.setDepartment(user.getDepartment());
                commande = commandeRepository.save(commande);

                if (reference == null || reference.isBlank()) {
                    reference = "LIV-BC-" + bonCommande.getId() + "-" + proformaId;
                }
            }

            if (commande.getClient() == null) {
                throw new IllegalArgumentException("Commande sans entreprise cliente.");
            }

            if (!commande.getClient().getId().equals(user.getEntreprise().getId())) {
                throw new IllegalArgumentException("Cette commande appartient à une autre entreprise.");
            }


            Livraison livraison = new Livraison();
            livraison.setCommande(commande);
            livraison.setProforma(linkedProforma);
            livraison.setReference(reference);
            livraison.setStatut("EN_COURS"); 
            livraison.setDateLivraison(LocalDateTime.parse(date_livraison));
            livraison.setCommentaire(commentaire);
            livraison.setUser(user);
            livraison.setEntreprise(commande.getClient());

            Livraison saved = livraisonService.save(livraison);

            WorkflowLog workflowLog = new WorkflowLog();
            workflowLog.setUser(user);
            workflowLog.setDepartment(user.getDepartment());
            workflowLog.setAction("LIVRAISON_CREEE");
            workflowLog.setCommentaire("Livraison créée avec statut EN_COURS - Ref: " + reference);
            workflowLogService.save(workflowLog);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Livraison créée avec succès",
                "data", saved,
                "produit", linkedProforma != null && linkedProforma.getDemande() != null ? linkedProforma.getDemande().getProduit() : null,
                "quantite", linkedProforma != null && linkedProforma.getDemande() != null ? linkedProforma.getDemande().getQuantite() : null,
                "statut", "EN_COURS"
            ));
        }

        @PatchMapping("/{id}/assign")
        public ResponseEntity<?> assign(@PathVariable Long id, @RequestBody Map<String, Object> request) {
            Object userIdObj = request.get("userId");
            if (userIdObj == null) {
                throw new IllegalArgumentException("userId est obligatoire.");
            }
            Long connectedUserId = Long.parseLong(userIdObj.toString());

            Livraison livraison = livraisonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Livraison introuvable: " + id));

            User user = userRepository.findById(connectedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur connecté introuvable: " + connectedUserId));

            if (user.getEntreprise() == null) {
                throw new IllegalArgumentException("Utilisateur non lié à une entreprise.");
            }

            if (livraison.getEntreprise() == null || !livraison.getEntreprise().getId().equals(user.getEntreprise().getId())) {
                throw new IllegalArgumentException("Cette livraison appartient à une autre entreprise.");
            }

            livraison.setUser(user);
            livraison.setStatut("PRETE");
            Livraison saved = livraisonRepository.save(livraison);

            WorkflowLog workflowLog = new WorkflowLog();
            workflowLog.setUser(user);
            workflowLog.setDepartment(user.getDepartment());
            workflowLog.setAction("LIVRAISON_ASSIGNEE");
            workflowLog.setCommentaire("Livraison assignée à l'entreprise et marquée PRETE: " + saved.getReference());
            workflowLogService.save(workflowLog);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Livraison assignée avec succès",
                "data", saved
            ));
        }

        @PatchMapping("/{id}/livree")
        public ResponseEntity<?> markLivree(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> request
        ) {
            if (request == null || request.get("userId") == null) {
                throw new IllegalArgumentException("userId est obligatoire.");
            }

            Object userIdObj = request.get("userId");
            if (userIdObj == null) {
                throw new IllegalArgumentException("userId est obligatoire.");
            }
            Long connectedUserId = Long.parseLong(userIdObj.toString());

            Livraison livraison = livraisonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Livraison introuvable: " + id));

            User user = userRepository.findById(connectedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur connecté introuvable: " + connectedUserId));

            if (user.getEntreprise() == null) {
                throw new IllegalArgumentException("Utilisateur non lié à une entreprise.");
            }

            if (livraison.getEntreprise() == null || !livraison.getEntreprise().getId().equals(user.getEntreprise().getId())) {
                throw new IllegalArgumentException("Cette livraison appartient à une autre entreprise.");
            }

            String produitNom = null;
            Integer quantiteEntree = null;

            if (livraison.getProforma() != null && livraison.getProforma().getDemande() != null) {
                produitNom = livraison.getProforma().getDemande().getProduit();
                quantiteEntree = livraison.getProforma().getDemande().getQuantite();
            }

            Double prixProduit = request != null && request.get("prix") != null
                ? Double.parseDouble(String.valueOf(request.get("prix")))
                : null;
            Integer stockMin = request != null && request.get("stockMin") != null
                ? Integer.parseInt(String.valueOf(request.get("stockMin")))
                : 0;

            if (produitNom == null || produitNom.isBlank()) {
                throw new IllegalArgumentException("Produit introuvable sur la livraison: impossible d'entrer en stock automatiquement.");
            }

            if (quantiteEntree == null || quantiteEntree <= 0) {
                throw new IllegalArgumentException("Quantite introuvable sur la livraison: impossible d'entrer en stock automatiquement.");
            }

            final String produitRecherche = produitNom;
            final double prixDerive = (livraison.getProforma() != null && quantiteEntree != null && quantiteEntree > 0)
                ? livraison.getProforma().getPrix() / quantiteEntree
                : 0d;

            Produit produit = produitRepository
                .searchByName(produitRecherche)
                .stream()
                .filter(p -> p.getNom() != null && p.getNom().trim().equalsIgnoreCase(produitRecherche))
                .findFirst()
                .orElse(null);

            if (produit == null) {
                produit = new Produit();
                produit.setNom(produitNom);
                produit.setPrix(prixProduit != null ? prixProduit : prixDerive);
                produit.setStock(0);
                produit.setStockDisponible(0);
                produit.setStockReserve(0);
                produit.setStockMin(stockMin != null ? stockMin : 0);
                produit.setDepartment(user.getDepartment());
            } else {
                if (prixProduit != null && prixProduit >= 0) {
                    produit.setPrix(prixProduit);
                } else if ((produit.getPrix() == null || produit.getPrix() <= 0) && prixDerive > 0) {
                    produit.setPrix(prixDerive);
                }
            }

            int actuel = produit.getStockDisponible() == null ? 0 : produit.getStockDisponible();
            int nouveauStock = actuel + quantiteEntree;
            produit.setStockDisponible(nouveauStock);
            produit.setStock(nouveauStock);
            Produit savedProduit = produitRepository.save(produit);

            StockMovement movement = new StockMovement();
            movement.setProduit(savedProduit);
            movement.setType("ENTREE_LIVRAISON");
            movement.setQuantite(quantiteEntree);
            movement.setUser(user);
            movement.setCommentaire("ENTREE de " + quantiteEntree + " pour livraison " + (livraison.getReference() != null ? livraison.getReference() : livraison.getId()));
            stockMouvementService.save(movement);

            livraison.setStatut("LIVREE");
            Livraison saved = livraisonRepository.save(livraison);

            WorkflowLog workflowLog = new WorkflowLog();
            workflowLog.setUser(user);
            workflowLog.setDepartment(user.getDepartment());
            workflowLog.setAction("LIVRAISON_LIVREE");
            workflowLog.setCommentaire("Livraison marquée livree: " + saved.getReference());
            workflowLogService.save(workflowLog);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Livraison marquée LIVREE",
                "data", saved,
                "produit", savedProduit,
                "quantiteEntree", quantiteEntree
            ));
        }
        

}
