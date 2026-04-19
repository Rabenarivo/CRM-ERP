package com.example.CRMERP.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "produits")
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;

    private Double prix;

    @Column(name = "stock")
    private Integer stock = 0;

    @Column(name = "stock_disponible")
    private Integer stockDisponible = 0;

    @Column(name = "stock_reserve")
    private Integer stockReserve = 0;

    @Column(name = "stock_min")
    private Integer stockMin = 0;

    @ManyToOne(optional = true)
    @JoinColumn(name = "department_id")
    private Department department;

    @OneToMany(mappedBy = "produit", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<StockMovement> stockMovements;

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }

    public void setNom(String nom) { this.nom = nom; }

    public Double getPrix() { return prix; }

    public void setPrix(Double prix) { this.prix = prix; }

    public Integer getStock() { return stock; }

    public void setStock(Integer stock) { this.stock = stock; }

    public Integer getStockDisponible() { return stockDisponible; }

    public void setStockDisponible(Integer stockDisponible) {
        this.stockDisponible = stockDisponible;
    }

    public Integer getStockReserve() { return stockReserve; }

    public void setStockReserve(Integer stockReserve) {
        this.stockReserve = stockReserve;
    }

    public Integer getStockMin() { return stockMin; }

    public void setStockMin(Integer stockMin) {
        this.stockMin = stockMin;
    }

    public Department getDepartment() { return department; }

    public void setDepartment(Department department) { this.department = department; }

    public List<StockMovement> getStockMovements() { return stockMovements; }

    public void setStockMovements(List<StockMovement> stockMovements) {
        this.stockMovements = stockMovements;
    }

    @Transient
    public Integer getStockPhysique() {
        int dispo = stockDisponible == null ? 0 : stockDisponible;
        int reserve = stockReserve == null ? 0 : stockReserve;
        return dispo + reserve;
    }
}