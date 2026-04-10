package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.UserProfileRequest;
import com.eduquest.springbackend.service.AppUserDetails;
import com.eduquest.springbackend.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/profile")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/")
    public ResponseEntity<?> getUserProfile(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getUserProfile(userDetails.getId()));
    }

    @PostMapping("/")
    public ResponseEntity<?> updateUserProfile(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @Valid @RequestBody UserProfileRequest userProfileRequest
    ) {
        return ResponseEntity.ok(userProfileService.setUserProfile(userDetails.getId(), userProfileRequest));
    }
}
