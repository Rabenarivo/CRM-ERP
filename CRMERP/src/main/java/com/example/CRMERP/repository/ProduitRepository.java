package com.example.CRMERP.repository;
import com.example.CRMERP.entity.Produit;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProduitRepository extends JpaRepository<Produit, Long> {

@Query("SELECT p FROM Produit p WHERE LOWER(TRIM(p.nom)) LIKE LOWER(CONCAT('%', TRIM(:nom), '%'))")
List<Produit> searchByName(@Param("nom") String nom);

Optional<Produit> findByNomIgnoreCaseAndDepartment_Id(String nom, Long departmentId);

Optional<Produit> findFirstByNomIgnoreCaseOrderByIdAsc(String nom);

Optional<Produit> findByNomIgnoreCaseAndDepartmentIsNull(String nom);

Optional<Produit> findFirstByNomIgnoreCaseAndDepartmentIsNullOrderByIdAsc(String nom);
   
}
