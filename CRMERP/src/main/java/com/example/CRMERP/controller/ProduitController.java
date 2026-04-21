package com.example.CRMERP.controller;

import com.example.CRMERP.entity.Department;
import com.example.CRMERP.entity.Produit;
import com.example.CRMERP.entity.StockMovement;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.repository.ProduitRepository;
import com.example.CRMERP.service.DemandeAchatService;
import com.example.CRMERP.service.DepartmentService;
import com.example.CRMERP.service.ProduitService;
import com.example.CRMERP.service.StockMouvementService;
import com.example.CRMERP.service.UserService;

import jakarta.transaction.Transactional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/produits")
public class ProduitController {
    private final ProduitRepository produitRepository;
    private final ProduitService service;
    private final DemandeAchatService demandeAchatService;
    private final DepartmentService departmentService;
    private final UserService userService;
    private final StockMouvementService stockMouvementService;

    public ProduitController(
            ProduitService service,
            DemandeAchatService demandeAchatService,
            ProduitRepository produitRepository,
            DepartmentService departmentService,
            UserService userService,
            StockMouvementService stockMouvementService
    ) {
        this.service = service;
        this.demandeAchatService = demandeAchatService;
        this.produitRepository = produitRepository;
        this.departmentService = departmentService;
        this.userService = userService;
        this.stockMouvementService = stockMouvementService;
    }

    @GetMapping("/demandes")
    public String getDemandes() {
        return demandeAchatService.findAll().toString();
    }

    @GetMapping("/filtre")
    public List<Produit> getByNom(@RequestParam String param) {
        return searchProduitsByAnyWord(param);
    }

    @GetMapping("/filtres")
    public List<Produit> getByNomPlural(@RequestParam String param) {
        return searchProduitsByAnyWord(param);
    }

    private List<Produit> searchProduitsByAnyWord(String param) {
        String normalizedParam = param == null ? "" : param.trim();
        if (normalizedParam.isEmpty()) {
            return List.of();
        }

        // Keep insertion order and remove duplicates by product id.
        Map<Long, Produit> uniqueById = new LinkedHashMap<>();

        String[] tokens = normalizedParam.split("\\s+");
        for (String token : tokens) {
            String word = token.trim();
            if (word.isEmpty()) {
                continue;
            }

            List<Produit> matches = produitRepository.searchByName(word);
            for (Produit produit : matches) {
                uniqueById.put(produit.getId(), produit);
            }
        }

        return List.copyOf(uniqueById.values());
    }

    @GetMapping("/list")
    public List<Produit> listProduits() {
        return service.findAllProduit();
    }

