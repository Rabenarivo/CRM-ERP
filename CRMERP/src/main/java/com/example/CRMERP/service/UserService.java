package com.example.CRMERP.service;

import com.example.CRMERP.entity.User;
import com.example.CRMERP.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    public User findByEmail(String email) {
        if (email == null) {
            return null;
        }

        String normalizedEmail = email.trim();
        if (normalizedEmail.isEmpty()) {
            return null;
        }

        return repo.findByEmailIgnoreCase(normalizedEmail).orElse(null);
    }

    public User findById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public List<User> findAll() {
        return repo.findAll();
    }

    public User save(User user) {
        return repo.save(user);
    }

    public void deleteById(Long id) {
        repo.deleteById(id);
    }
    
}