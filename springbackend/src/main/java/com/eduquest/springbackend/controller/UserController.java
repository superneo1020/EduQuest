package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.ResetEmailRequest;
import com.eduquest.springbackend.dto.ResetPasswordRequest;
import com.eduquest.springbackend.dto.ResetSchoolRequest;
import com.eduquest.springbackend.service.AuthService;
import com.eduquest.springbackend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping("/point")
    public ResponseEntity<?> getMyPoints(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.findPointsByUsername(userDetails.getUsername()));
    }

    @GetMapping("/school")
    public ResponseEntity<?> getMySchool(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.findSchoolNameByUsername(userDetails.getUsername()));
    }

    @PostMapping("/school")
    public ResponseEntity<?> updateMySchool(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ResetSchoolRequest req
    ) {
        return ResponseEntity.ok(userService.saveSchoolId(userDetails.getUsername(), req));
    }

    @GetMapping("/email")
    public ResponseEntity<?> getMyEmail(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.findEmailByUsername(userDetails.getUsername()));
    }

    @PostMapping("/email")
    public  ResponseEntity<?> updateMyEmail(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ResetEmailRequest req
    ) {
        return  ResponseEntity.ok(userService.saveEmail(userDetails.getUsername(), req));
    }

    @GetMapping("/roles")
    public ResponseEntity<?> getMyRoles(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.findRoleNamesByUsername(userDetails.getUsername()));
    }

    @PostMapping("/password")
    public ResponseEntity<?> updatePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ResetPasswordRequest req
    ) {
        return ResponseEntity.ok(authService.savePassword(userDetails.getUsername(), req));
    }
}
