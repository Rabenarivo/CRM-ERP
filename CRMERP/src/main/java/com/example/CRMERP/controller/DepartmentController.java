package com.example.CRMERP.controller;

import com.example.CRMERP.entity.Department;
import com.example.CRMERP.service.DepartmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService service;

    public DepartmentController(DepartmentService service) {
        this.service = service;
    }

    @GetMapping({"", "/list"})
    public List<Department> list() {
        return service.findAll();
    }

    @PostMapping("/save")
    public ResponseEntity<?> save(@RequestBody Department department) {
        return ResponseEntity.ok(service.save(department));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Department department) {
        Department existing = service.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("Departement introuvable: " + id);
        }

        if (department.getNom() != null) {
            existing.setNom(department.getNom());
        }
        existing.setScores(department.getScores());

        return ResponseEntity.ok(service.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Department existing = service.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("Departement introuvable: " + id);
        }

        service.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Departement supprime"));
    }

}