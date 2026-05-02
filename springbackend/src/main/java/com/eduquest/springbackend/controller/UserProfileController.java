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

    /**
     * Retrieves equipped items for the current user's profile.
     * Returns all equipped items or filtered by specific item type if provided.
     */
    @GetMapping({"/equipped-item", "/equipped-item/{type}"})
    public ResponseEntity<?> getEquippedItems(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @PathVariable(required = false) ItemType type
    ) {
        return type != null
                ? ResponseEntity.ok(userProfileService.getEquippedItems(userDetails.getId(), type))
                : ResponseEntity.ok(userProfileService.getEquippedItems(userDetails.getId()));
    }

    /**
     * Retrieves the current user's profile preferences.
     * Returns user-specific settings and display preferences.
     */
    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getPreferences(userDetails.getId()));
    }

    /**
     * Retrieves the current user's privacy settings.
     * Returns privacy configuration for profile visibility and data sharing.
     */
    @GetMapping("/privacy-settings")
    public ResponseEntity<?> getPrivacySettings(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getPrivacySettings(userDetails.getId()));
    }

    /**
     * Retrieves the current user's complete profile information.
     * Returns comprehensive profile data including personal details and preferences.
     */
    @GetMapping
    public ResponseEntity<?> getUserProfile(@AuthenticationPrincipal AppUserDetails userDetails) {
        return ResponseEntity.ok(userProfileService.getUserProfile(userDetails.getId()));
    }

    /**
     * Updates the current user's profile information.
     * Allows modification of personal details, preferences, and settings.
     */
    @PostMapping
    public ResponseEntity<?> updateUserProfile(
            @AuthenticationPrincipal AppUserDetails userDetails,
            @Valid @RequestBody UserProfileRequest userProfileRequest
    ) {
        return ResponseEntity.ok(userProfileService.setUserProfile(userDetails.getId(), userProfileRequest));
    }
}
