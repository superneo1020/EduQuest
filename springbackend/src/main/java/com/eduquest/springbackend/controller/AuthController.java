package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.AuthResponse;
import com.eduquest.springbackend.model.AppUser;
import com.eduquest.springbackend.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 20) String username,
            @NotBlank @Email @Size(max = 50) String email,
            @NotBlank @Size(max = 255) String password
    ) {}

    public record LoginRequest(
            @NotBlank @Size(max = 20) String username,
            @NotBlank @Size(max = 255) String password
    ) {}

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        AppUser savedUser = authService.register(new AppUser(
                req.username().trim(),
                req.email().trim(),
                req.password()
        ));
        return ResponseEntity.ok(Map.of(
                "id", savedUser.getId(),
                "username", savedUser.getUsername(),
                "email", savedUser.getEmail())
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse authResponse = authService.loginAndGetUser(req.username().trim(), req.password());
        return ResponseEntity.ok(Map.of(
                "token", authResponse.token(),
                "user", authResponse.user()
        ));
    }
}