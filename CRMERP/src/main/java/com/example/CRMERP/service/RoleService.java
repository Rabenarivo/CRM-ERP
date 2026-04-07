package com.example.CRMERP.service;

import com.example.CRMERP.entity.Role;
import com.example.CRMERP.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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
}