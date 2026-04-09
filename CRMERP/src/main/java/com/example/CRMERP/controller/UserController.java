package com.example.CRMERP.controller;

import com.example.CRMERP.entity.User;
import com.example.CRMERP.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;


@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService service) {
        this.userService = service;
    }


    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {

        String email = request.get("email");
        String password = request.get("password");

        if (email == null || email.trim().isEmpty() || password == null || password.isBlank()) {
            return ResponseEntity.status(400).body("Email and password are required");
        }

        User user = userService.findByEmail(email);

        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        if (user.getPassword() == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        Map<String, Object> departmentPayload = new HashMap<>();
        departmentPayload.put("id", user.getDepartment() != null ? user.getDepartment().getId() : null);
        departmentPayload.put("nom", user.getDepartment() != null ? user.getDepartment().getNom() : null);
        departmentPayload.put("scores", user.getDepartment() != null ? String.valueOf(user.getDepartment().getScores()) : null);

        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("id", user.getId());
        userPayload.put("nom", user.getNom());
        userPayload.put("email", user.getEmail());
        userPayload.put("password", null);
        userPayload.put("enabled", user.getEnabled());
        userPayload.put("department", departmentPayload);
        userPayload.put("roles", user.getRoles());

        Map<String, Object> response = new HashMap<>();
        response.put("user", userPayload);

        return ResponseEntity.ok(response);
    }
}

