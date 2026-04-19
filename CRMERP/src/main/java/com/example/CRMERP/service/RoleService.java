package com.example.CRMERP.service;

import com.example.CRMERP.entity.Role;
import com.example.CRMERP.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleService {

    private final RoleRepository repo;

    public RoleService(RoleRepository repo) {
        this.repo = repo;
    }

    public List<Role> findAll() {
        return repo.findAll();
    }

    public Role save(Role r) {
        return repo.save(r);
    }

    public Optional<Role> findById(Long id) {
        return repo.findById(id);
    }
}