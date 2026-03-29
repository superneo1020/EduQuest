package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.UserProfileRequest;
import com.eduquest.springbackend.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/profile")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/")
    public ResponseEntity<?> getUserProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getUserProfile(userDetails.getUsername()));
    }

    @PostMapping("/")
    public ResponseEntity<?> updateUserProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserProfileRequest userProfileRequest
    ) {
        return ResponseEntity.ok(userProfileService.setUserProfile(userDetails.getUsername(), userProfileRequest));
    }
}
