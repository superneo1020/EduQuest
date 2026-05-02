package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.LoginRequest;
import com.eduquest.springbackend.dto.RegisterRequest;
import com.eduquest.springbackend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Registers a new user in the system.
     * Accepts user registration details and creates a new account.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    /**
     * Authenticates a user and returns authentication token with user details.
     * Accepts login credentials and validates them against the system.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.loginAndGetUser(req.username().trim(), req.password()));
    }
}