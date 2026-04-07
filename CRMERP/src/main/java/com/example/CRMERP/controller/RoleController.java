package com.example.CRMERP.controller;

import com.example.CRMERP.entity.Role;
import com.example.CRMERP.service.RoleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService service;

    public RoleController(RoleService service) {
        this.service = service;
    }

}