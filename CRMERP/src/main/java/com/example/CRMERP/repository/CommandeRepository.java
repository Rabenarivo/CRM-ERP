package com.example.CRMERP.repository;

import com.example.CRMERP.entity.Commande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

}
