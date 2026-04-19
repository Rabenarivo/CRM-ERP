package com.example.CRMERP.controller;

import com.example.CRMERP.entity.Role;
import com.example.CRMERP.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService service;

    public RoleController(RoleService service) {
        this.service = service;
    }

    @GetMapping({"", "/list"})
    public List<Role> list() {
        return service.findAll();
    }

    @PostMapping("/save")
    public ResponseEntity<Role> save(@RequestBody Role role) {
        return ResponseEntity.ok(service.save(role));
    }

}