package com.example.CRMERP.service;

import com.example.CRMERP.entity.User;
import com.example.CRMERP.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    public User findByEmail(String email) {
        return repo.findByEmail(email).orElse(null);
    }
}