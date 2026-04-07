package com.example.CRMERP.controller;

import com.example.CRMERP.entity.User;
import com.example.CRMERP.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

@PostMapping("/login")
public ResponseEntity<?> login(@RequestParam String email,
                               @RequestParam String password) {

    User user = userService.findByEmail(email);

    if (user != null && user.getPassword().equals(password)) {
        return ResponseEntity.ok(user);
    }

    return ResponseEntity.status(401).body("Invalid credentials");
}
}