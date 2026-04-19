package com.example.CRMERP.controller;

import com.example.CRMERP.entity.Department;
import com.example.CRMERP.entity.User;
import com.example.CRMERP.entity.Role;
import com.example.CRMERP.service.DepartmentService;
import com.example.CRMERP.service.UserService;
import com.example.CRMERP.service.RoleService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;


@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final DepartmentService departmentService;
    private final RoleService roleService;

    public UserController(UserService service, DepartmentService departmentService, RoleService roleService) {
        this.userService = service;
        this.departmentService = departmentService;
        this.roleService = roleService;
    }

    @GetMapping({"", "/list"})
    public List<User> list() {
        return userService.findAll();
    }

    @PostMapping("/save")
    public ResponseEntity<?> save(@RequestBody Map<String, Object> request) {
        User user = new User();
        applyUserRequest(user, request, false);
        return ResponseEntity.ok(userService.save(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        User existing = userService.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("Utilisateur introuvable: " + id);
        }

        applyUserRequest(existing, request, true);
        return ResponseEntity.ok(userService.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        User existing = userService.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("Utilisateur introuvable: " + id);
        }

        userService.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Utilisateur supprime"));
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

        Map<String, Object> entreprisePayload = new HashMap<>();
        entreprisePayload.put("id", user.getEntreprise() != null ? user.getEntreprise().getId() : null);
        entreprisePayload.put("nom", user.getEntreprise() != null ? user.getEntreprise().getNom() : null);
        entreprisePayload.put("email", user.getEntreprise() != null ? user.getEntreprise().getEmail() : null);

        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("id", user.getId());
        userPayload.put("nom", user.getNom());
        userPayload.put("email", user.getEmail());
        userPayload.put("password", null);
        userPayload.put("enabled", user.getEnabled());
        userPayload.put("department", departmentPayload);
        userPayload.put("entreprise", entreprisePayload);
        userPayload.put("roles", user.getRoles());

        Map<String, Object> response = new HashMap<>();
        response.put("user", userPayload);

        return ResponseEntity.ok(response);
    }

    private void applyUserRequest(User user, Map<String, Object> request, boolean keepPasswordIfMissing) {
        if (request.get("nom") != null) {
            user.setNom(request.get("nom").toString());
        }

        if (request.get("email") != null) {
            user.setEmail(request.get("email").toString());
        }

        Object passwordObj = request.get("password");
        if (passwordObj != null && !passwordObj.toString().isBlank()) {
            user.setPassword(passwordObj.toString());
        } else if (!keepPasswordIfMissing) {
            user.setPassword(null);
        }

        if (request.get("enabled") != null) {
            user.setEnabled(Boolean.valueOf(request.get("enabled").toString()));
        }

        Object departmentIdObj = request.get("departmentId");
        if (departmentIdObj != null) {
            Department department = departmentService.findById(Long.valueOf(departmentIdObj.toString()));
            if (department == null) {
                throw new IllegalArgumentException("Departement introuvable: " + departmentIdObj);
            }
            user.setDepartment(department);
        }

        Set<Role> roles = new HashSet<>();
        Object roleIdObj = request.get("roleId");
        if (roleIdObj != null) {
            Role role = roleService.findById(Long.valueOf(roleIdObj.toString()))
                .orElseThrow(() -> new IllegalArgumentException("Role introuvable: " + roleIdObj));
            roles.add(role);
        }

        Object roleIdsObj = request.get("roleIds");
        if (roleIdsObj instanceof List<?> roleIdsList) {
            for (Object roleIdItem : roleIdsList) {
                Role role = roleService.findById(Long.valueOf(roleIdItem.toString()))
                    .orElseThrow(() -> new IllegalArgumentException("Role introuvable: " + roleIdItem));
                roles.add(role);
            }
        }

        if (!roles.isEmpty()) {
            user.setRoles(roles);
        }
    }
}

