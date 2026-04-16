package com.example.CRMERP.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;

    private String email;

    private String telephone;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }

    public void setNom(String nom) { this.nom = nom; }

    public String getEmail() { return email; }

    public void setEmail(String email) { this.email = email; }

    public String getTelephone() { return telephone; }

    public void setTelephone(String telephone) { this.telephone = telephone; }

    public Department getDepartment() { return department; }

    public void setDepartment(Department department) { this.department = department; }
}