    @PutMapping("/{produitId}/department")
    public ResponseEntity<?> assignDepartment(
            @PathVariable Long produitId,
            @RequestBody Map<String, Object> request
    ) {
        Produit produit = produitRepository.findById(produitId).orElse(null);
        if (produit == null) {
            throw new IllegalArgumentException("Produit not found");
        }

        Object departmentIdRaw = request.get("departmentId");
        Department department = null;

        if (departmentIdRaw != null && !departmentIdRaw.toString().isBlank()) {
            Long departmentId = Long.valueOf(departmentIdRaw.toString());
            department = departmentService.findById(departmentId);
            if (department == null) {
                throw new IllegalArgumentException("Department not found");
            }
        }

        produit.setDepartment(department);
        Produit updated = service.save(produit);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{produitId}/transfer")
    @Transactional
    public ResponseEntity<?> transferProduit(
            @PathVariable Long produitId,
            @RequestBody Map<String, Object> request
    ) {
        Object departmentIdRaw = request.get("departmentId");
        Object quantiteRaw = request.get("quantite");

        if (departmentIdRaw == null || quantiteRaw == null) {
            throw new IllegalArgumentException("departmentId et quantite sont requis");
        }

        Long targetDepartmentId = Long.valueOf(departmentIdRaw.toString());
        int quantite = Integer.parseInt(quantiteRaw.toString());

        if (quantite <= 0) {
            throw new IllegalArgumentException("quantite doit etre > 0");
        }

        Produit sourceProduit = produitRepository.findById(produitId).orElse(null);
        if (sourceProduit == null) {
            throw new IllegalArgumentException("Produit not found");
        }

        if (sourceProduit.getDepartment() != null) {
            throw new IllegalArgumentException("Transfert autorise uniquement depuis le stock central (department_id null)");
        }

        Produit principalProduit = produitRepository
                .findFirstByNomIgnoreCaseAndDepartmentIsNullOrderByIdAsc(sourceProduit.getNom())
                .orElse(sourceProduit);

        if (!principalProduit.getId().equals(sourceProduit.getId())) {
            throw new IllegalArgumentException(
                    "Transfert autorise uniquement depuis le stock principal (ID "
                            + principalProduit.getId() + ")"
            );
        }

        Department targetDepartment = departmentService.findById(targetDepartmentId);
        if (targetDepartment == null) {
            throw new IllegalArgumentException("Department not found");
        }

        Long sourceDepartmentId = principalProduit.getDepartment() != null
            ? principalProduit.getDepartment().getId()
                : null;
        if (sourceDepartmentId != null && sourceDepartmentId.equals(targetDepartmentId)) {
            throw new IllegalArgumentException("Le departement source et cible sont identiques");
        }

        int sourceStockDisponible = principalProduit.getStockDisponible() == null
                ? 0
            : principalProduit.getStockDisponible();
        if (sourceStockDisponible < quantite) {
            throw new IllegalArgumentException("Stock insuffisant pour le transfert");
        }

        principalProduit.setStockDisponible(sourceStockDisponible - quantite);
        int sourceStock = principalProduit.getStock() == null ? 0 : principalProduit.getStock();
        principalProduit.setStock(Math.max(0, sourceStock - quantite));
        Produit savedSource = service.save(principalProduit);

        Produit targetProduit = produitRepository
            .findByNomIgnoreCaseAndDepartment_Id(principalProduit.getNom(), targetDepartmentId)
                .orElseGet(() -> {
                    Produit created = new Produit();
                created.setNom(principalProduit.getNom());
                created.setPrix(principalProduit.getPrix());
                    created.setStock(0);
                    created.setStockDisponible(0);
                    created.setStockReserve(0);
                created.setStockMin(principalProduit.getStockMin() == null ? 0 : principalProduit.getStockMin());
                    created.setDepartment(targetDepartment);
                    return created;
                });

        int targetStockDisponible = targetProduit.getStockDisponible() == null
                ? 0
                : targetProduit.getStockDisponible();
        int targetStock = targetProduit.getStock() == null ? 0 : targetProduit.getStock();

        targetProduit.setStockDisponible(targetStockDisponible + quantite);
        targetProduit.setStock(targetStock + quantite);
        Produit savedTarget = service.save(targetProduit);

        Map<String, Object> response = new HashMap<>();
        response.put("quantite", quantite);
        response.put("sourceProduit", savedSource);
        response.put("targetProduit", savedTarget);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> request) {
        Object nomRaw = request.get("nom");
        Object stockRaw = request.get("stock"); // compat ancien front
        Object stockDisponibleRaw = request.get("stockDisponible");
        Object stockMinRaw = request.get("stockMin");
        Object departmentIdRaw = request.get("departmentId"); // optionnel
        Object userIdRaw = request.get("userId");

        if (nomRaw == null || userIdRaw == null) {
            throw new IllegalArgumentException("nom et userId sont requis");
        }

        String nom = nomRaw.toString().trim();
        Long userId = Long.valueOf(userIdRaw.toString());

        int stockDisponible = 0;
        if (stockDisponibleRaw != null) {
            stockDisponible = Integer.parseInt(stockDisponibleRaw.toString());
        } else if (stockRaw != null) {
            stockDisponible = Integer.parseInt(stockRaw.toString()); // fallback compat
        }

        int stockMin = 0;
        if (stockMinRaw != null) {
            stockMin = Integer.parseInt(stockMinRaw.toString());
        }

        if (nom.isEmpty()) {
            throw new IllegalArgumentException("nom est requis");
        }
        if (stockDisponible < 0) {
            throw new IllegalArgumentException("stockDisponible doit etre >= 0");
        }
        if (stockMin < 0) {
            throw new IllegalArgumentException("stockMin doit etre >= 0");
        }

        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        Department department = null;
        if (departmentIdRaw != null && !departmentIdRaw.toString().isBlank()) {
            Long departmentId = Long.valueOf(departmentIdRaw.toString());
            department = departmentService.findById(departmentId);
            if (department == null) {
                throw new IllegalArgumentException("Department not found");
            }
        }

        Produit p = new Produit();
        p.setNom(nom);
        p.setStock(stockDisponible);
        p.setStockDisponible(stockDisponible);
        p.setStockReserve(0);
        p.setStockMin(stockMin);
        p.setDepartment(department); // null => stock central

        Produit savedProduit = service.save(p);

        Long movementId = null;
        if (stockDisponible > 0) {
            StockMovement movement = new StockMovement();
            movement.setProduit(savedProduit);
            movement.setType("ENTREE_ACHAT");
            movement.setQuantite(stockDisponible);
            movement.setUser(user);
            movement.setCommentaire("Stock initial de " + stockDisponible + " unites pour le produit " + nom);

            StockMovement savedMovement = stockMouvementService.save(movement);
            movementId = savedMovement.getId();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("produit", savedProduit);
        response.put("movementId", movementId);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/{produitId}/sortie")
    @Transactional
    public ResponseEntity<?> sortieProduit(
            @PathVariable Long produitId,
            @RequestBody Map<String, Object> request
    ) {
        Object quantiteRaw = request.get("quantite");
        Object userIdRaw = request.get("userId");
        Object commentaireRaw = request.get("commentaire");

        if (quantiteRaw == null || userIdRaw == null) {
            throw new IllegalArgumentException("quantite et userId sont requis");
        }

        int quantite = Integer.parseInt(quantiteRaw.toString());
        long userId = Long.parseLong(userIdRaw.toString());

        if (quantite <= 0) {
            throw new IllegalArgumentException("quantite doit etre > 0");
        }

        Produit produit = produitRepository.findById(produitId).orElse(null);
        if (produit == null) {
            throw new IllegalArgumentException("Produit not found");
        }

        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        int stockActuel = produit.getStockDisponible() == null ? 0 : produit.getStockDisponible();
        if (stockActuel < quantite) {
            throw new IllegalArgumentException("Stock insuffisant");
        }

        produit.setStockDisponible(stockActuel - quantite);
        produit.setStock(stockActuel - quantite);
        Produit savedProduit = service.save(produit);

        StockMovement movement = new StockMovement();
        movement.setProduit(savedProduit);
        movement.setType("SORTIE_VENTE");
        movement.setQuantite(quantite);
        movement.setUser(user);
        movement.setCommentaire(
                commentaireRaw != null && !commentaireRaw.toString().isBlank()
                        ? commentaireRaw.toString()
                        : "SORTIE de " + quantite + " unites pour le produit " + savedProduit.getNom()
        );

        StockMovement savedMovement = stockMouvementService.save(movement);

        Map<String, Object> response = new HashMap<>();
        response.put("produit", savedProduit);
        response.put("movementId", savedMovement.getId());

        return ResponseEntity.ok(response);
    }
}