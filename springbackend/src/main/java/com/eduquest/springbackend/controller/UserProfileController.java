package com.eduquest.springbackend.controller;

import com.eduquest.springbackend.dto.UserProfileRequest;
import com.eduquest.springbackend.enums.ItemType;
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

    @GetMapping({"/equipped-item", "/equipped-item/{type}"})
    public ResponseEntity<?> getEquippedItems(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable(required = false) ItemType type
    ) {
        return type != null
                ? ResponseEntity.ok(userProfileService.getEquippedItems(userDetails.getId(), type))
                : ResponseEntity.ok(userProfileService.getEquippedItems(userDetails.getId()));
    }

    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getPreferences(userDetails.getId()));
    }

    @GetMapping("/privacy-settings")
    public ResponseEntity<?> getPrivacySettings(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getPrivacySettings(userDetails.getId()));
    }

    @GetMapping
    public ResponseEntity<?> getUserProfile(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getUserProfile(userDetails.getId()));
    }

    @PostMapping
    public ResponseEntity<?> updateUserProfile(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @Valid @RequestBody UserProfileRequest userProfileRequest
    ) {
        return ResponseEntity.ok(userProfileService.setUserProfile(userDetails.getId(), userProfileRequest));
    }
}
