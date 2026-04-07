package com.example.CRMERP.controller;

import com.example.CRMERP.entity.User;
import com.example.CRMERP.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }



    // @PostMapping
    // public User create(@RequestBody User u) {
    //     return service.save(u);
    // }

    @GetMapping("/email/{email}")
    public User getByEmail(@PathVariable String email) {
        return service.findByEmail(email);
    }
    @PostMapping("/auth/login")
    public String postMethodName(@RequestBody String entity) {
        
        
        return entity;
    }
    
}