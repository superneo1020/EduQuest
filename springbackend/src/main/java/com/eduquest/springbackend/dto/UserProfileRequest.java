package com.eduquest.springbackend.dto;

import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * User profile request
 * @param nickname
 * @param equippedItems
 * @param preferences
 * @param privacySettings
 */
public record UserProfileRequest(
        @Size(max = 50)
        String nickname,

        Map<String, Long> equippedItems,
        ProfilePreferencesDto preferences,
        ProfilePrivacySettingsDto privacySettings
) {
}
