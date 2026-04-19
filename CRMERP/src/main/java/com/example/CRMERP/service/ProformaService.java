package com.example.CRMERP.service;
import com.example.CRMERP.entity.BonCommande;
import com.example.CRMERP.entity.Proforma;
import com.example.CRMERP.repository.BonCommandeRepository;
import com.example.CRMERP.repository.ProformaRepository;
import com.example.CRMERP.entity.Fournisseur;
import com.example.CRMERP.repository.FournisseurRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;


@Service
public class ProformaService {
    private final BonCommandeRepository bonCommandeRepository;
    private final ProformaRepository proformaRepository;
    private final FournisseurRepository fournisseurRepository;

    public ProformaService(ProformaRepository proformaRepository, FournisseurRepository fournisseurRepository, BonCommandeRepository bonCommandeRepository) {
        this.proformaRepository = proformaRepository;
        this.fournisseurRepository = fournisseurRepository;
        this.bonCommandeRepository = bonCommandeRepository;
    }

    public List<Proforma> findAll () {
        return proformaRepository.findAll();
    }

    public Proforma save (Proforma p ) {
        return proformaRepository.save(p);
    }

    public List<Proforma> getEnAttenteValidation() {
        return proformaRepository.findByStatut("EN_ATTENTE_VALIDATION");
    }

    public List<Proforma> getAccepteList(){
        return proformaRepository.findByStatutAndLivraisonsIsEmpty("ACCEPTEE");
    }

    public Optional<Proforma> getById(Long id){
        return proformaRepository.findById(id);
    }

    public BonCommande saveBonCommandeFromProforma(Long proformaId, String decisionStatut) {
        Proforma proforma = proformaRepository.findById(proformaId)
                .orElseThrow(() -> new IllegalArgumentException("Proforma introuvable: " + proformaId));

        String normalized = normalizeDecision(decisionStatut);
        proforma.setStatut(normalized);
        proformaRepository.save(proforma);

        if (!"ACCEPTEE".equals(normalized)) {
            return null;
        }

        BonCommande bc = new BonCommande();
        bc.setDate(LocalDateTime.now());
        bc.setStatut("ENVOYE");
        bc.setProforma(proforma);

        return bonCommandeRepository.save(bc);
    }

    private String normalizeDecision(String decisionStatut) {
        if (decisionStatut == null) {
            throw new IllegalArgumentException("Le statut est obligatoire (ACCEPTEE ou REFUSEE).");
        }

        String value = decisionStatut.trim().toUpperCase();
        if ("ACCEPTE".equals(value) || "ACCEPTEE".equals(value)) {
            return "ACCEPTEE";
        }

        if ("REFUSE".equals(value) || "REFUSEE".equals(value)) {
            return "REFUSEE";
        }

        throw new IllegalArgumentException("Statut invalide. Valeurs acceptees: ACCEPTEE ou REFUSEE.");
    }

    public List<Proforma> getProformaBystatut() {
        return proformaRepository.findByStatut("ACCEPTEE");
    }

    
}
