package com.example.CRMERP.service;

import com.example.CRMERP.entity.DemandeAchat;
import com.example.CRMERP.entity.Department;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.repository.DemandeAchatRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DemandeAchatService {

        private final DemandeAchatRepository repo;

        public DemandeAchatService(DemandeAchatRepository repo) {
            this.repo = repo;
        }


        public List<DemandeAchat> findAll() {
            return repo.findAll();
        }

        public DemandeAchat save(DemandeAchat d) {
            return repo.save(d);
        }

        public DemandeAchat updateStatut(Long id, String statut) {
            DemandeAchat demande = findById(id);
            if (demande == null) {
                return null;
            }

            demande.setStatut(statut);
            return repo.save(demande);
        }

       public DemandeAchat findById(Long id) {
            return repo.findById(id).orElse(null);
        }


}
