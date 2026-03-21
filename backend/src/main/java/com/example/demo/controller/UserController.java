package com.example.demo.controller;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(UserRepository userRepository,
                          UserService userService) {
        this.userRepository = userRepository;
        this.userService    = userService;
    }

    // ✅ ADMIN — get all users
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ✅ ADMIN — update role
    @PutMapping("/{id}/role")
    @PreAuthorize("hasAuthority('ADMIN')")
    public User updateUserRole(
            @PathVariable Long id,
            @RequestParam Role role
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        return userRepository.save(user);
    }

    // ✅ GET current user info
    @GetMapping("/me")
    public ResponseEntity<User> getMe(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    // ✅ UPDATE name
    @PutMapping("/me/name")
    public ResponseEntity<User> updateName(
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        try {
            User updated = userService.updateName(auth.getName(), body.get("name"));
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ CHANGE password
    @PutMapping("/me/password")
    public ResponseEntity<Void> updatePassword(
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        try {
            userService.updatePassword(
                auth.getName(),
                body.get("currentPassword"),
                body.get("newPassword")
            );
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}