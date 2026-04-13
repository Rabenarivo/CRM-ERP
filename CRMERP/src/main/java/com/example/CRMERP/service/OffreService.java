package com.example.CRMERP.service;

import com.example.CRMERP.entity.Offre;
import com.example.CRMERP.entity.DemandeAchat;
import com.example.CRMERP.entity.Fournisseur;
import com.example.CRMERP.repository.OffresRepository;
import com.example.CRMERP.repository.DemandeAchatRepository;
import com.example.CRMERP.repository.FournisseurRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OffreService {

    private final OffresRepository offresRepository;
    private final DemandeAchatRepository demandeAchatRepository;
    private final FournisseurRepository fournisseurRepository;

    public OffreService(OffresRepository offresRepository,
                        DemandeAchatRepository demandeAchatRepository,
                        FournisseurRepository fournisseurRepository) {
        this.offresRepository = offresRepository;
        this.demandeAchatRepository = demandeAchatRepository;
        this.fournisseurRepository = fournisseurRepository;
    }


    public Offre creerOffre(Long demandeId, Long fournisseurId, Offre offre) {

        DemandeAchat demande = demandeAchatRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        Fournisseur fournisseur = fournisseurRepository.findById(fournisseurId)
                .orElseThrow(() -> new RuntimeException("Fournisseur introuvable"));

        offre.setDemande(demande);
        offre.setFournisseur(fournisseur);
        offre.setStatut("EN_ATTENTE");
        offre.setDateCreation(LocalDateTime.now());

        return offresRepository.save(offre);
    }

    public List<Offre> getOffresByDemande(Long demandeId) {
        return offresRepository.findByDemandeId(demandeId);
    }

    public List <Offre> getAllOffres (){
        return offresRepository.getAllOffres();
    }

  
}