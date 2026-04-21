package com.example.CRMERP.repository;

import com.example.CRMERP.entity.Facture;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FactureRepository extends JpaRepository<Facture,Long>{
	List<Facture> findByClientIdOrderByDateFactureDesc(Long clientId);
	List<Facture> findAllByOrderByDateFactureDesc();
}
