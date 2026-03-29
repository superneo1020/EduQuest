package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.Size;

import java.util.Map;

public record UserProfileRequest(
        @Size(max = 50)
        String nickname,

        Map<String, Long> equippedItems,
        ProfilePreferencesDto preferences,
        ProfilePrivacySettingsDto privacySettings
) {
}
