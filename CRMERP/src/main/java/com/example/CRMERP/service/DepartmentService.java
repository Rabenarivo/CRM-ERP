package com.example.CRMERP.service;

import com.example.CRMERP.entity.Department;
import com.example.CRMERP.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository repo;

    public DepartmentService(DepartmentRepository repo) {
        this.repo = repo;
    }

    public List<Department> findAll() {
        return repo.findAll();
    }

    public Department save(Department d) {
        return repo.save(d);
    }


    public Department findById(Long id) {
        return repo.findById(id).orElse(null);
    }
}